<script lang="ts">
  import ChapterListSection from '$lib/components/common/ChapterListSection.svelte';
  import type { Chapter } from '$lib/novel';
  
  export let chapters: Chapter[];
  export let selectedNovelId: string;
  export let onEdit: (chapter: any) => void;
</script>

<div class="border-t-2 border-gray-400 py-4">
  {#key selectedNovelId}
    <ChapterListSection {chapters} title="章节列表" columns={3} collapsedRows={2} defaultSortDirection="desc" initiallyCollapsed={true} let:chapter>
      <h4 slot="heading" class="text-lg font-medium text-gray-900">章节列表</h4>
      <div class="group h-full rounded border-2 border-gray-400 p-2 transition-all duration-200 hover:border-gray-300 sm:p-3">
        <div class="flex flex-col items-start justify-between gap-2">
          <a
            href={`/novel/${selectedNovelId}/chapter/${chapter.id}`}
            class="min-w-0 max-w-full text-gray-900 group-hover:text-primary transition-colors duration-200 [overflow-wrap:anywhere]"
          >
            <div>{chapter.title}</div>
          </a>
          <button type="button"
            on:click={() => onEdit(chapter)}
            class="max-w-full px-2 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
          >编辑</button>
        </div>
      </div>
    </ChapterListSection>
  {/key}
</div>
