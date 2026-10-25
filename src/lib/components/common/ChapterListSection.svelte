<script lang="ts" generics="T extends OrderedChapter">
  import {
    getChapterListView,
    sortChaptersForDisplay,
    type ChapterSortDirection,
    type OrderedChapter
  } from '$lib/chapterList';

  export let chapters: readonly T[] = [];
  export let title = '目录';
  export let columns = 2;
  export let collapsedRows = 2;
  export let defaultSortDirection: ChapterSortDirection = 'desc';
  export let initiallyCollapsed = true;

  let direction = defaultSortDirection;
  let expanded = !initiallyCollapsed;
  // Expanding/collapsing only slices the already sorted list; it does not sort again.
  $: orderedChapters = sortChaptersForDisplay(chapters, direction);
  $: view = getChapterListView(orderedChapters, expanded, columns, collapsedRows);
  $: nextDirectionLabel = direction === 'desc' ? '正序' : '倒序';
  $: directionLabel = direction === 'desc' ? '倒序' : '正序';
</script>

<section aria-label={title}>
  <div class="mb-4 flex items-center justify-between gap-3">
    <div class="min-w-0">
      <slot name="heading"><h2 class="text-xl text-primary">{title}</h2></slot>
    </div>
    <button
      type="button"
      class="shrink-0 rounded border border-gray-400 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={`切换为${nextDirectionLabel}，当前${directionLabel}`}
      on:click={() => direction = direction === 'desc' ? 'asc' : 'desc'}
    >
      {directionLabel} <span aria-hidden="true">{direction === 'desc' ? '↓' : '↑'}</span>
    </button>
  </div>

  <div class="chapter-grid" style={`--chapter-columns: ${view.columns}`}>
    {#each view.visibleChapters as chapter (chapter.id)}
      <div class="min-w-0 [overflow-wrap:anywhere]"><slot {chapter} /></div>
    {/each}
  </div>

  {#if view.canExpand}
    <button
      type="button"
      class="mx-auto mt-4 flex items-center gap-2 rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-expanded={expanded}
      aria-label={expanded ? '收起章节列表' : '展开全部章节'}
      on:click={() => expanded = !expanded}
    >
      {expanded ? '收起章节' : `展开全部（${chapters.length}章）`}
      <svg class:rotate-180={expanded} class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  {/if}
</section>

<style>
  .chapter-grid {
    display: grid;
    grid-template-columns: repeat(var(--chapter-columns), minmax(0, 1fr));
    gap: 1rem;
  }
</style>
