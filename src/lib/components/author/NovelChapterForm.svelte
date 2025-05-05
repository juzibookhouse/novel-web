<script lang="ts">
    import type { Chapter, Novel } from "$lib/novel";
    import { supabase, upsertChapter } from "$lib/supabaseClient";
    import { error } from "@sveltejs/kit";


  export let fetchNovels:Function;
  export let newChapter:Chapter;
  export let toggleNovelChapterForm:Function;
  export let selectedNovel:Novel;

  async function createChapter() {
    try {
      if (!selectedNovel?.id) throw new Error('请选择小说');
      const {data,error} = await upsertChapter(newChapter);
      if (error) throw error;
      
      fetchNovels();
      toggleNovelChapterForm()
    } catch (e: any) {
      // error = e.message;
    }
  }
</script>
<div
  class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
>
  <div
    class="bg-white rounded-lg overflow-hidden shadow-xl max-w-lg w-full mx-4"
  >
    <div class="px-6 py-4 border-b-2 border-red-100">
      <h3 class="text-xl font-medium text-gray-900">
        添加新章节 - {selectedNovel.title}
      </h3>
    </div>
    <form on:submit|preventDefault={createChapter} class="px-6 py-4">
      <div class="space-y-4">
        <div>
          <label
            for="chapter-title"
            class="block text-sm font-medium text-gray-700">章节标题</label
          >
          <input
            type="text"
            id="chapter-title"
            bind:value={newChapter.title}
            required
            class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
            placeholder="请输入章节标题"
          />
        </div>
        <div>
          <label
            for="chapter-is_free"
            class="block text-sm font-medium text-gray-700">章节免费</label
          >
          <input
            type="checkbox"
            id="chapter-is_free"
            bind:checked={newChapter.is_free}
            class=""
          />
        </div>
        <div class="">
          <label for="content" class="block text-sm font-medium text-gray-700"
            >章节内容</label
          >
          <div class="h-96">
            <div
              id="chapterEditor"
              contenteditable
              on:paste={(e) =>
                (newChapter.content = e.clipboardData?.getData("text/html"))}
              bind:innerHTML={newChapter.content}
              class="w-full mt-1 block rounded-md border-2 border-red-200 overflow-hidden overflow-y-scroll"
              placeholder="请输入章节内容"
            ></div>
          </div>
        </div>
      </div>
      <div class="mt-15 flex justify-end gap-3">
        <button
          type="button"
          on:click={() => toggleNovelChapterForm()}
          class="px-4 py-2 border-2 border-red-200 rounded-md"
        >
          取消
        </button>
        <button
          type="submit"
          class="px-4 py-2 bg-[#FEF9D5] text-white rounded-md hover:bg-red-700"
        >
          创建
        </button>
      </div>
    </form>
  </div>
</div>
