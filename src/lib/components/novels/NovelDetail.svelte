<script>
    import { COVER_PLACEHOLDER } from "$lib/constants";
    import { getNovelStatus, getNovelWordCount } from "$lib/novel";
    import FavNovel from "./FavNovel.svelte";
    import NovelCatTags from "./NovelCatTags.svelte";
    import ReceivedGifts from "./ReceivedGifts.svelte";
    export let novel;

</script>
<!-- Novel Header -->
<div class="p-8 border-b-2 border-gray-400">
  <div class="flex gap-8">
    <div class="w-1/3">
      <img
        src={novel.cover_url || COVER_PLACEHOLDER}
        alt={novel.title}
        class="w-full h-auto rounded-lg shadow-lg"
      />
    </div>
    <div class="w-2/3 space-y-2">
      <h1 class=" text-4xl text-primary">
        {novel.title}
      </h1>
        <div class="flex items-center gap-2">
          <NovelCatTags catTags={[{name:getNovelStatus(novel)}]} type={novel.status} />
          {#if novel.is_short }
          <NovelCatTags catTags={[{name:'短篇'}]} type='cat' />
          {/if}
          <NovelCatTags catTags={[novel.categories]} type="cat" />
          <NovelCatTags catTags={novel.tags} />
        </div>
        
        <div class="flex items-center">
          <span class="text-gray-600">作者：</span>
          <span class="ml-2 text-gray-900">{novel.pen_name || novel.author?.user_name || '佚名'}</span>
        </div>
        
        <div class="flex items-center">
          <span class="text-gray-600">字数：</span>
          <span class="ml-2 text-gray-900">{getNovelWordCount(novel)}</span>
        </div>

        <div>
          <span class="text-gray-600">简介：</span>
          <p class="mt-2 text-gray-800 leading-relaxed">
            {novel.description || "暂无简介"}
          </p>
        </div>

        <FavNovel novelId={novel.id} />

        {#if novel.gifts && novel.gifts.length}
        <ReceivedGifts chapterGifts={novel.gifts} />
        {/if}

    </div>
  </div>
</div>