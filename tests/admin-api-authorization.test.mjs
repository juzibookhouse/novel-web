// Real identity/allowlist modules, mocked SDK authentication and DB. No network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
const admin='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const reader='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const author='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const paths={tags:'src/routes/api/admin/tags/+server.ts', tag:'src/routes/api/admin/tags/[tagId]/+server.ts',
  reading:'src/routes/api/reading_records/+server.ts', novels:'src/routes/api/novels/+server.ts', users:'src/routes/api/admin/users/+server.ts',
  '$lib/server/verifiedIdentity':'src/lib/server/verifiedIdentity.ts',
  '$lib/server/adminAuthorization':'src/lib/server/adminAuthorization.ts'};
const sources=Object.fromEntries(await Promise.all(Object.entries(paths).map(async([k,p])=>[k,await readFile(new URL('../'+p,import.meta.url),'utf8')])));
async function fixture(options={}){
 const calls=[];
 const context=vm.createContext({Response,Request,URL,Date,console:{error:()=>{}},fetch:()=>{throw Error('Network forbidden');}});
 const user=options.user??admin;
 const imports={
  '$app/environment':{browser:false},
  '$env/static/public':{PUBLIC_SUPABASE_URL:'https://fictional.invalid',PUBLIC_SUPABASE_ANON_KEY:'fictional-anon'},
  '$env/dynamic/private':{env:{ADMIN_AUTH_USER_IDS:options.list===undefined?admin:options.list, ...(options.noPrivateConfig?{}:{SUPABASE_URL:options.privateUrl??'https://fictional.invalid',SUPABASE_SERVICE_ROLE_KEY:'fictional-server-only'})}},
  '@sveltejs/kit':{json:(v,o)=>Response.json(v,o)},
  '$lib/constants':{WEBSITE_NAME:'Fictional'},
  '$lib/novel.js':{getSortedChapters:chapters=>chapters},
  '$lib/errorLogger':{logError:async()=>{calls.push(['log']);}},
  '@supabase/supabase-js':{createClient:(_url,_key,config)=>{
   if(_key==='fictional-server-only'){
    calls.push(['private-client']);
    assert.equal(_url,'https://fictional.invalid');
    assert.deepEqual(JSON.parse(JSON.stringify(config.auth)),{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false});
    assert.equal(calls[0][0],'auth');
    return {from:table=>{calls.push(['private-from',table]);return imports['$lib/supabaseClient'].supabase.from(table)}};
   }
   assert.equal(_key,'fictional-anon');
   return {auth:{getUser:async token=>{
   calls.push(['auth',token]);assert.equal(config.global.headers.Authorization,`Bearer ${token}`);
   if(options.authThrows)throw Error('private provider details');
   if(token==='invalid')return {data:null,error:{status:401}};
   if(options.authStatus)return {data:null,error:{status:options.authStatus}};
   return {data:{user:{id:user,role:options.claimedRole??'reader'}},error:null};
  }}};}},
  '$lib/supabaseClient':{
   getCategories:async()=>({data:[{id:'category'}],error:null}),getTags:async()=>({data:[{id:'tag'}],error:null}),
   supabase:{from:table=>{
    if(table==='user_profiles')assert.ok(calls.some(c=>c[0]==='private-from'&&c[1]==='user_profiles'),'user list requires private client');
    if(options.strictReadingRls && table==='reading_records' && !calls.some(c=>c[0]==='private-from'))throw Error('Public reading access denied');
    calls.push(['from',table]);let owner=null,insert=null,deleted=false,patch=null,targetId=null;
    const q={
     select:(fields,opts)=>{calls.push(['select',fields,opts]);return q;},order:(...args)=>{calls.push(['order',...args]);return q;},
     range:(...args)=>{calls.push(['range',...args]);return q;},
     eq:(key,value)=>{calls.push(['eq',key,value]);if(key==='user_id')owner=value;if(key==='id')targetId=value;return q;},
     insert:value=>{insert=value;calls.push(['insert',value]);return q;},
     update:value=>{patch=JSON.parse(JSON.stringify(value));calls.push(['update',patch]);return q;},
     delete:()=>{deleted=true;calls.push(['delete',table]);return q;},single:()=>q,
     then:(resolve,reject)=>Promise.resolve().then(()=>{
      if(options.dbThrows)throw Error('DB failure');
      if(options.dbError)return {data:null,error:{message:'DB failed'},count:null};
      if(table==='user_memberships'){assert.ok(calls.some(c=>c[0]==='private-from'&&c[1]===table),'membership write requires private client');assert.equal(targetId,'membership-1');if(options.membershipMissing)return {data:null,error:{code:'PGRST116',message:'No target'}};return {data:{id:targetId,user_id:reader,...patch},error:null};}
      if(deleted)return {data:null,error:null};
      if(insert)return {data:{id:'new-tag',...insert[0]},error:null};
      if(table==='user_profiles')return {data:options.userRows??[admin,reader,author].map(user_id=>({id:'profile-'+user_id,user_id,role:user_id===admin?'admin':user_id===author?'author':'reader',user_name:'Fictional',user_memberships:[]})),count:options.userCount??41,error:null};
      if(table==='tags')return {data:[{id:'tag',name:'Fictional',user_profiles:{user_name:'Owner'}}],error:null};
      if(table==='reading_records')return {data:[{reading_time:120,user_profiles:{id:'reader-profile',user_name:'Reader'},
       novels:{id:'novel',title:'Fictional novel',user_id:author,user_profiles:{user_name:'Author'}}}],error:null};
      const rows=[admin,reader,author].filter(id=>owner===null||id===owner)
       .map(id=>({id:'novel-'+id,user_id:id,chapters:[],novel_tags:[]}));
      return {data:rows,count:rows.length,error:null};
     }).then(resolve,reject)
    };return q;
   }}
  }
 };
 const cache=new Map();
 async function link(name){
  if(cache.has(name))return cache.get(name);
  let m;if(sources[name])m=new vm.SourceTextModule(stripTypeScriptTypes(sources[name],{mode:'transform'}),{context});
  else{assert.ok(imports[name],name);m=new vm.SyntheticModule(Object.keys(imports[name]),function(){for(const[k,v]of Object.entries(imports[name]))this.setExport(k,v);},{context});}
  cache.set(name,m);await m.link(link);return m;
 }
 return {calls,call:async(route,method='GET',body={name:'Fictional',user_id:author,role:'admin'},query='?month=2026-10&filter=user')=>{
  const m=await link(route);await m.evaluate();
  const url=new URL('https://local.invalid/'+query);
  const header=options.header===null?{}:{Authorization:options.header??'Bearer valid'};
  return m.namespace[method]({url,params:{tagId:'tag'},request:new Request(url,{method,headers:header,
   ...(['POST','PATCH'].includes(method)?{body:JSON.stringify(body)}:{})})});
 }};
}
const adminOnly=[['tags','GET'],['tags','POST'],['tag','DELETE'],['reading','GET'],['users','GET']];
for(const [route,method]of adminOnly){
 test(`${route} ${method}: allowlisted UUID works without profile admin role`,async()=>{
  const f=await fixture();const r=await f.call(route,method);assert.equal(r.status,method==='POST'?201:200);
  assert.ok(f.calls.some(c=>c[0]==='from'));assert.equal(f.calls[0][0],'auth');
  if(method==='POST'){const payload=f.calls.find(c=>c[0]==='insert')[1][0];assert.equal(payload.user_id,admin);assert.equal(payload.role,undefined);}
  if(method==='DELETE')assert.deepEqual(f.calls.filter(c=>c[0]==='delete').map(c=>c[1]),['novel_tags','tags']);
 });
 for(const id of [reader,author])test(`${route} ${method}: reader/author with forged admin claim denied before DB`,async()=>{
  const f=await fixture({user:id,claimedRole:'admin',header:'Bearer '+JSON.stringify({access_token:'valid',user:{id:admin,role:'admin'},isAdmin:true})});
  assert.equal((await f.call(route,method)).status,403);assert.deepEqual(f.calls,[['auth','valid']]);
 });
 for(const list of ['', 'bad', admin+',bad'])test(`${route} ${method}: missing/malformed allowlist fails closed`,async()=>{
  const f=await fixture({list});assert.equal((await f.call(route,method)).status,403);assert.equal(f.calls.length,1);
 });
}
for(const route of ['tags','tag','reading','novels','users'])for(const [options,status]of [
 [{header:null},401],[{header:'Bearer invalid'},401],[{header:'Bearer '+JSON.stringify({user:{id:admin,role:'admin'}})},401],
 [{authThrows:true},503],[{authStatus:503},503]
])test(`${route}: authentication failure stops before DB and external logging`,async()=>{
 const f=await fixture(options);assert.equal((await f.call(route,route==='tag'?'DELETE':'GET')).status,status);
 assert.ok(!f.calls.some(c=>c[0]==='from'||c[0]==='log'));
});
for(const id of [reader,author])for(const list of [admin,'','bad'])test('ordinary/author novel list stays scoped to verified UUID, including broken allowlist',async()=>{
 const f=await fixture({user:id,list,claimedRole:'admin',header:'Bearer '+JSON.stringify({access_token:'valid',user:{id:admin,role:'admin'}})});
 const r=await f.call('novels','GET',undefined,'?page=2&user_id='+admin+'&isAdmin=true');assert.equal(r.status,200);
 const body=await r.json();assert.equal(body.novels.length,1);assert.equal(body.novels[0].user_id,id);
 assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]===id));
 assert.deepEqual(f.calls.find(c=>c[0]==='range'),['range',10,19]);
 assert.deepEqual(Object.keys(body).sort(),['categories','novels','page','per_page','tags','totalCount']);
 assert.equal(body.page,2);assert.equal(body.per_page,10);
});
test('allowlisted administrator novel list removes only the account filter',async()=>{
 const f=await fixture();const r=await f.call('novels');assert.equal(r.status,200);assert.equal((await r.json()).novels.length,3);
 assert.ok(!f.calls.some(c=>c[0]==='eq'&&c[1]==='user_id'));
});
test('original tags and reading aggregation response formats remain compatible',async()=>{
 const f=await fixture();assert.deepEqual(await(await f.call('tags')).json(),{tags:[{id:'tag',name:'Fictional',user_name:'Owner'}]});
 assert.deepEqual(await(await f.call('reading')).json(),[{name:'Reader',totalTime:120}]);
});
for(const [route,method]of [...adminOnly,['novels','GET']])test(`${route}: DB error cannot report success`,async()=>{
 const f=await fixture({dbError:true});assert.equal((await f.call(route,method)).status,500);
});
test('all four sources are independent of editable role and shared profile authentication',()=>{
 for(const name of ['tags','tag','reading','novels']){
  assert.doesNotMatch(sources[name],/getAuthUser|authenticationErrorResponse|profile\.role/);
  assert.match(sources[name],/verifyRequestIdentity/);assert.match(sources[name],/assertServerAdmin/);
 }
});

