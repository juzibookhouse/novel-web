<script lang="ts">
  import { user } from "$lib/stores/authStore";
import type { Gift } from "$lib/types/gift";
  export let chapterGifts: Gift[];
  export let isUserBookAuthor: boolean = true;
</script>

{#if $user?.isAdmin && chapterGifts.length > 0}
  <div class="flex gap-1 items-center">
    <h3 class="text-lg font-medium text-gray-700">已收到的打赏</h3>
    <div class="flex overflow-x-auto gap-1">
      {#each chapterGifts as gift}
        <img
          src={gift.image}
          alt={gift.title}
          title={($user?.isAdmin || isUserBookAuthor) ? gift.title : ''}
          class="w-6 h-6"
          loading="lazy"
        />
      {/each}
    </div>
  </div>
{/if}
