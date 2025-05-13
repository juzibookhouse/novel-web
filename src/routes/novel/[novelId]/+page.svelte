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
  class="min-h-screen bg-red-50 py-8 px-4 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"
>
  <div
    class="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl overflow-hidden"
  >
    <NovelDetail {novel} />

    <ChapterList {novel} />
  </div>
</div>
