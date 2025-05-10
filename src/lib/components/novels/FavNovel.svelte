<script lang="ts">
  import { user } from "$lib/stores/authStore";
    import { addUserNovel, checkUserNovel, removeUserNovel } from "$lib/supabaseClient";
    import { onMount } from "svelte";
  export let novelId:string;
  let isInBookshelf = false;

  onMount(async()=>{
    if (!$user) return;
    const { data: bookshelf } = await checkUserNovel($user, novelId);
    isInBookshelf = !!bookshelf;
  });

  async function toggleBookshelf() {
    if (!$user) return;

    if (isInBookshelf) {
      await removeUserNovel($user, novelId);
    } else {
      await addUserNovel($user, novelId);
    }

    isInBookshelf = !isInBookshelf;
  }
</script>

{#if $user}
  <button
    on:click={toggleBookshelf}
    class="text-red-700 cursor-pointer hover:text-primary transition-colors duration-200"
  >
    {isInBookshelf ? "移出书架" : "加入书架"}
  </button>
{/if}
