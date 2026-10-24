-- REVIEW DRAFT ONLY: not executed, not an automatic deployment step.
-- Requires 20261025 registration initialization and compatible signup, login,
-- author application and admin review code, all independently accepted first.
-- Coordinate registration cutover; old browser INSERT/role/approval writes fail.
-- Independently verify the project and export data + table/column ACLs, policies,
-- role memberships, trigger/function definitions and owners before approval.
-- SQL cannot identify the intended Supabase project or verify deployed UI code.
-- Additional conservative guards below (grantors, grant options, inherited roles,
-- views/RPCs) are prerequisites to verify, NOT claims about live production.
-- Any mismatch requires manual review. Never drop unknown policies or widen grants.
-- Use ON_ERROR_STOP. On error ROLLBACK/disconnect; do not continue or retry blindly.
-- No data changes/backfill. After commit, restore compatible code or use a separately
-- reviewed corrective migration; NEVER restore old public writes or a whole DB dump.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path = pg_catalog;
LOCK TABLE public.user_profiles IN ACCESS EXCLUSIVE MODE;

DO $preflight$
DECLARE
  t oid := 'public.user_profiles'::regclass;
  owner_oid oid;
  auth_oid oid;
  uid_col smallint;
  role_type_oid oid;
  initializer oid;
  role_name text;
  expected_privileges text[];
