// Offline component-script tests. Supabase writes and DOM are mocked; no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
const source = await readFile(new URL('../src/lib/components/author/NovelChapterForm.svelte', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const blank = { id: '', novel_id: 'novelA', title: '', content: '', published: true };
const chapter = id => ({ ...blank, id, title: 'Fictional title', content: `<p>Body ${id}</p>` });
const reply = (id, extra = {}) => Response.json({ chapter: { ...chapter(id), ...extra } });
async function fixture(options = {}) {
  let mount, destroy, writes = [], calls = [], closes = 0, refreshes = 0;
  const props = options.new ? { ...blank } : { ...chapter('A'), content: undefined };
  const context = vm.createContext({ Response, Headers, URL, console,
    seed: props, novel: { id: 'novelA', title: 'Fictional novel' },
    refresh: () => { refreshes++; }, close: () => { closes++; },
    document: { querySelector: () => null },
    localStorage: { getItem: key => {
      assert.equal(key, 'sb-fictional-auth-token');
      return options.noToken ? null : JSON.stringify({ access_token: options.invalidToken ? 'invalid' : 'fictional-token' });
    } },
    fetch: async (url, init) => {
      calls.push({ url, token: init.headers.get('Authorization') });
      if (options.networkFailure) throw Error('offline');
      if (options.fetch) return options.fetch(url, init);
      if (!init.headers.get('Authorization') || options.invalidToken) return Response.json({ code: 'credentials_invalid' }, { status: 401 });
      if (options.status) return Response.json({ code: 'request_failed' }, { status: options.status });
      return reply(url.split('/').pop(), options.chapter);
    }
  });
  let script = source.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
    .replace('export let newChapter:Chapter;', 'let newChapter:Chapter = seed;')
    .replace('export let selectedNovel:Novel;', 'let selectedNovel:Novel = novel;')
    .replace('export let fetchNovels:Function;', 'let fetchNovels:Function = refresh;')
    .replace('export let toggleNovelChapterForm:Function;', 'let toggleNovelChapterForm:Function = close;');
  script = 'let saveBlocked;\n' + script + `
    export { loadChapter, createChapter };
    export function target(id, novelId='novelA') { selectedNovel={id:novelId};newChapter={...seed,id,novel_id:novelId,content:undefined}; }
    export function state() { return { loadState, loadError, saveError, loadedKey, content:newChapter.content, id:newChapter.id, saving }; }
  `;
  const imports = {
    '$lib/novel': { CHAPTER_FREE_OPTIONS: [] },
    '$lib/types/novel': { EMPTY_CHAPTER: blank },
    '$env/static/public': { PUBLIC_SUPABASE_URL: 'https://fictional.supabase.co' },
    '@sveltejs/kit': { error: () => {} },
    '$lib/supabaseClient': { supabase: {}, deleteChapter: async () => { throw Error('Deletion is out of scope'); },
      upsertChapter: async data => { writes.push({ ...data }); if (options.save) return options.save(data); return { data: null, error: null }; } },
    svelte: { onMount: fn => { mount = fn; }, onDestroy: fn => { destroy = fn; } }
  };
  const cache = new Map();
  async function link(name) {
    if (cache.has(name)) return cache.get(name);
    let m;
    if (name === '$lib/api') m = new vm.SourceTextModule(stripTypeScriptTypes(apiSource), { context });
    else {
      const values = name.endsWith('.svelte') ? { default: {} } : imports[name];
      assert.ok(values, name);
      m = new vm.SyntheticModule(Object.keys(values), function () { for (const [k, v] of Object.entries(values)) this.setExport(k, v); }, { context });
    }
    cache.set(name, m); await m.link(link); return m;
  }
  const module = new vm.SourceTextModule(stripTypeScriptTypes(script, { mode: 'transform' }), { context });
  await module.link(link); await module.evaluate(); mount();
  return { ui: module.namespace, load: () => module.namespace.loadChapter('novelA', options.new ? '' : 'A'),
    calls, writes, closed: () => closes, refreshed: () => refreshes, destroy };
}

test('component markup compiles and save button is disabled independently of submit guard', () => {
  assert.doesNotThrow(() => compile(source, { generate: 'server', filename: 'NovelChapterForm.svelte' }));
  assert.match(source, /type="submit" disabled=\{saveBlocked\}/);
  assert.match(source, /inert=\{saveBlocked\}/);
});
test('existing chapter uses real request helper Token and saves only fully loaded body', async () => {
  const f = await fixture(); await f.ui.createChapter(); assert.equal(f.writes.length, 0);
  await f.load(); assert.equal(f.calls[0].token, 'Bearer {"access_token":"fictional-token"}'); assert.equal(f.ui.state().loadState, 'loaded');
  await f.ui.createChapter(); assert.equal(f.writes.length, 1); assert.equal(f.writes[0].content, '<p>Body A</p>'); assert.equal(f.closed(), 1);
});
for (const opts of [{ noToken: true }, { invalidToken: true }, { networkFailure: true }, { status: 403 }, { status: 404 }, { status: 500 },
  { chapter: { content: undefined } }, { chapter: { id: 'wrong' } }, { chapter: { novel_id: 'wrong' } }])
test('failed or incomplete chapter load never reaches save', async () => {
  const f = await fixture(opts); await f.load(); assert.equal(f.ui.state().loadState, 'error'); assert.ok(f.ui.state().loadError);
  await f.ui.createChapter(); assert.equal(f.writes.length, 0); assert.equal(f.closed(), 0);
});
test('network retry can unlock the same chapter only after successful reload', async () => {
  let failed = true; const f = await fixture({ fetch: () => failed ? Promise.reject(Error('offline')) : reply('A') });
  await f.load(); assert.equal(f.ui.state().loadState, 'error'); failed = false;
  await f.ui.loadChapter('novelA', 'A', true); assert.equal(f.ui.state().loadState, 'loaded');
  await f.ui.createChapter(); assert.equal(f.writes.length, 1);
});
test('switch invalidates save immediately; late old response cannot replace new chapter', async () => {
  let resolveA; const pending = new Promise(r => { resolveA = r; });
  const f = await fixture({ fetch: url => url.endsWith('/A') ? pending : reply('B') });
  const first = f.load(); f.ui.target('B'); await f.ui.createChapter(); assert.equal(f.writes.length, 0);
  await f.ui.loadChapter('novelA', 'B'); resolveA(reply('A')); await first;
  assert.equal(f.ui.state().id, 'B'); assert.equal(f.ui.state().content, '<p>Body B</p>');
  await f.ui.createChapter(); assert.equal(f.writes[0].id, 'B');
});
test('duplicate automatic load does not create duplicate requests', async () => {
  let resolve; const pending = new Promise(r => { resolve = r; }); const f = await fixture({ fetch: () => pending });
  const first = f.load(); await f.load(); assert.equal(f.calls.length, 1); await f.ui.createChapter(); assert.equal(f.writes.length, 0);
  resolve(reply('A')); await first;
});
test('new chapter needs no historical body and retains normal create flow', async () => {
  const f = await fixture({ new: true }); await f.load(); assert.equal(f.calls.length, 0);
  await f.ui.createChapter(); assert.equal(f.writes.length, 1); assert.equal(f.writes[0].id, ''); assert.equal(f.closed(), 1);
});
test('duplicate save blocked, and stale save cannot close a different chapter', async () => {
  let resolve; const pending = new Promise(r => { resolve = r; }); const f = await fixture({ save: () => pending });
  await f.load(); const first = f.ui.createChapter(); await f.ui.createChapter(); assert.equal(f.writes.length, 1);
  f.ui.target('B'); await f.ui.loadChapter('novelA', 'B'); resolve({ error: null }); await first;
  assert.equal(f.closed(), 0); assert.equal(f.ui.state().id, 'B');
});
for (const result of [undefined, { error: { message: 'failed' } }]) test('reported save failure keeps editor open', async () => {
  const f = await fixture({ save: async () => result }); await f.load(); await f.ui.createChapter();
  assert.equal(f.closed(), 0); assert.ok(f.ui.state().saveError); assert.equal(f.ui.state().content, '<p>Body A</p>');
});
test('unmounted component ignores a late chapter response', async () => {
  let resolve; const f = await fixture({ fetch: () => new Promise(r => { resolve = r; }) });
  const load = f.load(); f.destroy(); resolve(reply('A')); await load; assert.notEqual(f.ui.state().loadState, 'loaded');
});

// Account candidate: existing author-list loading errors, no API or database calls.
const dashboardSource=await readFile(new URL('../src/routes/author/dashboard/+page.svelte',import.meta.url),'utf8');
const dashboardImports={
 svelte:{onMount:()=>{}},'$lib/supabaseClient':{supabase:{},getAuthorNovels:()=>{},getCategories:()=>{},getTags:()=>{}},
 '$lib/stores/authStore':{user:{subscribe:fn=>{fn({role:'author',is_approved:true});return ()=>{}}}},
 '$lib/constants':{COVER_PLACEHOLDER:'',WEBSITE_NAME:'Fictional'},quill:{default:class{}},
 '$lib/novel':{getSortedChapters:value=>value},'$lib/types/novel':{EMPTY_CHAPTER:{}}
};
for(const path of ['$lib/components/author/NovelForm.svelte','$lib/components/author/NovelChapterForm.svelte',
 '$lib/components/author/dashboard/DashboardHeader.svelte','$lib/components/author/dashboard/NovelCard.svelte',
 '$lib/components/author/dashboard/ChapterList.svelte','$lib/components/author/dashboard/EmptyState.svelte',
 '$lib/components/author/dashboard/LoadingIndicator.svelte','$lib/components/author/dashboard/ErrorDisplay.svelte'])dashboardImports[path]={default:()=>{}};
async function dashboardFixture(replies){
 const calls=[];const context=vm.createContext({});
 const script=dashboardSource.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
 const module=new vm.SourceTextModule(stripTypeScriptTypes(script+'\nexport {fetchNovels};export function state(){return {novels,categories,tags,loading,error,currentPage,perPage,totalCount,totalPages}};',{mode:'transform'}),{context});
 const imports={...dashboardImports,'$lib/api':{sendRequest:async url=>{calls.push(url);const reply=replies.shift();if(reply instanceof Error)throw reply;return reply;}}};
 await module.link(name=>{const values=imports[name];assert.ok(values,name);return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});});await module.evaluate();return {...module.namespace,calls};
}
const validNovels={status:200,response:{ok:true},data:{novels:[{id:'fictional-novel',title:'Fictional'}],categories:[{id:'category'}],tags:[{id:'tag'}],totalCount:21,per_page:10}};
test('author list success retains novels, category/tag arrays and pagination',async()=>{
 const f=await dashboardFixture([validNovels]);await f.fetchNovels(2);const s=f.state();
 assert.equal(s.error,null);assert.equal(s.loading,false);assert.equal(s.novels[0].id,'fictional-novel');
 assert.equal(s.categories[0].id,'category');assert.equal(s.tags[0].id,'tag');
 assert.equal(s.currentPage,2);assert.equal(s.perPage,10);assert.equal(s.totalCount,21);assert.equal(s.totalPages,3);
 assert.deepEqual(f.calls,['/api/novels?page=2']);
});
for(const reply of [{status:500,response:{ok:false},error:Error('PGRST200')},{status:500,response:{ok:false}},
 {status:401},{status:403},{status:null,error:Error('offline')},undefined,{},
 {data:{novels:null}},{data:{novels:[],categories:{}}},{data:{novels:[],tags:'bad'}},
 {data:{novels:[],totalCount:-1}},{data:{novels:[],per_page:0}},new Error('network lost')])
