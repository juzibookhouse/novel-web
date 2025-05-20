<script lang="ts">
  import Btn from '$lib/components/common/Btn.svelte';
  
  export let chapters: Array<{
    id: string;
    title: string;
    number: number;
    isPublished: boolean;
    createdAt: string;
    wordCount: number;
  }>;
  export let selectedNovelId: string;
  export let onEdit: (chapter: any) => void;
</script>

<div class="border-t-2 border-gray-400 px-6 py-4">
  <h4 class="text-lg font-medium text-gray-900 mb-4">章节列表</h4>
  <div class="grid grid-cols-3 gap-4">
    {#each chapters as chapter}
      <div class="group p-3 rounded-lg border-2 border-gray-400 hover:border-red-300 hover:bg-red-50 transition-all duration-200">
        <div class="flex justify-between items-center">
          <a
            href={`/novel/${selectedNovelId}/chapter/${chapter.id}`}
            class="text-gray-900 group-hover:text-primary transition-colors duration-200"
          >
            <h5>第{chapter.number}章: {chapter.title}</h5>
          </a>
          <Btn 
            handleClick={() => onEdit(chapter)}
            title="编辑"
            cssClass="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200"
          />
        </div>
      </div>
    {/each}
  </div>
</div>