BEGIN
  SELECT c.relowner INTO owner_oid FROM pg_catalog.pg_class c
    WHERE c.oid=t AND c.relkind='r' AND c.relrowsecurity AND NOT c.relforcerowsecurity;
  IF owner_oid IS NULL OR pg_catalog.pg_get_userbyid(owner_oid) <> 'postgres'
    OR current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Expected postgres-owned ordinary RLS table, FORCE RLS false, trusted installer';
  END IF;
  SELECT oid INTO STRICT auth_oid FROM pg_catalog.pg_roles WHERE rolname='authenticated';
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=role_name AND NOT rolsuper AND NOT rolbypassrls)
      OR pg_catalog.pg_has_role(role_name,owner_oid,'MEMBER')
      OR pg_catalog.pg_has_role(role_name,'service_role','MEMBER')
      OR pg_catalog.pg_has_role(role_name,CASE WHEN role_name='anon' THEN 'authenticated' ELSE 'anon' END,'MEMBER') THEN
      RAISE EXCEPTION 'Client missing, privileged, or can assume trusted role';
    END IF;
    IF NOT pg_catalog.has_schema_privilege(role_name,'public','USAGE') THEN
      RAISE EXCEPTION 'Missing existing public schema usage';
    END IF;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='service_role' AND rolbypassrls)
    OR NOT pg_catalog.has_schema_privilege('service_role','public','USAGE')
    OR NOT pg_catalog.has_schema_privilege('authenticated','auth','USAGE')
    OR pg_catalog.to_regprocedure('auth.uid()') IS NULL
    OR NOT pg_catalog.has_function_privilege('authenticated','auth.uid()','EXECUTE') THEN
    RAISE EXCEPTION 'Missing existing trusted server or Auth identity privileges';
  END IF;
  IF NOT pg_catalog.has_table_privilege('service_role',t,'SELECT')
    OR NOT pg_catalog.has_table_privilege('service_role',t,'INSERT')
    OR NOT pg_catalog.has_table_privilege('service_role',t,'UPDATE') THEN
    RAISE EXCEPTION 'Server privileges must already exist; not granted automatically';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid=t AND attname='id'
      AND atttypid='uuid'::regtype AND attnotnull AND atthasdef AND NOT attisdropped)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid=t AND attname='user_id'
      AND atttypid='uuid'::regtype AND attnotnull AND NOT attisdropped)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid=t AND attname='user_name'
      AND atttypid IN ('text'::regtype,'varchar'::regtype) AND NOT attnotnull AND NOT attisdropped)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid=t AND attname='email'
      AND atttypid='text'::regtype AND attnotnull AND NOT attisdropped)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid=t AND attname='is_approved'
      AND atttypid='boolean'::regtype AND attnotnull AND NOT attisdropped) THEN
    RAISE EXCEPTION 'Unexpected protected or editable field structure';
  END IF;
  SELECT attnum INTO STRICT uid_col FROM pg_catalog.pg_attribute
    WHERE attrelid=t AND attname='user_id' AND NOT attisdropped;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid=t AND contype='p'
      AND conkey=ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid=t AND attname='id')])
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid=t AND contype='u'
      AND conkey=ARRAY[uid_col] AND convalidated AND NOT condeferrable)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid=t AND contype='f'
      AND conkey=ARRAY[uid_col] AND confrelid='auth.users'::regclass AND convalidated
      AND confkey=ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid='auth.users'::regclass AND attname='id')]
      AND confdeltype='c') THEN
    RAISE EXCEPTION 'Unexpected profile identity constraints';
  END IF;
  SELECT atttypid INTO STRICT role_type_oid FROM pg_catalog.pg_attribute
    WHERE attrelid=t AND attname='role' AND attnotnull AND NOT attisdropped;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type WHERE oid=role_type_oid AND typtype='e' AND typname='role_type')
    OR (SELECT array_agg(enumlabel::text ORDER BY enumlabel::text) FROM pg_catalog.pg_enum WHERE enumtypid=role_type_oid)
      IS DISTINCT FROM ARRAY['admin','author','reader']::text[] THEN
    RAISE EXCEPTION 'Unexpected profile role enum';
  END IF;

  -- Exact four-policy baseline. After whitespace/parenthesis removal, accept
  -- only the two reviewed own-user forms: direct auth.uid() equality or
  -- (( SELECT auth.uid() AS uid) = user_id). No generic SELECT/alias stripping.
  -- Any other expression, extra condition or policy still requires review.
  IF (SELECT count(*) FROM pg_catalog.pg_policy WHERE polrelid=t) <> 4 OR EXISTS (
    SELECT 1 FROM (VALUES
      ('Enable insert for authenticated users only','a',ARRAY[auth_oid],NULL::text,'true'),
      ('Enable insert for users based on user_id','a',ARRAY[0::oid],NULL::text,'auth.uid=user_id'),
      ('Enable read access for all users','*',ARRAY[0::oid],'true',NULL::text),
      ('Enable users to view their own data only','r',ARRAY[auth_oid],'auth.uid=user_id',NULL::text)
    ) expected(name,cmd,roles,qual,check_expr)
    LEFT JOIN pg_catalog.pg_policy p ON p.polrelid=t AND p.polname=expected.name
    WHERE p.oid IS NULL OR NOT p.polpermissive OR p.polcmd::text<>expected.cmd
      OR p.polroles IS DISTINCT FROM expected.roles
      OR CASE pg_catalog.regexp_replace(pg_catalog.pg_get_expr(p.polqual,t),'[[:space:]()]','','g')
           WHEN 'SELECTauth.uidASuid=user_id' THEN 'auth.uid=user_id'
           ELSE pg_catalog.regexp_replace(pg_catalog.pg_get_expr(p.polqual,t),'[[:space:]()]','','g')
         END IS DISTINCT FROM expected.qual
      OR CASE pg_catalog.regexp_replace(pg_catalog.pg_get_expr(p.polwithcheck,t),'[[:space:]()]','','g')
           WHEN 'SELECTauth.uidASuid=user_id' THEN 'auth.uid=user_id'
           ELSE pg_catalog.regexp_replace(pg_catalog.pg_get_expr(p.polwithcheck,t),'[[:space:]()]','','g')
         END IS DISTINCT FROM expected.check_expr
  ) THEN
    RAISE EXCEPTION 'Unreviewed four-policy baseline; no policy changed';
  END IF;

  -- Derive version-supported table privileges from PostgreSQL itself, including
  -- MAINTAIN where available. Never parse a static GRANT/REVOKE MAINTAIN on old PG.
  SELECT array_agg(DISTINCT privilege_type ORDER BY privilege_type) INTO expected_privileges
    FROM pg_catalog.aclexplode(pg_catalog.acldefault('r',owner_oid));
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF (SELECT array_agg(DISTINCT a.privilege_type ORDER BY a.privilege_type)
      FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) a
      WHERE c.oid=t AND a.grantee=(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=role_name))
      IS DISTINCT FROM expected_privileges THEN
      RAISE EXCEPTION 'Unexpected explicit client table ACL baseline';
    END IF;
  END LOOP;
  -- Known roles only; unfamiliar grantors/grant options require separate review.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) a
    WHERE c.oid=t AND (a.grantor<>owner_oid OR a.grantee NOT IN (0,owner_oid,auth_oid,
      (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='anon'),
      (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role'))
      OR (a.is_grantable AND a.grantee<>owner_oid)))
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_attribute att CROSS JOIN LATERAL pg_catalog.aclexplode(att.attacl) a
      WHERE att.attrelid=t AND att.attnum>0 AND NOT att.attisdropped AND
      (a.grantor<>owner_oid OR a.grantee NOT IN (0,owner_oid,auth_oid,
        (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='anon'),
        (SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role'))
        OR (a.is_grantable AND a.grantee<>owner_oid))) THEN
    RAISE EXCEPTION 'Unreviewed ACL grantee, grantor or grant option';
  END IF;
  -- Unexpected role memberships must not leave inherited ACLs behind. Only
  -- directly reviewed role/PUBLIC grants may provide effective write rights.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles parent
    CROSS JOIN (VALUES ('anon'),('authenticated')) child(name)
    WHERE parent.rolname NOT IN ('anon','authenticated')
      AND pg_catalog.pg_has_role(child.name,parent.oid,'MEMBER')
      AND (parent.rolsuper OR parent.rolbypassrls
        OR parent.rolname IN ('pg_write_all_data','pg_maintain') OR EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(c.relacl) a
        WHERE c.oid=t AND a.grantee=parent.oid AND a.privilege_type<>'SELECT'
      ) OR EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute att CROSS JOIN LATERAL pg_catalog.aclexplode(att.attacl) a
        WHERE att.attrelid=t AND att.attnum>0 AND NOT att.attisdropped
          AND a.grantee=parent.oid AND a.privilege_type<>'SELECT'
      ))) THEN
    RAISE EXCEPTION 'Unreviewed inherited write privileges';
  END IF;

  -- Require the reviewed registration trigger to be installed first. Do not
  -- replace it or invoke it; only inspect its existing security properties.
  initializer := pg_catalog.to_regprocedure('public.initialize_registered_user_profile()');
  IF initializer IS NULL OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=initializer
      AND p.prosecdef AND p.proowner=owner_oid AND 'search_path=pg_catalog'=ANY(p.proconfig))
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid='auth.users'::regclass
      AND tgname='initialize_registered_user_profile_after_insert' AND tgfoid=initializer
      AND tgtype=5 AND tgenabled='O' AND NOT tgisinternal)
    OR (SELECT count(*) FROM pg_catalog.pg_trigger WHERE tgrelid='auth.users'::regclass AND NOT tgisinternal)<>1
    OR pg_catalog.has_function_privilege('anon',initializer,'EXECUTE')
    OR pg_catalog.has_function_privilege('authenticated',initializer,'EXECUTE')
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid=t AND NOT tgisinternal)
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_rewrite WHERE ev_class=t) THEN
    RAISE EXCEPTION 'Missing reviewed initializer or unexpected profile trigger/rule';
  END IF;
  -- Bounded candidate check, not proof against arbitrary dynamic SQL/wrappers.
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE p.prosecdef AND p.prokind='f' AND
      ((n.nspname IN ('public','auth') AND p.prosrc ILIKE '%user_profiles%') OR EXISTS(
        SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid='pg_catalog.pg_proc'::regclass
          AND d.objid=p.oid AND d.refclassid='pg_catalog.pg_class'::regclass AND d.refobjid=t))
      AND (pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE')
        OR pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE'))) THEN
    RAISE EXCEPTION 'Client-callable profile SECURITY DEFINER candidate requires review';
  END IF;
  IF EXISTS(
    WITH RECURSIVE views(oid,path) AS (
      SELECT t,ARRAY[t]
      UNION ALL
      SELECT c.oid,v.path||c.oid FROM views v
      JOIN pg_catalog.pg_depend d ON d.refclassid='pg_catalog.pg_class'::regclass AND d.refobjid=v.oid
        AND d.classid='pg_catalog.pg_rewrite'::regclass
      JOIN pg_catalog.pg_rewrite rw ON rw.oid=d.objid
      JOIN pg_catalog.pg_class c ON c.oid=rw.ev_class
      WHERE c.relkind='v' AND NOT c.oid=ANY(v.path)
    )
    SELECT 1 FROM views v CROSS JOIN (VALUES ('anon'),('authenticated')) r(name)
    WHERE v.oid<>t AND pg_catalog.pg_relation_is_updatable(v.oid,true)<>0 AND
      (pg_catalog.has_any_column_privilege(r.name,v.oid,'INSERT')
       OR pg_catalog.has_any_column_privilege(r.name,v.oid,'UPDATE')
       OR pg_catalog.has_table_privilege(r.name,v.oid,'DELETE'))
  ) THEN RAISE EXCEPTION 'Client-writable dependent view requires review'; END IF;
END;
$preflight$;

-- ALL is version-aware and also revokes MAINTAIN where PostgreSQL supports it.
-- Table REVOKE does not revoke column ACLs: explicitly clear every column too.
REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM PUBLIC, anon, authenticated;
DO $columns$
DECLARE columns_sql text;
BEGIN
  SELECT string_agg(quote_ident(attname),', ' ORDER BY attnum) INTO columns_sql
    FROM pg_catalog.pg_attribute WHERE attrelid='public.user_profiles'::regclass
      AND attnum>0 AND NOT attisdropped;
  EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON TABLE public.user_profiles FROM PUBLIC, anon, authenticated',columns_sql);
END;
$columns$;

DROP POLICY "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY "Enable insert for users based on user_id" ON public.user_profiles;
DROP POLICY "Enable read access for all users" ON public.user_profiles;
DROP POLICY "Enable users to view their own data only" ON public.user_profiles;

-- Preserve existing broad reads for current website compatibility, including
-- public author/comment display. This does NOT solve profile-data read privacy.
CREATE POLICY profile_compatible_read ON public.user_profiles FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY profile_own_name_update ON public.user_profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
GRANT SELECT ON TABLE public.user_profiles TO anon, authenticated;
GRANT UPDATE (user_name) ON TABLE public.user_profiles TO authenticated;
-- service_role ACL, BYPASSRLS, registration function and data remain unchanged.

DO $postflight$
DECLARE t oid := 'public.user_profiles'::regclass; r text; p text; col record;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOR p IN SELECT DISTINCT privilege_type FROM pg_catalog.aclexplode(
      pg_catalog.acldefault('r',(SELECT relowner FROM pg_catalog.pg_class WHERE oid=t)))
      WHERE privilege_type <> 'SELECT' LOOP
      IF pg_catalog.has_table_privilege(r,t,p) THEN
        RAISE EXCEPTION 'Residual effective client table write/maintenance privilege';
      END IF;
    END LOOP;
    IF NOT pg_catalog.has_table_privilege(r,t,'SELECT')
      OR pg_catalog.has_table_privilege(r,t,'SELECT WITH GRANT OPTION') THEN
      RAISE EXCEPTION 'Unexpected client SELECT privilege';
    END IF;
    FOR col IN SELECT attnum,attname FROM pg_catalog.pg_attribute WHERE attrelid=t AND attnum>0 AND NOT attisdropped LOOP
      IF pg_catalog.has_column_privilege(r,t,col.attnum,'INSERT')
        OR pg_catalog.has_column_privilege(r,t,col.attnum,'REFERENCES')
        OR pg_catalog.has_column_privilege(r,t,col.attnum,'UPDATE') IS DISTINCT FROM (r='authenticated' AND col.attname='user_name')
        OR pg_catalog.has_column_privilege(r,t,col.attnum,'UPDATE WITH GRANT OPTION') THEN
        RAISE EXCEPTION 'Residual effective client column privilege';
      END IF;
    END LOOP;
  END LOOP;
  IF NOT pg_catalog.has_table_privilege('service_role',t,'SELECT')
    OR NOT pg_catalog.has_table_privilege('service_role',t,'INSERT')
    OR NOT pg_catalog.has_table_privilege('service_role',t,'UPDATE')
    OR (SELECT count(*) FROM pg_catalog.pg_policy WHERE polrelid=t)<>2
    OR NOT (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_catalog.pg_class WHERE oid=t) THEN
    RAISE EXCEPTION 'Server compatibility or final RLS configuration mismatch';
  END IF;
END;
$postflight$;
COMMIT;
