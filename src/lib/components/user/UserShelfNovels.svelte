<script lang="ts">
  import { supabase } from "$lib/supabaseClient";
  import { user } from "$lib/stores/authStore";
  import { onMount } from "svelte";
  import type { Novel } from "$lib/novel";
    import NovelCard from "../novels/NovelCard.svelte";

  let shelfNovels: Novel[] = [];

  onMount(async () => {
    if ($user) {
      // Fetch bookshelf novels
      const { data: shelf } = await supabase
        .from("bookshelves")
        .select(
          `
            *,
            novels (
              id,
              title,
              cover_url,
              status
            )
          `,
        )
        .eq("user_id", $user.id);

      if (shelf) {
        shelfNovels = shelf.map((item) => item.novels);
      }
    }
  });
</script>

<div class="p-6">
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {#each shelfNovels as novel}
      <NovelCard novel={novel} />
    {/each}
  </div>
</div>
