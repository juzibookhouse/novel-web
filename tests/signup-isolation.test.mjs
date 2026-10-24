// Offline component execution plus SQL contracts. Does NOT execute a database trigger.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
const readerSource = await readFile(new URL('../src/lib/components/SignupForm.svelte', import.meta.url), 'utf8');
const authorSource = await readFile(new URL('../src/lib/components/AuthorSignupForm.svelte', import.meta.url), 'utf8');
const migration = await readFile(new URL('../migrations/20261025_user_profiles_registration.sql', import.meta.url), 'utf8');
async function fixture(kind='reader', options={}) {
 const source=kind==='reader'?readerSource:authorSource;
 const script=source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
 const calls=[],signups=[],redirects=[],notices=[],updates=[]; let mounted; const requestFailure=options.requestFailure;
 const context=vm.createContext({$user:null,console:{error(){}},fetch(){throw Error('External access forbidden');}});
 const module=new vm.SourceTextModule(stripTypeScriptTypes(script+`
 export function fields() {
  ${kind==='reader'?`role=${JSON.stringify(options.role??'')};`:''}
  isLoggedIn=${Boolean(options.loggedIn)};
  email='fictional@example.invalid';password='fictional-password';username='Fictional Reader';
  ${kind==='author'?`publishedWebsite='Fictional website';publishedPenName='Free pen name';publishedWorkTitle='Fictional work';plannedWorkDescription='Fictional outline';workDraftFile=${options.file?`{name:'draft.txt'}`:'null'};`:''}
 }
 export function clearText(){ ${kind==='author'?`publishedWebsite='';publishedPenName='';publishedWorkTitle='';plannedWorkDescription='';`:''} }
 export {handleSignup};
 ${kind==='author'?'export async function transition(value){isLoggedIn=value;await syncLoginState(mounted,isLoggedIn)};export function typeOutline(value){plannedWorkDescription=value}':''}

 export function state(){return {loading,error,${kind==='author'?'intentReady,plannedWorkDescription,publishedWebsite,':''}};}
 `,{mode:'transform'}),{context});
 const imports={
  '$lib/constants':{WEBSITE_NAME:'Fictional Site'},
  '$lib/supabaseClient':{supabase:{
   auth:{signUp:async payload=>{
    signups.push(JSON.parse(JSON.stringify(payload)));calls.push('signup');
    if(options.authFailure)return {data:null,error:Error('Auth rejected registration')};
    return {data:{user:options.noUser?null:{id:'fictional-user'},session:options.session?{access_token:'fictional'}:null},error:null};
   },getUser:async()=>{calls.push('getUser');if(options.getUserFailure)throw Error('Auth unavailable');if(options.authUserPromise)return await options.authUserPromise;return {data:{user:options.noUser?null:{id:'fictional-user',user_metadata:options.intent?{author_application_intent:options.intent}:undefined}}};}},
   from:table=>{
    calls.push('from');assert.ok(options.loggedIn,'New registration must not access profile REST API');
    assert.equal(table,'user_profiles');
    return {update:payload=>{updates.push(JSON.parse(JSON.stringify(payload)));return {eq:async(k,v)=>{
     assert.equal(k,'user_id');assert.equal(v,'fictional-user');return {error:options.updateFailure?Error('update failed'):null};
    }};}};
   },storage:{from(){calls.push('storage');throw Error('No anonymous attachment upload');}}
  }},
  '$app/navigation':{goto:url=>redirects.push(url)},
  '$lib/api':{sendRequest:async(url,options)=>{
    calls.push('request');assert.equal(url,'/api/author-application');updates.push(JSON.parse(options.body));
    return requestFailure ? {status:503,error:Error('unavailable')} : {data:{success:true}};
  }},
  '$lib/helpers':{getUserIp:async()=>{calls.push('ip');if(options.ipFailure)throw Error('IP unavailable');return '192.0.2.1';}},
  '$lib/api/adminEmail':{adminEmail:{newUser:async(...args)=>{notices.push(['reader',...args]);if(options.mailFailure)throw Error('mail unavailable');},
   newAuthor:async(...args)=>notices.push(['author',...args])}},
  svelte:{onMount:fn=>{mounted=fn}},'$lib/stores/authStore':{user:{}}
 };
 await module.link(name=>{
  const values=name.endsWith('.svelte')?{default:{}}:imports[name];assert.ok(values,name);
  return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});
 });
 await module.evaluate();module.namespace.fields();if(options.intent)await module.namespace.clearText();if(mounted && options.loggedIn){mounted();if(kind==='author')await module.namespace.transition(true);}
 return {...module.namespace,calls,signups,redirects,notices,updates,mountAuthor:async()=>{mounted();await module.namespace.transition(false)}};
}
for(const role of ['admin','author','reader',''])for(const session of [false,true])
test(`ordinary signup has no profile writes and no role input: ${role||'empty'}, session=${session}`,async()=>{
 const f=await fixture('reader',{role,session});await f.handleSignup();
 assert.deepEqual(f.signups,[{email:'fictional@example.invalid',password:'fictional-password',options:{data:{user_name:'Fictional Reader'}}}]);
 assert.deepEqual(f.redirects,['/email-confirmation']);assert.ok(!f.calls.includes('from'));assert.ok(!f.calls.includes('ip'));
 assert.deepEqual(f.notices,[['reader','Fictional Reader','fictional@example.invalid','reader']]);assert.equal(f.state().error,null);assert.equal(f.state().loading,false);
});
for(const session of [false,true])test(`new author preserves text intent only, with session=${session}`,async()=>{
 const f=await fixture('author',{session,file:true});await f.handleSignup();
 const data=f.signups[0].options.data;
 assert.deepEqual(data,{user_name:'Fictional Reader',author_application_intent:{requested:true,published_website:'Fictional website',
  published_pen_name:'Free pen name',published_work_title:'Fictional work',planned_work_description:'Fictional outline'}});
 for(const key of ['role','user_id','id','is_approved','draft_file_path'])assert.equal(data[key],undefined);
 assert.ok(!f.calls.includes('from'));assert.ok(!f.calls.includes('storage'));assert.ok(!f.calls.includes('getUser'));assert.ok(!f.calls.includes('ip'));
 assert.deepEqual(f.redirects,['/email-confirmation']);assert.equal(f.notices[0][0],'reader');assert.equal(f.state().error,null);
});
for(const kind of ['reader','author'])test(`${kind}: Auth/trigger error stops success flow without profile fallback`,async()=>{
 const f=await fixture(kind,{authFailure:true});await f.handleSignup();assert.equal(f.signups.length,1);
 assert.ok(f.state().error);assert.equal(f.state().loading,false);assert.deepEqual(f.redirects,[]);assert.deepEqual(f.notices,[]);assert.ok(!f.calls.includes('from'));
});
for(const kind of ['reader','author'])test(`${kind}: notification failure never retries signup/profile initialization`,async()=>{
 const f=await fixture(kind,{mailFailure:true});await f.handleSignup();assert.equal(f.signups.length,1);
 assert.deepEqual(f.redirects,['/email-confirmation']);assert.equal(f.state().error,null);assert.ok(!f.calls.includes('from'));
});
test('logged-in application uses the authenticated request helper without browser profile writes',async()=>{
 const f=await fixture('author',{loggedIn:true});await f.handleSignup();assert.equal(f.signups.length,0);
 assert.equal(f.updates.length,1);assert.equal(f.updates[0].role,undefined);
 assert.ok(f.calls.includes('request'));assert.ok(!f.calls.includes('from'));assert.deepEqual(f.redirects,['/author/pending']);
});
test('application failure preserves form and never redirects or falls back to profile writes',async()=>{
 const f=await fixture('author',{loggedIn:true,requestFailure:true});await f.handleSignup();assert.ok(f.state().error);
 assert.deepEqual(f.redirects,[]);assert.ok(!f.calls.includes('from'));
});
test('components compile, retain author-route delegation and explain attachment limitation',async()=>{
 for(const source of [readerSource,authorSource])assert.doesNotThrow(()=>compile(source,{generate:'server'}));
 assert.match(readerSource,/\{#if role === 'author' \|\| isLoggedIn\}\s*<AuthorSignupForm \{isLoggedIn\} \/>/);
 for(const source of [readerSource,authorSource])assert.doesNotMatch(source,/\.insert\(/);
 assert.match(authorSource,/disabled=\{!isLoggedIn\}/);assert.match(authorSource,/不授予作者权限/);
 const route=await readFile(new URL('../src/routes/author/signup/+page.svelte',import.meta.url),'utf8');assert.match(route,/<SignupForm role="author" \{isLoggedIn\} \/>/);
});
test('migration contract fixes reader identity and approval; only nickname metadata is read',()=>{
 const body=migration.match(/AS \$function\$([\s\S]*?)\$function\$/)[1];
 assert.match(body,/VALUES \(NEW\.id,NEW\.email,'reader',false,/);
 assert.deepEqual([...body.matchAll(/NEW\.raw_user_meta_data->>?'([^']+)'/g)].map(m=>m[1]),['user_name','user_name']);
 assert.match(body,/ON CONFLICT \(user_id\) DO NOTHING/);assert.doesNotMatch(body,/DO UPDATE|UPDATE\s+public\.|DELETE\s+FROM/i);
 assert.match(body,/TG_RELID <> 'auth\.users'::regclass/);assert.match(body,/TG_OP <> 'INSERT'/);
});
test('migration contract is transactional, guarded and server-only; no backfill or permission opening',()=>{
 assert.match(migration,/BEGIN;[\s\S]*COMMIT;/);
 assert.match(migration,/SECURITY DEFINER SET search_path=pg_catalog/);
 assert.match(migration,/current_user <> 'postgres'/);assert.match(migration,/rolsuper OR rolbypassrls/);
 assert.match(migration,/REVOKE ALL ON FUNCTION public\.initialize_registered_user_profile\(\) FROM PUBLIC, anon, authenticated, service_role/);
 assert.match(migration,/AFTER INSERT ON auth\.users FOR EACH ROW EXECUTE FUNCTION/);
 assert.match(migration,/contype='u'.*conkey=ARRAY\[uid_col\].*NOT condeferrable/);
 assert.match(migration,/AND NOT tgisinternal/);assert.match(migration,/Additional required field without default/);
 assert.doesNotMatch(migration,/CREATE OR REPLACE|CREATE[^;]*IF NOT EXISTS|^\s*(?:UPDATE|DELETE|DROP|GRANT|ALTER TABLE)\b/im);
 assert.equal((migration.match(/INSERT INTO public\.user_profiles/g)||[]).length,1);
});

test('saved author registration intent is restored and submitted as text only',async()=>{
 const intent={requested:true,published_website:'Saved site',published_pen_name:'Saved pen',published_work_title:'Saved work',planned_work_description:'Saved outline',role:'admin'};
 const f=await fixture('author',{loggedIn:true,intent});await f.handleSignup();
 assert.deepEqual(f.updates[0],{published_website:'Saved site',published_pen_name:'Saved pen',published_work_title:'Saved work',planned_work_description:'Saved outline'});
});
test('duplicate submit while busy sends one request only',async()=>{
 const f=await fixture('author',{loggedIn:true});await Promise.all([f.handleSignup(),f.handleSignup()]);assert.equal(f.updates.length,1);
});

test('late login restores intent once, enables application and submits through server',async()=>{
 const f=await fixture('author',{intent:{requested:true,planned_work_description:'Saved intent'}});
 // The fixture has not called onMount for an initially signed-out user.
 await f.mountAuthor();
 assert.equal(f.state().intentReady,false);assert.equal(f.calls.filter(x=>x==='getUser').length,0);
 await f.transition(true);await f.transition(true);
 assert.equal(f.state().intentReady,true);assert.equal(f.state().plannedWorkDescription,'Saved intent');assert.equal(f.calls.filter(x=>x==='getUser').length,1);
 await f.handleSignup();assert.equal(f.updates.length,1);assert.deepEqual(f.redirects,['/author/pending']);
});
test('late metadata response preserves text typed during restore',async()=>{
 let release;const authUserPromise=new Promise(resolve=>{release=resolve});
 const f=await fixture('author',{authUserPromise});await f.mountAuthor();const pending=f.transition(true);f.typeOutline('Typed outline');
 release({data:{user:{id:'fictional-user',user_metadata:{author_application_intent:{requested:true,planned_work_description:'Stored outline'}}}}});
 await pending;assert.equal(f.state().plannedWorkDescription,'Typed outline');assert.equal(f.state().intentReady,true);
});
test('restore failure stays disabled, no automatic retries or formal application',async()=>{
 const f=await fixture('author',{getUserFailure:true});await f.mountAuthor();await f.transition(true);await f.transition(true);
 assert.equal(f.calls.filter(x=>x==='getUser').length,1);assert.equal(f.state().intentReady,false);await f.handleSignup();assert.equal(f.updates.length,0);assert.ok(f.state().error);
});
test('logout invalidates pending intent response',async()=>{
 let release;const f=await fixture('author',{authUserPromise:new Promise(resolve=>{release=resolve})});await f.mountAuthor();const pending=f.transition(true);await f.transition(false);
 release({data:{user:{id:'fictional-user',user_metadata:{author_application_intent:{requested:true,planned_work_description:'Stale'}}}}});await pending;assert.equal(f.state().intentReady,false);assert.notEqual(f.state().plannedWorkDescription,'Stale');
});

const profileSource=await readFile(new URL('../src/lib/components/user/UserProfile.svelte',import.meta.url),'utf8');
const btnSource=await readFile(new URL('../src/lib/components/common/Btn.svelte',import.meta.url),'utf8');
const profileId='11111111-1111-4111-8111-111111111111';
async function serverComponent(source,imports,context) {
 const code=compile(source,{generate:'server'}).js.code;
 const module=new vm.SourceTextModule(code,{context});
 await module.link(async name=>{
  const values=imports[name]??(name==='svelte/internal/server'?await import('svelte/internal/server'):null);
  assert.ok(values,name);
  return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v)},{context});
 });await module.evaluate();return module.namespace.default;
}
test('rendered reader button is visible/enabled and its wired click navigates to the author form',async()=>{
 const context=vm.createContext({});const redirects=[],buttons=[];
 const RealButton=await serverComponent(btnSource,{},context);
 const imports={
  svelte:{onMount:()=>{}},'$app/navigation':{goto:url=>redirects.push(url)},
  '$lib/supabaseClient':{supabase:{}},'$lib/stores/authStore':{user:{subscribe:fn=>{fn({id:profileId,role:'reader',user_name:'Fictional',email:'stale@example.invalid'});return ()=>{}}}},
  '$lib/membership':{getPlanPrice:()=>''},'$lib/components/MembershipPlans.svelte':{default:()=>{}},
  '../common/Btn.svelte':{default:(payload,props)=>{buttons.push(props);RealButton(payload,props)}}
 };
 const Profile=await serverComponent(profileSource,imports,context);
 const html=render(Profile).body;
 const button=buttons.find(p=>p.title==='申请成为作家');assert.ok(button);assert.equal(button.disabled,false);
 assert.match(html,/<button\b[^>]*>申请成为作家<\/button>/);
 assert.ok(!html.match(/<button\b[^>]*disabled[^>]*>申请成为作家<\/button>/));
 // Verify the actual shared button wires this prop to its click event, not just
 // that an unrelated application function exists somewhere in the component.
 assert.match(btnSource,/on:click=\{handleClick\}/);await button.handleClick();
 assert.deepEqual(redirects,['/author/signup']);
 const route=await readFile(new URL('../src/routes/author/signup/+page.svelte',import.meta.url),'utf8');
 assert.match(route,/<SignupForm role="author" \{isLoggedIn\} \/>/);
 const authorImports={
  svelte:{onMount:()=>{}},'$app/navigation':{goto:()=>{}},'$lib/supabaseClient':{supabase:{}},
  '$lib/constants':{WEBSITE_NAME:'Fictional'},'$lib/api':{sendRequest:()=>{throw Error('No network')}},
  '$lib/api/adminEmail':{adminEmail:{}},'./common/Btn.svelte':{default:RealButton},
  './common/InputField.svelte':{default:()=>{}},'./common/ErrorMessage.svelte':{default:()=>{}}
 };
 const Author=await serverComponent(authorSource,authorImports,context);
 const form=render(Author,{props:{isLoggedIn:true}}).body;assert.match(form,/<form\b/);assert.match(form,/提交申请/);
});
for(const [role,approved] of [['author',false],['author',true],['admin',true]])test(`rendered ${role}, approved=${approved}: no reader application button`,async()=>{
 const context=vm.createContext({});const RealButton=await serverComponent(btnSource,{},context);
 const Profile=await serverComponent(profileSource,{
  svelte:{onMount:()=>{}},'$app/navigation':{goto:()=>{}},'$lib/supabaseClient':{supabase:{}},
  '$lib/stores/authStore':{user:{subscribe:fn=>{fn({id:profileId,role,is_approved:approved});return ()=>{}}}},
  '$lib/membership':{getPlanPrice:()=>''},'$lib/components/MembershipPlans.svelte':{default:()=>{}},'../common/Btn.svelte':{default:RealButton}
 },context);
 const html=render(Profile).body;assert.doesNotMatch(html,/申请成为作家/);
 if(role==='author')assert.ok(html.includes(approved?'已是认证作家':'作家申请审核中'));
});

async function profileFixture(options={}) {
 const calls=[],mounted=[];let getCount=0;
 const context=vm.createContext({$user:{id:profileId,email:'stale@example.invalid',role:'reader'},console:{error(){}}});
 const script=profileSource.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
 const module=new vm.SourceTextModule(stripTypeScriptTypes(script+`
 export {loadAuthEmail,verifyAndUpdate,updateProfile};
 export function edits(value){if(value.email!==undefined)userEmail=value.email;userPassword='fictional-password';userName='New nickname'};
 export function state(){return {userEmail,authEmailReady,message,messageType,showPasswordModal,loading}};
 `,{mode:'transform'}),{context});
 const supabase={auth:{
  getUser:async()=>{calls.push({type:'getUser'});getCount++;return {data:{user:{id:options.otherAccount?'22222222-2222-4222-8222-222222222222':profileId,email:options.changedEmail&&getCount>1?'changed@example.invalid':'current@example.invalid'}},error:options.authFailure?Error('offline'):null}},
  signInWithPassword:async payload=>{calls.push({type:'password',payload:JSON.parse(JSON.stringify(payload))});return {data:{user:{id:profileId}},error:options.badPassword?Error('bad password'):null}},
  updateUser:async payload=>{calls.push({type:'authEmail',payload:JSON.parse(JSON.stringify(payload))});return {error:null}}
 },from:table=>{
  assert.equal(table,'user_profiles');
  return {update:payload=>{
   assert.deepEqual(Object.keys(payload),['user_name']);
   return {eq:async(key,id)=>{
    assert.equal(key,'user_id');assert.equal(id,profileId);
    calls.push({type:'profile',payload:JSON.parse(JSON.stringify(payload))});
    return {error:options.profileFailure?Error('update failed'):null};
   }};
  }};
 }};
 const imports={svelte:{onMount:fn=>mounted.push(fn)},'$app/navigation':{goto:()=>{}},'$lib/supabaseClient':{supabase},'$lib/stores/authStore':{user:{subscribe:fn=>{fn({id:profileId,role:'reader'});return ()=>{}}}},'$lib/membership':{getPlanPrice:()=>''}};
 await module.link(name=>{const values=name.endsWith('.svelte')?{default:{}}:imports[name];assert.ok(values,name);return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v)},{context})});await module.evaluate();
 // Exercise the component's real mount subscription, not a fabricated email initializer.
 mounted.forEach(fn=>fn());await Promise.resolve();await Promise.resolve();
 return {...module.namespace,calls};
}
test('Auth email is displayed and used for password; stale profile email never gets restored',async()=>{
 const f=await profileFixture();assert.equal(f.state().userEmail,'current@example.invalid');assert.equal(f.state().authEmailReady,true);
 f.edits({});f.updateProfile();await f.verifyAndUpdate();
 assert.equal(f.calls.find(c=>c.type==='password').payload.email,'current@example.invalid');
 assert.deepEqual(f.calls.find(c=>c.type==='profile').payload,{user_name:'New nickname'});
 assert.equal(f.calls.filter(c=>c.type==='authEmail').length,0);assert.equal(f.state().messageType,'success');assert.equal(f.state().showPasswordModal,false);
});
test('explicit new email uses Auth updateUser only after password and nickname update',async()=>{
 const f=await profileFixture();f.edits({email:'new@example.invalid'});f.updateProfile();await f.verifyAndUpdate();
 assert.deepEqual(f.calls.filter(c=>['password','profile','authEmail'].includes(c.type)).map(c=>c.type),['password','profile','authEmail']);
 assert.deepEqual(f.calls.find(c=>c.type==='authEmail').payload,{email:'new@example.invalid'});assert.equal(f.state().messageType,'success');
});
for(const options of [{authFailure:true},{otherAccount:true},{changedEmail:true},{badPassword:true}])test('Auth/identity/password failure prevents profile and email writes '+JSON.stringify(options),async()=>{
 const f=await profileFixture(options);f.edits({email:'new@example.invalid'});f.updateProfile();await f.verifyAndUpdate();
 assert.equal(f.calls.filter(c=>['profile','authEmail'].includes(c.type)).length,0);assert.equal(f.state().messageType,'error');
});
test('profile failure preserves password dialog and never reports success or changes Auth email',async()=>{
 const f=await profileFixture({profileFailure:true});f.edits({email:'new@example.invalid'});f.updateProfile();await f.verifyAndUpdate();
 assert.equal(f.state().messageType,'error');assert.equal(f.state().showPasswordModal,true);assert.equal(f.calls.filter(c=>c.type==='authEmail').length,0);
});
test('late-login reactive hook and profile email protections compile for browser',()=>{
 assert.match(authorSource,/\$:\s*syncLoginState\(mounted, isLoggedIn\)/);
 assert.doesNotMatch(profileSource,/\$user(?:\?\.)?\.?(?:profile|email)/);
 for(const source of [authorSource,profileSource])assert.doesNotThrow(()=>compile(source,{generate:'client'}));
});
