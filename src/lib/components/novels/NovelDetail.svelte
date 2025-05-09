<script>
    import { COVER_PLACEHOLDER } from "$lib/constants";
    import { getNovelStatus, getNovelWordCount } from "$lib/novel";
    import NovelCatTags from "./NovelCatTags.svelte";
    export let novel;

</script>
<!-- Novel Header -->
<div class="p-8 border-b-2 border-red-100">
  <div class="flex gap-8">
    <div class="w-1/3">
      <img
        src={novel.cover_url || COVER_PLACEHOLDER}
        alt={novel.title}
        class="w-full h-auto rounded-lg shadow-lg"
      />
    </div>
    <div class="w-2/3">
      <h1 class="font-['Ma_Shan_Zheng'] text-4xl text-primary mb-4">
        {novel.title}
      </h1>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <NovelCatTags catTags={[{name:getNovelStatus(novel)}]} type={novel.status} />
          <NovelCatTags catTags={[novel.categories]} type="cat" />
          <NovelCatTags catTags={novel.tags} />
        </div>
        
        <div class="flex items-center">
          <span class="text-gray-600">作者：</span>
          <span class="ml-2 text-gray-900">{novel.author?.user_name || '佚名'}</span>
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
      </div>
    </div>
  </div>
</div>
