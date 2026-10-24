// Real source, mocked Resend. No SDK/network/env files are loaded.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
async function fixture(options={}) {
 const calls=[],constructors=[],logs=[];
 const env={...options.env};
 const context=vm.createContext({Request,Response,Date,console:{error:(...args)=>logs.push(args)},fetch:()=>{throw Error('Network forbidden');}});
 const imports={
  '$env/dynamic/private':{env}, '$env/static/private':{HOST_URL:'https://local.invalid'},
  './constants':{WEBSITE_NAME:'Fictional'},'$lib/constants':{WEBSITE_NAME:'Fictional'},
  '@sveltejs/kit':{json:(v,o)=>Response.json(v,o)},
  resend:{Resend:class {constructor(key){constructors.push(key);if(!key)throw Error('Missing fictional provider key');this.emails={send:async payload=>{calls.push(payload);if(options.throws)throw Error('mock transport failed');return {data:{id:'fictional-message'},error:options.providerError?new Error('mock provider failure'):null};}};}}}
 };
 const cache=new Map();async function load(name){
  const aliases={'./email':'email','$lib/email':'email','./errorLogger':'logger','$lib/errorLogger':'logger'};name=aliases[name]||name;
  if(cache.has(name))return cache.get(name);
  const paths={email:'src/lib/email.ts',logger:'src/lib/errorLogger.ts',api:'src/routes/api/admin-email/+server.ts'};
  let m;if(paths[name])m=new vm.SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../'+paths[name],import.meta.url),'utf8')),{context});
  else {assert.ok(imports[name],name);m=new vm.SyntheticModule(Object.keys(imports[name]),function(){for(const[k,v]of Object.entries(imports[name]))this.setExport(k,v);},{context});}
  cache.set(name,m);await m.link(load);return m;
 }
 const email=await load('email');await email.evaluate();const logger=await load('logger');await logger.evaluate();const api=await load('api');await api.evaluate();
 return {email:email.namespace,logger:logger.namespace,api:api.namespace,env,calls,constructors,logs};
}
const enabled={EMAIL_SENDING_ENABLED:'true',RESEND_API_KEY:'fictional-provider-key',EMAIL_FROM:'sender@example.invalid',ADMIN_EMAIL:'admin@example.invalid',HOST_URL:'https://local.invalid'};
for(const value of [undefined,'','false','TRUE','True','1',' true','true ',true])test('mail is disabled unless private flag is exact string true: '+String(value),async()=>{
 const f=await fixture({env:{EMAIL_SENDING_ENABLED:value}});
 for(const result of [await f.email.sendEmail('recipient@example.invalid','Fictional','<p>Test</p>'),
   await f.email.sendAdminEmail('new_user'),await f.email.sendAdminEmail('new_author'),await f.email.sendAdminEmail('new_contact_form'),
   await f.email.sendAdminEmail('new_subscription'),await f.email.sendPaymentConfirmationEmail(undefined,undefined,0)]){
  assert.equal(result.skipped,true);assert.equal(result.reason,'email_sending_disabled');assert.equal(result.id,undefined);
 }
 await f.logger.logError(new Error('fictional error'));
 const r=await f.api.POST({request:new Request('https://local.invalid',{method:'POST',body:JSON.stringify({type:'new_subscription'})})});
 assert.equal(r.status,200);assert.equal(f.constructors.length,0);assert.equal(f.calls.length,0);assert.equal(f.logs.length,0);
});
test('explicit true preserves direct send payload and provider response',async()=>{const f=await fixture({env:enabled});const result=await f.email.sendEmail('recipient@example.invalid','Fictional subject','<p>Fixture</p>');assert.equal(result.id,'fictional-message');assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0])),{from:enabled.EMAIL_FROM,to:'recipient@example.invalid',subject:'Fictional subject',html:'<p>Fixture</p>'});assert.equal(f.constructors.length,1);});
for(const type of ['new_user','new_author','new_contact_form','new_subscription'])test('explicit true allows existing administrator notification type '+type,async()=>{const f=await fixture({env:enabled});await f.email.sendAdminEmail(type,{username:'Fictional',email:'reader@example.invalid',message:'Fixture'});assert.equal(f.calls.length,1);assert.equal(f.calls[0].to,enabled.ADMIN_EMAIL);});
test('explicit true allows payment confirmation through common gate',async()=>{const f=await fixture({env:enabled});await f.email.sendPaymentConfirmationEmail({email:'reader@example.invalid',profile:{user_name:'Fictional'},membership:{end_date:'2027-04-22T00:00:00.000Z'}},{name:'Fictional plan'},6);assert.equal(f.calls.length,1);assert.equal(f.calls[0].to,'reader@example.invalid');});
test('error logger is gated too; enabled uses mocked provider only',async()=>{const f=await fixture({env:enabled});await f.logger.logError(new Error('fictional error'));assert.equal(f.calls.length,1);assert.equal(f.constructors.length,1);});
test('disabling after an enabled send suppresses further provider calls',async()=>{const f=await fixture({env:enabled});await f.email.sendEmail('reader@example.invalid','Fixture','Fixture');delete f.env.EMAIL_SENDING_ENABLED;const result=await f.email.sendEmail('reader@example.invalid','Fixture','Fixture');assert.equal(result.skipped,true);assert.equal(f.calls.length,1);assert.equal(f.constructors.length,1);});
for(const opts of [{providerError:true},{throws:true}])test('enabled provider errors continue to reject',async()=>{const f=await fixture({...opts,env:enabled});await assert.rejects(()=>f.email.sendEmail('reader@example.invalid','Fixture','Fixture'));assert.equal(f.calls.length,1);});
test('enabled missing administrator config retains existing failure',async()=>{const f=await fixture({env:{EMAIL_SENDING_ENABLED:'true',RESEND_API_KEY:'fictional'}});await assert.rejects(()=>f.email.sendAdminEmail('new_user'),{status:500});assert.equal(f.calls.length,0);});
test('all application Resend transports remain behind the common private entry',async()=>{
 const senders=[];async function visit(dir){for(const entry of await readdir(new URL('../'+dir,import.meta.url),{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory())await visit(file);else if(/\.(ts|js|svelte)$/.test(file)){const source=await readFile(new URL('../'+file,import.meta.url),'utf8');if(/new Resend\(|emails\.send\(|api\.resend\.com/.test(source))senders.push(file);}}}await visit('src');assert.deepEqual(senders,['src/lib/email.ts']);const source=await readFile(new URL('../src/lib/email.ts',import.meta.url),'utf8');assert.match(source,/from '\$env\/dynamic\/private'/);assert.doesNotMatch(source,/PUBLIC_EMAIL_SENDING_ENABLED/);assert.ok(source.indexOf('if (!sendingEnabled())')<source.indexOf('new Resend('));
});

for(const missing of ['RESEND_API_KEY','EMAIL_FROM'])test('enabled but incomplete provider configuration fails without API access: '+missing,async()=>{const env={...enabled};delete env[missing];const f=await fixture({env});await assert.rejects(()=>f.email.sendEmail('reader@example.invalid','Fixture','Fixture'),{message:'Email configuration missing'});assert.equal(f.calls.length,0);assert.equal(f.constructors.length,0);});
