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
    <h2 class=" text-5xl text-primary text-center mb-16 flex justify-between items-center">
      <span></span>
      <a href={url}>{title}</a>
      <a href={url} class="text-3xl">更多</a>
    </h2>
    <div class="grid grid-cols-4 gap-8">
      {#each novels as novel}
        <NovelCard {novel} />
      {/each}
    </div>
  </div>
</section>
