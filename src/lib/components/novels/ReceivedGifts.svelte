<script lang="ts">
    import type { Gift } from "$lib/types/gift";

  export let chapterGifts: Gift[];
</script>

{#if chapterGifts.length > 0}
  <div class="mb-4 flex gap-1 items-center">
    <h3 class="text-lg font-medium text-gray-700">已收到的打赏</h3>
    <div class="flex overflow-x-auto">
      {#each chapterGifts as gift}
        <div class="text-2xl">{gift.image}</div>
      {/each}
    </div>
  </div>
{/if}