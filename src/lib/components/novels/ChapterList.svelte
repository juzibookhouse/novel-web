<script lang="ts">
  export let novel;
</script>

<!-- Chapter List -->
<div class="p-8">
  <h2 class=" text-2xl text-primary mb-6">目录</h2>
  <div class="grid grid-cols-2 gap-4">
    {#each novel.chapters as chapter}
      <a
        href={`/novel/${novel.id}/chapter/${chapter.id}`}
        class="group p-4 rounded border-2 border-gray-400 hover:border-gray300 hover: transition-all duration-200 relative"
      >
        <h3
          class="text-lg text-[var(--primary-color)] group-hover:text-primary transition-colors duration-200"
        >
          {chapter.title}
        </h3>
          <span class="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            {chapter.is_free}
          </span>
      </a>
    {/each}
  </div>
</div>
