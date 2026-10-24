-- DRAFT ONLY. No execution authorized. Coordinate with both new signup forms.
-- Pause registration during cutover: old forms would attempt duplicate INSERTs.
-- Future Auth INSERTs only. No backfill, profile overwrite or existing RLS change.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE auth.users, public.user_profiles IN SHARE ROW EXCLUSIVE MODE;

DO $preflight$
DECLARE uid_col smallint; role_oid oid; col text;
BEGIN
  IF current_user <> 'postgres' OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=current_user AND (rolsuper OR rolbypassrls)
  ) OR pg_catalog.pg_has_role('anon',current_user,'MEMBER')
    OR pg_catalog.pg_has_role('authenticated',current_user,'MEMBER') THEN
    RAISE EXCEPTION 'Trusted postgres owner with RLS bypass required';
  END IF;
  IF NOT pg_catalog.has_table_privilege(current_user,'auth.users','TRIGGER')
    OR NOT pg_catalog.has_table_privilege(current_user,'public.user_profiles','INSERT') THEN
    RAISE EXCEPTION 'Missing existing trigger/profile privileges; stop';
  END IF;
  IF pg_catalog.to_regprocedure('public.initialize_registered_user_profile()') IS NOT NULL
    OR EXISTS(SELECT 1 FROM pg_catalog.pg_trigger
      WHERE tgrelid IN ('auth.users'::regclass,'public.user_profiles'::regclass) AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Existing trigger/function requires review; do not replace';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class WHERE oid='public.user_profiles'::regclass AND relkind='r') THEN
    RAISE EXCEPTION 'Expected ordinary profile table';
  END IF;
  FOREACH col IN ARRAY ARRAY['id','user_id'] LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.user_profiles'::regclass
      AND attname=col AND atttypid='uuid'::regtype AND attnotnull AND NOT attisdropped) THEN
      RAISE EXCEPTION 'Unexpected UUID column structure';
    END IF;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.user_profiles'::regclass
      AND attname='id' AND atthasdef AND NOT attisdropped)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.user_profiles'::regclass
      AND attname='email' AND atttypid='text'::regtype AND attnotnull AND NOT attisdropped)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.user_profiles'::regclass
      AND attname='is_approved' AND atttypid='boolean'::regtype AND attnotnull AND NOT attisdropped)
    OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.user_profiles'::regclass
      AND attname='user_name' AND atttypid IN ('text'::regtype,'varchar'::regtype)
      AND NOT attnotnull AND NOT attisdropped) THEN
    RAISE EXCEPTION 'Unexpected profile field structure';
  END IF;
  SELECT attnum INTO STRICT uid_col FROM pg_catalog.pg_attribute
    WHERE attrelid='public.user_profiles'::regclass AND attname='user_id' AND NOT attisdropped;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_constraint WHERE conrelid='public.user_profiles'::regclass
    AND contype='u' AND conkey=ARRAY[uid_col] AND NOT condeferrable AND convalidated) THEN
    RAISE EXCEPTION 'Expected immediate unique user_id constraint';
  END IF;
  SELECT atttypid INTO STRICT role_oid FROM pg_catalog.pg_attribute
    WHERE attrelid='public.user_profiles'::regclass AND attname='role' AND attnotnull AND NOT attisdropped;
  IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type WHERE oid=role_oid AND typtype='e')
    OR (SELECT array_agg(enumlabel::text ORDER BY enumlabel::text) FROM pg_catalog.pg_enum WHERE enumtypid=role_oid)
      IS DISTINCT FROM ARRAY['admin','author','reader']::text[] THEN
    RAISE EXCEPTION 'Unexpected role enum';
  END IF;
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.user_profiles'::regclass
    AND attnum>0 AND NOT attisdropped AND attnotnull AND NOT atthasdef
    AND attidentity='' AND attgenerated=''
    AND attname NOT IN ('user_id','email','role','is_approved','user_name')) THEN
    RAISE EXCEPTION 'Additional required field without default; review before installing';
  END IF;
END;
$preflight$;

CREATE FUNCTION public.initialize_registered_user_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $function$
BEGIN
  IF TG_RELID <> 'auth.users'::regclass OR TG_OP <> 'INSERT' OR TG_WHEN <> 'AFTER' OR TG_LEVEL <> 'ROW' THEN
    RAISE EXCEPTION 'Invalid profile initialization context';
  END IF;
  IF NEW.id IS NULL OR NEW.email IS NULL OR btrim(NEW.email)='' THEN
    RAISE EXCEPTION 'Email registration identity required';
  END IF;
  -- Auth supplies identity/email. Metadata is untrusted display data only.
  -- Never copy role, user_id, approval, id or author intent into access fields.
  INSERT INTO public.user_profiles(user_id,email,role,is_approved,user_name)
  VALUES (NEW.id,NEW.email,'reader',false,
    CASE WHEN jsonb_typeof(NEW.raw_user_meta_data->'user_name')='string'
      THEN NEW.raw_user_meta_data->>'user_name' ELSE NULL END)
  ON CONFLICT (user_id) DO NOTHING;
  -- Existing profiles remain intact. Other constraint errors abort Auth's INSERT.
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.initialize_registered_user_profile() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER initialize_registered_user_profile_after_insert
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.initialize_registered_user_profile();
COMMIT;
