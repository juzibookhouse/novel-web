<script lang="ts">
    import About from "$lib/components/home/About.svelte";
  import Categories from "$lib/components/home/Categories.svelte";
  import FeatureNovel from "$lib/components/home/FeatureNovel.svelte";
  import Hero from "$lib/components/home/Hero.svelte";
  import Novels from "$lib/components/home/Novels.svelte";
  import { WEBSITE_NAME } from "$lib/constants";
  export let data;
  const { ongoingNovels, finishedNovels, quotationChapters, categories, shortNovels } = data;
</script>

<svelte:head>
  <title>{WEBSITE_NAME} - 原创小说会员网站</title>
</svelte:head>

  <Hero />

  {#if quotationChapters && quotationChapters?.length > 0}
  <FeatureNovel {quotationChapters} />
  {/if}

  <!-- <Categories categories={categories} /> -->

  <Novels
    novels={ongoingNovels}
    title={"连载作品"}
    url={"/novels?status=ongoing"}
    bg={"/50"}
  />

  <Novels
    novels={finishedNovels}
    title={"完结作品"}
    url={"/novels?status=finished"}
    bg={"bg-white/80"}
  />

  <Novels
    novels={shortNovels}
    title={"精品短篇"}
    url={"/novels?is_short=1"}
    bg={"bg-white/80"}
  />

  <About />
