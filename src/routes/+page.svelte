<script lang="ts">
    import About from "$lib/components/home/About.svelte";
  import Categories from "$lib/components/home/Categories.svelte";
  import FeatureNovel from "$lib/components/home/FeatureNovel.svelte";
  import Hero from "$lib/components/home/Hero.svelte";
  import Novels from "$lib/components/home/Novels.svelte";
  import { WEBSITE_NAME } from "$lib/constants";
  export let data;
  const { ongoingNovels, finishedNovels, quotationChapters, categories } = data;
</script>

<svelte:head>
  <title>{WEBSITE_NAME} - 汇聚华夏文学精粹</title>
</svelte:head>

<div
  class="bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"
>
  <Hero />

  <FeatureNovel {quotationChapters} />

  <!-- <Categories categories={categories} /> -->

  <Novels
    novels={ongoingNovels}
    title={"连载作品"}
    status={"ongoing"}
    bg={"bg-red-50/50"}
  />

  <Novels
    novels={finishedNovels}
    title={"完结作品"}
    status={"finished"}
    bg={"bg-white/80"}
  />

  <About />
</div>
