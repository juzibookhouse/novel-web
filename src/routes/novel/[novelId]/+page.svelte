<script lang="ts">
  import ChapterList from "$lib/components/novels/ChapterList.svelte";
  import NovelDetail from "$lib/components/novels/NovelDetail.svelte";
  import { WEBSITE_NAME } from "$lib/constants";
  export let data;
  const { novel } = data;
</script>

<svelte:head>
  <title>{novel.title} - {WEBSITE_NAME}</title>
</svelte:head>

<div
  class="min-h-screen py-8 px-4"
>
  <div
    class="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden"
  >
    {#if !novel.is_published}
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <p class="font-medium">编辑状态</p>
        <p>这部小说目前正在编辑中，尚未发布。</p>
      </div>
    {:else}
    <NovelDetail {novel} />

    <ChapterList {novel} />
    {/if}
  </div>
</div>