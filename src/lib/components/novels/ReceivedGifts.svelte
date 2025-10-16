<script lang="ts">
  export let chapterGifts: any[];
</script>

{#if chapterGifts.length > 0}
  <div class="mb-4">
    <h3 class="text-lg font-medium mb-2 text-gray-700">已收到的打赏</h3>
    <div class="flex space-x-1 overflow-x-auto pb-1">
      {#each chapterGifts as gift}
        <div class="text-3xl mb-1">{gift.image}</div>
      {/each}
    </div>
  </div>
{/if}