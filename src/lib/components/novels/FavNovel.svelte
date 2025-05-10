<script lang="ts">
  import { user } from "$lib/stores/authStore";
  import { addUserNovel, checkUserNovel, removeUserNovel } from "$lib/supabaseClient";
  import { onMount } from "svelte";
  export let novelId:string;
  let isInBookshelf = false;
  let loading = false;

  onMount(async()=>{
    if (!$user) return;
    const { data: bookshelf } = await checkUserNovel($user, novelId);
    isInBookshelf = !!bookshelf;
  });

  async function toggleBookshelf() {
    if (!$user) return;
    try {
      loading = true;
      if (isInBookshelf) {
        await removeUserNovel($user, novelId);
      } else {
        await addUserNovel($user, novelId);
      }
      isInBookshelf = !isInBookshelf;
    } finally {
      loading = false;
    }
  }
</script>

{#if $user}
  <button
    on:click={toggleBookshelf}
    disabled={loading}
    class="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-red-200 hover:border-red-300 transition-all duration-200 {isInBookshelf ? 'bg-red-50' : 'bg-white text-gray-600'}"
  >
    <span class="text-sm">
      {#if loading}
        ⋯
      {:else if isInBookshelf}
        ★
      {:else}
        ☆
      {/if}
    </span>
    <span class="text-sm font-medium">
      {loading ? '处理中...' : (isInBookshelf ? '已收藏' : '收藏')}
    </span>
  </button>
{/if}