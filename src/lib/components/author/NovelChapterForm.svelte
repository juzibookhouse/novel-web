<script lang="ts">
    import type { Chapter, Novel } from "$lib/novel";
    import { supabase, upsertChapter } from "$lib/supabaseClient";
    import { error } from "@sveltejs/kit";
    import TextInput from "./TextInput.svelte";
    import CheckInput from "./CheckInput.svelte";
    import Btns from "./Btns.svelte";


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
      <div class="space-y-2">

        <TextInput title="章节标题" object={newChapter} field="title" />

        <CheckInput title="发布" object={newChapter} field="published" />
        <CheckInput title="章节免费" object={newChapter} field="is_free" />

        <div class="">
          <label for="content" class="block text-sm font-medium text-gray-700"
            >章节内容</label
          >
          <div class="h-96">
            <div
              id="chapterEditor"
              contenteditable
              on:paste={(e) =>
                {
                  newChapter.content = document.getElementById('chapterEditor')?.innerHTML;
                }
              }
              bind:innerHTML={newChapter.content}
              class="w-full mt-1 block rounded-md border-2 border-red-200 overflow-hidden overflow-y-scroll"
              placeholder="请输入章节内容"
            ></div>
          </div>
        </div>
      </div>

      <Btns handleCancel={toggleNovelChapterForm} confirmText={newChapter.id ? "更新" : "创建"} cssClass="mt-15" />
    </form>
  </div>
</div>
