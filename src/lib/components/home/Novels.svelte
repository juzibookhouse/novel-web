<script lang="ts">
  import NovelCard from "../novels/NovelCard.svelte";

  export let novels;
  export let title:string;
  export let url:string;
  export let bg:string;
</script>

<!-- Ongoing Novels Section -->
<section class="py-24 px-4 {bg}">
  <div class="max-w-7xl mx-auto">
    <h2 class=" text-5xl text-primary text-center mb-12 flex justify-between items-center">
      <span></span>
      <a href={url}>{title}</a>
      <a href={url} class="text-3xl">更多</a>
    </h2>
    {#if novels.length > 0}
    <div class="grid grid-cols-4 gap-8">
      {#each novels as novel}
        <NovelCard {novel} />
      {/each}
    </div>
    {:else}
    <p class="text-center text-2xl text-gray-500">暂无小说</p>
    {/if}
  </div>
</section>
