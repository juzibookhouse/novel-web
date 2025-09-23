<script lang="ts">
    import { COVER_PLACEHOLDER } from "$lib/constants";
  import { getNovelStatus } from "$lib/novel";
    import NovelCatTags from "./NovelCatTags.svelte";

  export let novel;
</script>

<a
  href={`/novel/${novel.id}`}
  class="group bg-white rounded overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
>
  <div class="relative">
    <img
      src={novel.cover_url || COVER_PLACEHOLDER}
      alt={novel.title}
      class="w-full object-cover group-hover:scale-105 transition duration-300"
    />
    <div class="absolute top-4 right-4">
      <span class="{novel.status === 'ongoing' ? 'bg-orange-500' : 'bg-green-500'} text-white px-4 py-1 rounded-full text-sm">
        {getNovelStatus(novel)}
      </span>
    </div>
  </div>
  <div class="p-4 space-y-2">
    <h3 class="text-2xl font-medium text-gray-900">{novel.title}</h3>
    <p class="text-gray-600 line-clamp-2">{novel.description}</p>
    <div class="flex flex-wrap gap-2">
      {#if novel.is_short }
      <NovelCatTags catTags={[{name:'短篇'}]} type='cat' />
      {/if}
      <NovelCatTags catTags={[novel.categories]} type='cat' />
      <NovelCatTags catTags={novel.tags} />
    </div>
    <div class="flex items-center justify-between">
      <!-- <span class="text-sm text-gray-500">{novel.author || "佚名"}</span> -->
      <span
        class="text-red-600 group-hover:translate-x-2 transition-transform duration-300"
      >
        阅读更多 →
      </span>
    </div>
  </div>
</a>