for(const [filter,name] of [['user','Reader'],['novel','Fictional novel'],['author','Author']])
test(`reading ${filter}: authorized private query works with public reading access denied`,async()=>{
 const f=await fixture({strictReadingRls:true});
 const r=await f.call('reading','GET',undefined,`?month=2026-10&filter=${filter}`);
 assert.equal(r.status,200);assert.deepEqual(await r.json(),[{name,totalTime:120}]);
 assert.equal(f.calls.filter(c=>c[0]==='private-client').length,1);
 assert.deepEqual(f.calls.filter(c=>c[0]==='private-from'),[['private-from','reading_records']]);
 assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='date'&&c[2]==='2026-10'));
});

test('reading private query accepts the existing session JSON credential format',async()=>{
 const f=await fixture({strictReadingRls:true,header:'Bearer '+JSON.stringify({access_token:'valid',user:{id:reader,role:'admin'}})});
 assert.equal((await f.call('reading')).status,200);
 assert.equal(f.calls[0][0],'auth');assert.equal(f.calls[0][1],'valid');
 assert.equal(f.calls.filter(c=>c[0]==='private-client').length,1);
});

for(const options of [{noPrivateConfig:true},{privateUrl:''},{privateUrl:'http://fictional.invalid'},
 {privateUrl:'https://fictional.invalid/?unexpected=true'}])
