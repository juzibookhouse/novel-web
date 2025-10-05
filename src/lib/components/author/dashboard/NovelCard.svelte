<script lang="ts">
  import { COVER_PLACEHOLDER } from "$lib/constants";
  import Btn from "$lib/components/common/Btn.svelte";
    import type { Novel } from "$lib/novel";
    import { sendRequest } from "$lib/api";

  export let novel: Novel;
  export let onEdit: () => void;
  export let onAddChapter: () => void;
  export let fetchNovels: () => void;

  let showDeleteConfirm = false;
  let isDeleting = false;
  let deleteError = "";

  async function handleDelete() {
    try {
      isDeleting = true;
      deleteError = "";
      const {data:{error}} = await sendRequest(`/api/novels/${novel.id}`,{method: 'DELETE'});
      
      if (error) throw error;
      
      fetchNovels();
      showDeleteConfirm = false;
    } catch (e: any) {
      deleteError = e.message || "删除失败，请重试";
    } finally {
      isDeleting = false;
    }
  }
</script>

<div
  class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-400 shadow-lg overflow-hidden p-3"
>
  <div class="flex items-start gap-3">
    <div class="w-32 h-44 flex-shrink-0">
      <a href="/novel/{novel.id}">
        <img
          src={novel.cover_url || COVER_PLACEHOLDER}
          alt={novel.title}
          class="w-full h-full object-cover rounded-lg"
        />
      </a>
    </div>
    <div class="flex-grow">
      <div class="flex justify-between items-center">
        <h3 class="text-2xl font-medium text-gray-900 mb-2">{novel.title}</h3>
        <div class="flex gap-2">
          <Btn
            handleClick={onEdit}
            title="编辑小说"
            cssClass="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 px-4 py-2 rounded text-sm transition duration-200"
          />
          <Btn
            handleClick={() => showDeleteConfirm = true}
            title="删除小说"
            cssClass="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded text-sm transition duration-200"
          />
        </div>
      </div>

      <div class="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div class="flex flex-wrap gap-2">
          {#each novel.categories || [] as category}
            <span class="bg-red-100 text-primary px-2 py-1 rounded-full">
              {category.name}
            </span>
          {/each}
        </div>
        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {novel.status === "ongoing" ? "连载中" : "已完结"}
        </span>
        <span>章节：{novel.chapters?.length || 0}</span>
      </div>
      <p class="text-gray-700">{novel.description}</p>
      <div class="mt-4">
        <Btn
          handleClick={onAddChapter}
          title="添加新章节"
        />
      </div>
    </div>
  </div>
</div>

{#if showDeleteConfirm}
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-xl font-medium text-gray-900 mb-4">确认删除</h3>
      <p class="text-gray-600 mb-6">
        您确定要删除《{novel.title}》吗？此操作将同时删除所有相关章节，且不可恢复。
      </p>
      {#if deleteError}
        <p class="text-red-600 mb-4">{deleteError}</p>
      {/if}
      <div class="flex justify-end gap-4">
        <button
          type="button"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
          on:click={() => showDeleteConfirm = false}
          disabled={isDeleting}
        >
          取消
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 disabled:opacity-50"
          on:click={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "删除中..." : "确认删除"}
        </button>
      </div>
    </div>
  </div>
{/if}