<script lang="ts">
  import type { Gift } from "$lib/types/gift";
  import { writable } from "svelte/store";

  export let gifts: Gift[];
  export let onSelectGift: (gift: Gift) => void;
  export let disabled = false;
  export let chapterId: string;

  const showAll = writable(false);

  $:{
    if (chapterId) {
      showAll.set(false);
    }
  }
</script>

<div class="space-y-4">
  <div class="grid grid-cols-4 gap-4">
    {#each $showAll ? gifts : gifts.slice(0, 4) as gift}
      <button
        on:click={() => onSelectGift(gift)}
        {disabled}
        class="py-2 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
      >
        <img src={gift.image} alt={gift.title} class="w-8 h-8 mx-auto mb-2" />
        <div class="text-sm text-gray-600">{gift.title}</div>
        <div class="text-xs text-gray-500 mt-1">
          ${gift.price} / ¥{gift.price_cn}
        </div>
      </button>
    {/each}
  </div>

  {#if gifts.length > 4}
    <button
      class="text-blue-500 text-sm hover:underline mt-2"
      on:click={() => $showAll = !$showAll}
    >
      {#if $showAll}收起礼物{:else}更多礼物{/if}
    </button>
  {/if}
</div>