test('reading invalid private configuration fails without public fallback '+JSON.stringify(options),async()=>{
 const f=await fixture(options);const r=await f.call('reading');assert.equal(r.status,500);
 assert.ok(!f.calls.some(c=>c[0]==='private-client'||c[0]==='from'));
 assert.ok(!(await r.text()).includes('fictional-server-only'));
});

test('reading route has no shared public database client or anonymous fallback',()=>{
 assert.doesNotMatch(sources.reading,/\$lib\/supabaseClient|PUBLIC_SUPABASE_ANON_KEY/);
 assert.ok(sources.reading.indexOf('assertServerAdmin(user.id)')<sources.reading.indexOf('let query = privateClient()'));
 assert.match(sources.reading,/env\.SUPABASE_SERVICE_ROLE_KEY/);
});

test('users GET authorizes before private access and preserves all roles, fields, sorting and pagination',async()=>{
 const f=await fixture();const r=await f.call('users','GET',undefined,'?page=2&per_page=20');
 assert.equal(r.status,200);const body=await r.json();assert.equal(body.users.length,3);
 assert.deepEqual(body.users.map(u=>u.role),['admin','reader','author']);
 assert.deepEqual(body.pagination,{page:2,per_page:20,total:41,totalPages:3,hasNextPage:true,hasPreviousPage:true});
 assert.equal(f.calls[0][0],'auth');assert.equal(f.calls[1][0],'private-client');
 assert.deepEqual(f.calls.find(c=>c[0]==='private-from'),['private-from','user_profiles']);
 assert.deepEqual(f.calls.find(c=>c[0]==='range'),['range',20,39]);
 assert.deepEqual(JSON.parse(JSON.stringify(f.calls.find(c=>c[0]==='order'))),['order','created_at',{ascending:false}]);
 const selection=f.calls.find(c=>c[0]==='select');assert.deepEqual(JSON.parse(JSON.stringify(selection[2])),{count:'exact'});
 assert.equal(selection[1].replace(/\s+/g,''),'id,user_id,role,created_at,user_name,ip,email,user_memberships(id,status,plan_id,end_date)');
 assert.ok(!f.calls.some(c=>c[0]==='eq'));
});

