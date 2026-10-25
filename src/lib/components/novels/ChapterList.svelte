<script lang="ts">
  import ChapterListSection from '$lib/components/common/ChapterListSection.svelte';
  import type { Novel } from '$lib/novel';
  export let novel: Pick<Novel, 'id' | 'chapters'>;
</script>

<!-- Chapter List -->
<div class="p-4 sm:p-8">
  {#key novel.id}
    <ChapterListSection chapters={novel.chapters ?? []} columns={2} collapsedRows={2} defaultSortDirection="desc" initiallyCollapsed={true} let:chapter>
      <h2 slot="heading" class="text-2xl text-primary">目录</h2>
      <a
        href={`/novel/${novel.id}/chapter/${chapter.id}`}
        class="chapter-link group block h-full rounded border border-gray-400 p-3 transition-all duration-200 hover:border-gray-300 sm:p-4"
      >
        <h3
          class="text-base text-[var(--primary-color)] group-hover:text-primary transition-colors duration-200 sm:text-lg"
        >
          {chapter.title}
        </h3>
        <span class="mt-2 inline-block max-w-full rounded bg-green-100 px-2 py-1 text-xs text-green-800">
          {chapter.is_free}
        </span>
      </a>
    </ChapterListSection>
  {/key}
</div>

<style>
  .chapter-link { overflow-wrap: anywhere; }
</style>
