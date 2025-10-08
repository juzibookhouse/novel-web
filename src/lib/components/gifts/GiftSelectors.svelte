<script lang="ts">
  import type { Gift } from "$lib/types/gift";

  export let gifts: Gift[];
  export let onSelectGift: (gift: Gift) => void;
  export let disabled = false;
</script>

<div>
  <h3 class="text-xl font-medium mb-4 text-gray-700">给作者送礼物</h3>

  <div class="grid grid-cols-3 gap-4">
    {#each gifts as gift}
      <button
        on:click={() => onSelectGift(gift)}
        {disabled}
        class="py-3 px-4 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
      >
        <div class="text-3xl mb-2 text-gray-800">{gift.image}</div>
        <div class="text-sm text-gray-600">{gift.title}</div>
        <div class="text-xs text-gray-500 mt-1">${gift.price} / ¥{gift.price_cn}</div>
      </button>
    {/each}
  </div>
</div>