test('author list failure is Chinese, preserves prior list/page and ends loading: '+JSON.stringify(reply),async()=>{
 const f=await dashboardFixture([validNovels,reply]);await f.fetchNovels(2);await f.fetchNovels(3);const s=f.state();
 assert.ok(s.error);assert.match(s.error,/小说列表|登录/);assert.doesNotMatch(s.error,/undefined|Cannot read|PGRST200/);
 assert.equal(s.loading,false);assert.equal(s.currentPage,2);assert.equal(s.novels[0].id,'fictional-novel');assert.equal(s.totalCount,21);
});
test('author list retry recovers from failure, clears error and accepts a genuine empty list',async()=>{
 const f=await dashboardFixture([{status:500,response:{ok:false}},{status:200,data:{novels:[],categories:[],tags:[],totalCount:0,per_page:10}}]);
 await f.fetchNovels();assert.ok(f.state().error);await f.fetchNovels();assert.equal(f.state().error,null);
 assert.equal(f.state().novels.length,0);assert.equal(f.state().totalPages,1);assert.equal(f.state().loading,false);
});
async function authorServerComponent(source,imports){
 const context=vm.createContext({});const module=new vm.SourceTextModule(compile(source,{generate:'server'}).js.code,{context});
 await module.link(async name=>{const values=imports[name]??(name==='svelte/internal/server'?await import('svelte/internal/server'):null);assert.ok(values,name);return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});});await module.evaluate();return module.namespace.default;
}
test('author page renders the existing Chinese error and retry without an undefined crash or empty-list message',async()=>{
 const f=await dashboardFixture([{status:500,response:{ok:false}}]);await f.fetchNovels();const message=f.state().error;
 const button=await authorServerComponent(await readFile(new URL('../src/lib/components/common/Btn.svelte',import.meta.url),'utf8'),{});
 const display=await authorServerComponent(await readFile(new URL('../src/lib/components/author/dashboard/ErrorDisplay.svelte',import.meta.url),'utf8'),{'$lib/components/common/Btn.svelte':{default:button}});
 const source=dashboardSource.replace('let error: string | null = null;','let error: string | null = '+JSON.stringify(message)+';').replace('let loading: boolean = true;','let loading: boolean = false;');
 const imports={...dashboardImports,'$lib/api':{sendRequest:()=>{throw Error('No network')}},'$lib/components/author/dashboard/ErrorDisplay.svelte':{default:display}};
 const page=await authorServerComponent(source,imports);const html=render(page).body;
 assert.ok(html.includes(message));assert.ok(html.includes('重试'));assert.doesNotMatch(html,/Cannot read properties|暂无作品/);
});
