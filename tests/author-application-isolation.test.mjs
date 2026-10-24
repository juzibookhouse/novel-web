// Offline mocks only; does not prove live PostgreSQL concurrency or storage policies.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=await readFile(new URL('../src/routes/api/author-application/+server.ts',import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111';
class IdentityVerificationError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
class AdminAuthorizationError extends Error{}
async function fixture(options={}){
 const rows=options.rows??[{user_id:A,role:'reader',is_approved:false,user_name:'Keep name',email:'fictional@example.invalid'}];
 let writes=0,clients=0;
 const context=vm.createContext({URL,Object,Array,Error});
 const module=new vm.SourceTextModule(stripTypeScriptTypes(source,{mode:'transform'}),{context});
 const imports={
 '@sveltejs/kit':{json:(body,init)=>({body,status:init?.status??200})},
 '$lib/server/verifiedIdentity':{IdentityVerificationError,verifyRequestIdentity:async()=>{
 if(options.authError)throw new IdentityVerificationError(...options.authError);return {id:A}}},
 '$lib/server/adminAuthorization':{AdminAuthorizationError,assertServerAdmin:()=>{if(!options.admin)throw new AdminAuthorizationError()}},
 '$env/dynamic/private':{env:options.noConfig?{}:{SUPABASE_URL:'https://fictional.invalid',SUPABASE_SERVICE_ROLE_KEY:'fake-test-only'}},
 '@supabase/supabase-js':{createClient:()=>{clients++;return {from:table=>{assert.equal(table,'user_profiles');return {update:payload=>{
 const filters={};const query={eq:(key,value)=>{filters[key]=value;return query},select:async columns=>{
 assert.equal(columns,'user_id');assert.deepEqual(filters,{user_id:A,role:'reader',is_approved:false});writes++;
 if(options.databaseError)return {error:{message:'sensitive-provider-error'}};
 const found=rows.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v));
 for(const row of found)Object.assign(row,JSON.parse(JSON.stringify(payload)));
 return {data:found.map(r=>({user_id:r.user_id})),error:null};}};return query;
 }}}}}}
 };
 await module.link(name=>{const values=imports[name];assert.ok(values,name);return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v)},{context})});
 await module.evaluate();
 return {rows,counts:()=>({writes,clients}),post:body=>module.namespace.POST({request:{json:async()=>body??{planned_work_description:'Fictional outline'}}})};
}
for(const authError of [[401,'credentials_missing'],[401,'credentials_invalid'],[503,'auth_unavailable']])test('auth failure '+authError[1],async()=>{
 const f=await fixture({authError});const r=await f.post();assert.equal(r.status,authError[0]);assert.deepEqual(f.counts(),{writes:0,clients:0});
});
test('reader submits only their own application without changing name, email or UUID',async()=>{
 const f=await fixture();const r=await f.post();assert.equal(r.status,200);assert.equal(f.rows[0].role,'author');assert.equal(f.rows[0].is_approved,false);
 assert.equal(f.rows[0].user_id,A);assert.equal(f.rows[0].user_name,'Keep name');assert.equal(f.rows[0].email,'fictional@example.invalid');
});
for(const body of [{user_id:'other'},{role:'admin'},{is_approved:true},{email:'other@example.invalid'},{published_website:3}])test('reject forbidden input '+JSON.stringify(body),async()=>{
 const f=await fixture();assert.equal((await f.post(body)).status,400);assert.deepEqual(f.counts(),{writes:0,clients:0});
});
for(const row of [{role:'author',is_approved:false},{role:'author',is_approved:true},{role:'admin',is_approved:true},{role:'reader',is_approved:true}])test('ineligible state '+JSON.stringify(row),async()=>{
 const record={user_id:A,planned_work_description:'Keep existing',...row};const f=await fixture({rows:[record]});const before=JSON.stringify(record);
 assert.equal((await f.post()).status,409);assert.equal(JSON.stringify(record),before);
});
test('allowlisted administrator cannot apply even with reader profile',async()=>{const f=await fixture({admin:true});assert.equal((await f.post()).status,409);assert.equal(f.counts().clients,0)});
test('missing profile is conflict, never inserted',async()=>{const f=await fixture({rows:[]});assert.equal((await f.post()).status,409)});
test('sequential repeat preserves first application',async()=>{const f=await fixture();assert.equal((await f.post()).status,200);const before=JSON.stringify(f.rows);assert.equal((await f.post({planned_work_description:'overwrite'})).status,409);assert.equal(JSON.stringify(f.rows),before)});
test('concurrent mock contenders only one passes predicate (not a real database lock test)',async()=>{
 const f=await fixture();const results=await Promise.all([f.post({planned_work_description:'A'}),f.post({planned_work_description:'B'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(f.rows.length,1);
});
for(const options of [{databaseError:true},{noConfig:true}])test('database/config failure explicit, no provider details '+JSON.stringify(options),async()=>{const f=await fixture(options);const r=await f.post();assert.equal(r.status,503);assert.equal(JSON.stringify(r.body),JSON.stringify({code:'application_unavailable'}))});
test('attachment must belong to verified account storage path',async()=>{const f=await fixture();assert.equal((await f.post({draft_file_path:'https://fictional.invalid/storage/v1/object/public/user-documents/user_uploads/other/draft_1.txt'})).status,400);assert.equal(f.counts().writes,0)});
test('conditional update and frontend contracts',async()=>{
 assert.ok(source.includes(".eq('user_id', identity.id).eq('role', 'reader').eq('is_approved', false)"));
 assert.ok(!source.includes('.insert(') && !source.includes('.upsert('));
 const form=await readFile(new URL('../src/lib/components/AuthorSignupForm.svelte',import.meta.url),'utf8');
 assert.ok(!form.includes(".from('user_profiles')") && !form.includes("role: 'author'"));assert.match(form,/author_application_intent/);assert.match(form,/intentReady/);
 const profile=await readFile(new URL('../src/lib/components/user/UserProfile.svelte',import.meta.url),'utf8');assert.ok(profile.includes("goto('/author/signup')"));assert.doesNotMatch(profile,/role: "author"/);
});