test('users GET accepts legacy session JSON without trusting its user claim',async()=>{
 const f=await fixture({header:'Bearer '+JSON.stringify({access_token:'valid',user:{id:reader,role:'admin'}})});
 assert.equal((await f.call('users')).status,200);assert.deepEqual(f.calls[0],['auth','valid']);
});

for(const options of [{noPrivateConfig:true},{privateUrl:''},{privateUrl:'http://fictional.invalid'},
 {privateUrl:'not-a-url'},{privateUrl:'https://fictional.invalid/?unexpected=true'}])
test('users GET rejects invalid private configuration without public fallback '+JSON.stringify(options),async()=>{
 const f=await fixture(options);const r=await f.call('users');assert.equal(r.status,503);
 assert.deepEqual(await r.json(),{error:'admin_database_unavailable',code:'admin_database_unavailable'});
 assert.ok(!f.calls.some(c=>['private-client','from','log'].includes(c[0])));
});

test('users GET reports a real empty list as success',async()=>{
 const f=await fixture({userRows:[],userCount:0});const r=await f.call('users');assert.equal(r.status,200);
 const body=await r.json();assert.deepEqual(body.users,[]);assert.equal(body.pagination.total,0);
});

const membershipEdit={membershipId:'membership-1',status:'active',endDate:'2027-10-22T00:00:00.000Z'};
test('users PATCH authorizes before private client creation and performs exactly one existing-record UPDATE',async()=>{
 const f=await fixture();const r=await f.call('users','PATCH',{...membershipEdit,role:'admin',user_id:author,plan_id:'unapproved',start_date:'unapproved'});
 assert.equal(r.status,200);const result=await r.json();assert.equal(result.success,true);assert.equal(result.data.id,'membership-1');
 assert.deepEqual(f.calls.slice(0,3),[['auth','valid'],['private-client'],['private-from','user_memberships']]);
 assert.deepEqual(f.calls.filter(c=>c[0]==='from'),[['from','user_memberships']]);
 assert.deepEqual(f.calls.filter(c=>c[0]==='update'),[['update',{status:'active',end_date:membershipEdit.endDate}]]);
 assert.deepEqual(f.calls.filter(c=>c[0]==='eq'),[['eq','id','membership-1']]);
 assert.ok(!f.calls.some(c=>['insert','delete'].includes(c[0])));
});

