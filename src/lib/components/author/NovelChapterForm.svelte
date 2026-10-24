<script lang="ts">
    import { CHAPTER_FREE_OPTIONS, type Chapter, type Novel } from "$lib/novel";
    import { supabase, upsertChapter, deleteChapter } from "$lib/supabaseClient";
    import { error } from "@sveltejs/kit";
    import { onMount, onDestroy } from "svelte";
    import { sendRequest } from "$lib/api";
    import TextInput from "./TextInput.svelte";
    import CheckInput from "./CheckInput.svelte";
    import Btn from "../common/Btn.svelte";
  import SelectInput from "./SelectInput.svelte";
    import { EMPTY_CHAPTER } from "$lib/types/novel";


  export let fetchNovels:Function;
  export let newChapter:Chapter;
  export let toggleNovelChapterForm:Function;
  export let selectedNovel:Novel;

  let mounted = false;
  let loadState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  let loadError = '';
  let saveError = '';
  let saving = false;
  let requestedKey = '';
  let loadedKey = '';
  let generation = 0;
  const chapterKey = (novelId: string, chapterId: string) => JSON.stringify([novelId || '', chapterId || '']);
  onMount(() => { mounted = true; });
  onDestroy(() => { mounted = false; generation++; });
  $: if (mounted) void loadChapter(selectedNovel?.id, newChapter.id);
  $: saveBlocked = saving || Boolean(newChapter.id &&
    (loadState !== 'loaded' || loadedKey !== chapterKey(selectedNovel?.id, newChapter.id)));

  async function loadChapter(novelId: string, chapterId: string, retry = false) {
    const key = chapterKey(novelId, chapterId);
    if (!retry && requestedKey === key) return;
    requestedKey = key;
    const attempt = ++generation;
    loadedKey = '';
    loadError = '';
    saveError = '';
    if (!chapterId) { loadState = 'idle'; return; }
    loadState = 'loading';
    try {
      if (!novelId) throw new Error('missing_novel');
      const { data, error, status } = await sendRequest(
        `/api/novels/${encodeURIComponent(novelId)}/chapters/${encodeURIComponent(chapterId)}`);
      if (!mounted || attempt !== generation || chapterKey(selectedNovel?.id, newChapter.id) !== key) return;
      if (error) {
        loadError = status === 401 ? '登录已失效，请重新登录后重试。' :
          status === 403 ? '无法读取此章节，请检查账号权限后重试。' :
          status === null ? '网络连接失败，请恢复网络后重试。' : '章节加载失败，请稍后重试。';
        loadState = 'error';
        return;
      }
      const chapter = data?.chapter;
      if (!chapter || chapter.id !== chapterId || chapter.novel_id !== novelId ||
          typeof chapter.content !== 'string' || typeof chapter.title !== 'string') throw new Error('incomplete_chapter');
      newChapter = { ...chapter };
      loadedKey = key;
      loadState = 'loaded';
    } catch {
      if (!mounted || attempt !== generation || chapterKey(selectedNovel?.id, newChapter.id) !== key) return;
      loadError = '章节正文未能完整加载，请重试；当前禁止保存。';
      loadState = 'error';
    }
  }

  async function createChapter() {
    // Recheck synchronously: reactive rendering may not yet reflect a prop switch.
    if (saving || (newChapter.id && (loadState !== 'loaded' ||
      loadedKey !== chapterKey(selectedNovel?.id, newChapter.id)))) return;
    saving = true;
    saveError = '';
    const attempt = generation;
    const key = chapterKey(selectedNovel?.id, newChapter.id);
    try {
      if (!selectedNovel?.id) throw new Error('请选择小说');
      
      const chapterHTMLContent = document.querySelector('.ql-editor');
      //only inclue ql-editor content without the father element
      if (chapterHTMLContent) {
        newChapter.content = chapterHTMLContent.innerHTML;
      }
      const result = await upsertChapter(newChapter);
      if (!result || result.error) throw new Error('save_failed');
      if (!mounted || attempt !== generation || chapterKey(selectedNovel?.id, newChapter.id) !== key) return;

      newChapter = {...EMPTY_CHAPTER};
      
      fetchNovels();
      toggleNovelChapterForm()
    } catch {
      if (mounted && attempt === generation) saveError = '保存未成功，请保留正文并重试。';
    } finally { saving = false; }
  }

  async function deleteChapterHandler() {
    if (!newChapter.id) return;
    
    if (!confirm('确定要删除这个章节吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      const {error: err} = await deleteChapter(newChapter.id);
      if (err) throw err;
      
      fetchNovels();
      toggleNovelChapterForm();
    } catch (e: any) {
      console.error(e.message);
    }
  }
</script>
<div
  class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
>
  <div
    class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[80vh] overflow-y-scroll"
  >
    <div class="px-6 py-4 border-b-2 border-gray-400">
      <h3 class="text-xl font-medium text-gray-900">
        添加新章节 - {selectedNovel.title}
      </h3>
    </div>
    <form on:submit|preventDefault={createChapter} class="px-6 py-4">
      {#if newChapter.id && loadState !== 'error' && (loadState === 'loading' || loadedKey !== chapterKey(selectedNovel?.id, newChapter.id))}
        <p role="status">正在加载章节，成功前不能保存。</p>
      {/if}
      {#if loadError}
        <p role="alert" class="text-red-600">{loadError}</p>
        <button type="button" disabled={saving} on:click={() => loadChapter(selectedNovel?.id, newChapter.id, true)}>重新加载</button>
      {/if}
      {#if saveError}<p role="alert" class="text-red-600">{saveError}</p>{/if}
      <fieldset disabled={saveBlocked}>
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-2">

          <TextInput title="章节标题" object={newChapter} field="title" />
  
          <CheckInput title="发布" object={newChapter} field="published" />
          <SelectInput title="章节免费" object={newChapter} field="is_free" options={CHAPTER_FREE_OPTIONS} />
          <!-- <TextInput title="引文(用于随机显示在首页)" object={newChapter} field="quotation" rows={3} /> -->
        </div>

        <div class="overflow-y-scroll">
          <label for="content" class="block text-sm font-medium text-gray-700"
            >章节内容</label
          >
          <div class="h-85">
            <div
              id="chapterEditor"
              inert={saveBlocked}
              contenteditable
              on:paste={(e) =>
                {
                  newChapter.content = document.getElementById('chapterEditor')?.innerHTML;
                }
              }
              bind:innerHTML={newChapter.content}
              class="w-full mt-1 block rounded-md border-2 border-red-200"
              placeholder="请输入章节内容"
            ></div>
          </div>
        </div>

      </div>
      </fieldset>

      <div class="flex justify-between items-center mt-25">
        <div>
          {#if newChapter.id }
            <button 
              type="button" 
              on:click={deleteChapterHandler}
              class="inline-flex cursor-pointer justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              删除章节
            </button>
          {/if}
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <Btn type="button" handleClick={() => toggleNovelChapterForm()} cssClass="border-2" title="取消" />
          <Btn type="submit" disabled={saveBlocked} cssClass="bg-(--primary-color) text-white" title={saving ? "保存中…" : newChapter.id ? "更新" : "创建"} />
        </div>
      </div>
    </form>
  </div>
</div>
