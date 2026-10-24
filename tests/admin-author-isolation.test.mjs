// Offline mocks only. No Supabase, PostgreSQL, email or other network calls.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {compile} from 'svelte/compiler';
const source=await readFile(new URL('../src/routes/api/admin/authors/+server.ts',import.meta.url),'utf8');
const component=await readFile(new URL('../src/lib/components/admin/AdminAuthor.svelte',import.meta.url),'utf8');
const ID='11111111-1111-4111-8111-111111111111';
class IdentityVerificationError extends Error {constructor(status,code){super(code);this.status=status;this.code=code}}
class AdminAuthorizationError extends Error {status=403;code='admin_access_denied'}
async function fixture(options={}) {
 const rows=options.rows??[{id:ID,role:'author',is_approved:false,user_name:'Keep name',email:'fictional@example.invalid',planned_work_description:'Keep application',novels:[{id:'fictional',reading_records:[{reading_time:2},{reading_time:3}]}]}];
 let clients=0,reads=0,writes=0;
 const context=vm.createContext({URL,Error});
 const module=new vm.SourceTextModule(stripTypeScriptTypes(source,{mode:'transform'}),{context});
 const imports={
  '@sveltejs/kit':{json:(body,init)=>({body:JSON.parse(JSON.stringify(body)),status:init?.status??200,headers:init?.headers})},
  '$env/dynamic/private':{env:options.noConfig?{}:{SUPABASE_URL:'https://fictional.invalid',SUPABASE_SERVICE_ROLE_KEY:'fake-only'}},
  '$lib/server/verifiedIdentity':{IdentityVerificationError,verifyRequestIdentity:async()=>{if(options.authError)throw new IdentityVerificationError(...options.authError);return {id:ID}}},
  '$lib/server/adminAuthorization':{AdminAuthorizationError,assertServerAdmin:id=>{assert.equal(id,ID);if(options.denied)throw new AdminAuthorizationError()}},
  '@supabase/supabase-js':{createClient:(url,key,config)=>{
   clients++;assert.equal(key,'fake-only');assert.equal(config.auth.persistSession,false);
   return {from:table=>{assert.equal(table,'user_profiles');const filters={};let payload;
    const query={
     select:()=>query,
     eq:(key,value)=>{filters[key]=value;return query},
     update:value=>{payload=JSON.parse(JSON.stringify(value));assert.deepEqual(Object.keys(payload),['is_approved']);return query},
     maybeSingle:async()=>{reads++;if(options.readError)return {error:Error('private error')};const row=rows.find(r=>r.id===filters.id);return {data:row?{id:row.id,role:row.role,is_approved:row.is_approved}:null}},
     then:(resolve,reject)=>Promise.resolve().then(()=>{
      if(payload){writes++;if(options.writeError)return {error:Error('private error')};
       if(options.race)rows[0].is_approved=true;
       const found=rows.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v));
       for(const row of found)Object.assign(row,payload);
       return {data:found.map(r=>({id:r.id,is_approved:r.is_approved}))};
      }
      reads++;if(options.readError)return {error:Error('private error')};
      assert.deepEqual(filters,{role:'author'});return {data:rows.filter(r=>r.role==='author').map(({role,...r})=>r)};
     }).then(resolve,reject)
    };return query;
   }};
  }}
 };
 await module.link(name=>{const values=imports[name];assert.ok(values,name);return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v)},{context})});
 await module.evaluate();
 const body={profileId:ID,is_approved:true,expected_is_approved:false};
 return {rows,counts:()=>({clients,reads,writes}),get:()=>module.namespace.GET({request:{}}),patch:(input=body)=>module.namespace.PATCH({request:{json:async()=>input}})};
}
for(const method of ['get','patch'])for(const options of [{denied:true},{authError:[401,'credentials_missing']},{authError:[401,'credentials_invalid']},{authError:[503,'auth_unavailable']}])
test(`${method} rejects before private access ${JSON.stringify(options)}`,async()=>{const f=await fixture(options);const result=await f[method]();assert.equal(result.status,options.denied?403:options.authError[0]);assert.deepEqual(f.counts(),{clients:0,reads:0,writes:0})});
test('administrator list preserves displayed fields and reading total',async()=>{const f=await fixture();const r=await f.get();assert.equal(r.status,200);assert.equal(r.body.authors.length,1);assert.equal(r.body.authors[0].novelReadingTime,5);assert.equal(r.body.authors[0].novelCount,1);assert.equal(r.body.authors[0].planned_work_description,'Keep application');assert.equal(r.headers['Cache-Control'],'no-store')});
test('approve and revoke affect only approval field',async()=>{const f=await fixture();const before=JSON.stringify(f.rows[0]);assert.equal((await f.patch()).status,200);assert.equal(f.rows[0].is_approved,true);assert.equal((await f.patch({profileId:ID,is_approved:false,expected_is_approved:true})).status,200);assert.equal(JSON.stringify(f.rows[0]),before)});
test('missing target is 404',async()=>{const f=await fixture({rows:[]});assert.equal((await f.patch()).status,404);assert.equal(f.counts().writes,0)});
for(const role of ['reader','admin'])test(`cannot review ${role}`,async()=>{const f=await fixture({rows:[{id:ID,role,is_approved:false}]});assert.equal((await f.patch()).status,409);assert.equal(f.counts().writes,0)});
test('repeated stale approval is conflict without second write',async()=>{const f=await fixture();await f.patch();const before=JSON.stringify(f.rows);assert.equal((await f.patch()).status,409);assert.equal(f.counts().writes,1);assert.equal(JSON.stringify(f.rows),before)});
test('conditional update rejects change between read and write',async()=>{const f=await fixture({race:true});assert.equal((await f.patch()).status,409);assert.equal(f.rows[0].is_approved,true)});
test('two mock concurrent approvals have one winner, not a real PostgreSQL concurrency proof',async()=>{const f=await fixture();const results=await Promise.all([f.patch(),f.patch()]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(f.rows[0].is_approved,true)});
for(const input of [{profileId:ID,is_approved:true,expected_is_approved:false,role:'admin'},{profileId:ID,is_approved:'true',expected_is_approved:false},{profileId:'wrong',is_approved:true,expected_is_approved:false},{profileId:ID,is_approved:false,expected_is_approved:false}])test('invalid request rejected '+JSON.stringify(input),async()=>{const f=await fixture();assert.equal((await f.patch(input)).status,400);assert.equal(f.counts().clients,0)});
for(const options of [{readError:true},{writeError:true},{noConfig:true}])test('database/configuration failure '+JSON.stringify(options),async()=>{const f=await fixture(options);const r=await f.patch();assert.equal(r.status,503);assert.deepEqual(r.body,{code:'author_review_unavailable'})});
test('GET database failure is not empty successful list',async()=>{const f=await fixture({readError:true});assert.equal((await f.get()).status,503)});
test('component compiles and has no browser profile reads/writes',()=>{assert.doesNotThrow(()=>compile(component,{generate:'server'}));assert.doesNotMatch(component,/supabase|fetchAdminAuthors/);assert.match(component,/expected_is_approved: currentStatus/);assert.match(component,/needsRefresh/)});

async function ui(responses) {
 const calls=[];const context=vm.createContext({});
 const script=component.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
 const module=new vm.SourceTextModule(stripTypeScriptTypes(script+`\nexport {fetchAuthors,toggleApproval};export function state(){return {authors,errorMessage,needsRefresh,saving,loading}};`,{mode:'transform'}),{context});
 const imports={svelte:{onMount:()=>{}},'$lib/api':{sendRequest:async(url,options)=>{calls.push({url,options});return responses.shift()}},'$lib/user':{getUserDateFormat:()=>''},'$lib/novel':{formatDuration:()=>''}};
 await module.link(name=>{const values=imports[name];return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v)},{context})});await module.evaluate();return {...module.namespace,calls};
}
test('UI only refreshes on confirmed update success',async()=>{const f=await ui([{data:{success:true}},{data:{authors:[{id:ID,is_approved:true}]}}]);await f.toggleApproval(ID,false);assert.equal(f.calls.length,2);assert.equal(JSON.parse(f.calls[0].options.body).expected_is_approved,false);assert.equal(f.state().authors[0].is_approved,true)});
for(const status of [401,403,409,503,null])test('UI failure locks stale actions until explicit refresh '+status,async()=>{const f=await ui([{status,error:true},{data:{authors:[]}}]);await f.toggleApproval(ID,false);assert.equal(f.state().needsRefresh,true);assert.ok(f.state().errorMessage);await f.toggleApproval(ID,false);assert.equal(f.calls.length,1);await f.fetchAuthors();assert.equal(f.state().needsRefresh,false)});
