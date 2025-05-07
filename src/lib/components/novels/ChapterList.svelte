<script lang="ts">
  export let novel;
</script>
<!-- Chapter List -->
<div class="p-8">
  <h2 class="font-['Ma_Shan_Zheng'] text-2xl text-primary mb-6">目录</h2>
  <div class="grid grid-cols-2 gap-4">
    {#each novel.chapters as chapter}
      <a
        href={`/novel/${novel.id}/chapter/${chapter.id}`}
        class="group p-4 rounded-lg border-2 border-red-100 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
      >
        <h3
          class="text-lg text-gray-900 group-hover:text-primary transition-colors duration-200"
        >
          {chapter.title}
        </h3>
      </a>
    {/each}
  </div>
</div>