for(const [options,status] of [
 [{user:reader,claimedRole:'admin'},403],[{user:author,claimedRole:'admin'},403],
 [{list:''},403],[{list:'bad'},403],[{list:admin+',bad'},403],
 [{header:null},401],[{header:'Bearer invalid'},401],
 [{header:'Bearer '+JSON.stringify({user:{id:admin,role:'admin'}})},401],
 [{user:reader,header:'Bearer '+JSON.stringify({access_token:'valid',user:{id:admin,role:'admin'}})},403],
 [{authStatus:503},503],[{authThrows:true},503]
])test('users PATCH authorization failure never creates private client or writes '+JSON.stringify(options),async()=>{
 const f=await fixture(options);const r=await f.call('users','PATCH',membershipEdit);assert.equal(r.status,status);
 assert.ok(f.calls.every(c=>c[0]==='auth'));
});

for(const options of [{noPrivateConfig:true},{privateUrl:''},{privateUrl:'http://fictional.invalid'},
 {privateUrl:'not-a-url'},{privateUrl:'https://fictional.invalid/?unexpected=true'}])
test('users PATCH invalid private configuration fails explicitly without fallback '+JSON.stringify(options),async()=>{
 const f=await fixture(options);const r=await f.call('users','PATCH',membershipEdit);assert.equal(r.status,503);
 assert.deepEqual(await r.json(),{error:'admin_database_unavailable',code:'admin_database_unavailable'});
 assert.ok(!f.calls.some(c=>['private-client','from','update','log'].includes(c[0])));
});

test('users PATCH missing target ID preserves validation and performs no database work',async()=>{
 const f=await fixture();const r=await f.call('users','PATCH',{status:'active'});assert.equal(r.status,400);
 assert.deepEqual(await r.json(),{error:'membershipId is required'});
 assert.ok(f.calls.every(c=>c[0]==='auth'));
});

for(const options of [{dbError:true},{dbThrows:true},{membershipMissing:true}])
test('users PATCH failed UPDATE or missing record cannot report success '+JSON.stringify(options),async()=>{
 const f=await fixture(options);const r=await f.call('users','PATCH',membershipEdit);assert.equal(r.status,500);
 assert.deepEqual(await r.json(),{error:'Failed to update membership'});
 assert.equal(f.calls.filter(c=>c[0]==='update').length,1);
});

test('users PATCH legacy session JSON is compatible and only supplied permitted fields are updated',async()=>{
 const f=await fixture({header:'Bearer '+JSON.stringify({access_token:'valid',user:{id:reader}})});
 const r=await f.call('users','PATCH',{membershipId:'membership-1',endDate:membershipEdit.endDate,role:'admin'});assert.equal(r.status,200);
 assert.deepEqual(f.calls.find(c=>c[0]==='update'),['update',{end_date:membershipEdit.endDate}]);
});

