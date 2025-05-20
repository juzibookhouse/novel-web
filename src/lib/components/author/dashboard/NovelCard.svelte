<script lang="ts">
  import { COVER_PLACEHOLDER } from "$lib/constants";
  import Btn from "$lib/components/common/Btn.svelte";

  export let novel: {
    id: string;
    title: string;
    cover_url: string;
    status: string;
    word_count: number;
    updated_at: string;
    categories: Array<{ name: string }>;
    description: string;
    chapters: Array<any>;
  };
  export let isSelected: boolean;
  export let onEdit: () => void;
  export let onAddChapter: () => void;
</script>

<div
  class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-400 shadow-lg overflow-hidden"
>
  <div class="p-6">
    <div class="flex items-start gap-6">
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
          <Btn
            handleClick={onEdit}
            title="编辑小说"
            cssClass="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm transition duration-200"
          />
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
            cssClass="px-4 py-2 rounded-full text-sm"
          />
        </div>
      </div>
    </div>
  </div>
</div>