test('users PATCH source retains one UPDATE, target equality and response; no new writes or public fallback',()=>{
 const patch=sources.users.slice(sources.users.indexOf('export const PATCH:'));
 assert.equal((patch.match(/\.update\(/g)||[]).length,1);
 assert.match(patch,/privateListClient\(\)\s*\.from\('user_memberships'\)\s*\.update\(updateData\)\s*\.eq\('id', membershipId\)\s*\.select\(\)\s*\.single\(\)/);
 assert.match(patch,/return json\(\{ success: true, data \}\)/);
 assert.doesNotMatch(patch,/\.insert\(|\.upsert\(|\.delete\(|membershipWriter|membershipPayment|supabase\s*\.from/);
});

const usersComponent=await readFile(new URL('../src/lib/components/admin/AdminUsers.svelte',import.meta.url),'utf8');
async function usersUI(responses){
 const calls=[];const context=vm.createContext({console:{error(){}},Error,Number});
 const script=usersComponent.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
 const module=new vm.SourceTextModule(stripTypeScriptTypes(script+`\nexport {fetchUsers};export function state(){return {users,pagination,currentPage,listError}};`,{mode:'transform'}),{context});
 const imports={svelte:{onMount:()=>{}},'$lib/api':{sendRequest:async(url,options)=>{calls.push({url,options});const result=responses.shift();if(result instanceof Error)throw result;return result;}},
 '$lib/supabaseClient':{supabase:{}},'$lib/user':{getUserDateFormat:()=>'',getUserMembershipDate:()=>'',getUserMembership:()=>''}};
 await module.link(name=>{const values=imports[name];assert.ok(values,name);return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});});await module.evaluate();
 return {...module.namespace,calls};
}
const successfulList={data:{users:[{id:'profile',user_name:'Fictional'}],pagination:{page:1,per_page:20,total:1,totalPages:1,hasNextPage:false,hasPreviousPage:false}},status:200,response:{ok:true}};
for(const result of [{error:Error('offline'),status:null},{status:500,response:{ok:false}},{status:401},{status:403},
 {data:{}},{data:{users:[],pagination:{}}},new Error('connection lost')])
test('users UI reports request/response failure instead of accepting an empty list '+JSON.stringify(result),async()=>{
 const f=await usersUI([successfulList,result]);await f.fetchUsers();await f.fetchUsers();
 assert.ok(f.state().listError);assert.equal(f.state().users.length,1);assert.equal(f.state().pagination.total,1);
});
test('users UI accepts a genuine empty list and clears the old error after recovery',async()=>{
 const empty={...successfulList,data:{users:[],pagination:{...successfulList.data.pagination,total:0,totalPages:0}}};
 const f=await usersUI([{error:Error('offline')},empty]);await f.fetchUsers();assert.ok(f.state().listError);
 await f.fetchUsers();assert.equal(f.state().listError,'');assert.equal(f.state().users.length,0);assert.equal(f.state().pagination.total,0);
 assert.equal(f.calls[1].url,'/api/admin/users?page=1&per_page=20');assert.equal(f.calls[1].options.method,'GET');
});
test('users UI renders its failure as a visible alert',async()=>{
 const f=await usersUI([{status:500,response:{ok:false}}]);await f.fetchUsers();const message=f.state().listError;
 const source=usersComponent.replace("let listError = '';",'let listError = '+JSON.stringify(message)+';');
 const context=vm.createContext({});const module=new vm.SourceTextModule(compile(source,{generate:'server'}).js.code,{context});
 const imports={svelte:{onMount:()=>{}},'$lib/api':{sendRequest:()=>{throw Error('No network')}},'$lib/supabaseClient':{supabase:{}},
 '$lib/user':{getUserDateFormat:()=>'',getUserMembershipDate:()=>'',getUserMembership:()=>''}};
 await module.link(async name=>{const values=imports[name]??(name==='svelte/internal/server'?await import('svelte/internal/server'):null);assert.ok(values,name);return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});});await module.evaluate();
 const html=render(module.namespace.default).body;assert.match(html,/<p\b[^>]*role="alert"[^>]*>/);assert.ok(html.includes(message));
});
