<script lang="ts">
  import Categories from "$lib/components/home/Categories.svelte";
  import FeatureNovel from "$lib/components/home/FeatureNovel.svelte";
  import Hero from "$lib/components/home/Hero.svelte";
  import Novels from "$lib/components/home/Novels.svelte";
  import { WEBSITE_NAME } from "$lib/constants";
  export let data;
  const { ongoingNovels, finishedNovels, randomNovel } = data;
</script>

<svelte:head>
  <title>{WEBSITE_NAME} - 汇聚华夏文学精粹</title>
</svelte:head>

<div
  class="bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"
>
  <Hero />

  <FeatureNovel {randomNovel} />

  <Categories />

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

  <!-- About Section -->
  <section class="py-24 px-4 bg-primary">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="font-['Ma_Shan_Zheng'] text-5xl text-primary mb-8">
            关于{WEBSITE_NAME}
          </h2>
          <div class="prose prose-lg mx-auto">
            <p class="text-gray-600 mb-6">
              {WEBSITE_NAME}成立于2025年，是一个专注于中文网络文学创作与阅读的综合性平台。我们致力于为读者提供优质的阅读体验，为作者打造理想的创作平台。
            </p>
            <p class="text-gray-600 mb-6">
              在这里，您可以找到各类精品小说，从武侠仙侠到都市言情，应有尽有。我们重视原创内容，尊重知识产权，为作者提供合理的收益分成。
            </p>
            <p class="text-gray-600">
              加入{WEBSITE_NAME}，与我们一起传承中华文化，共创网络文学的美好未来。
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  :global(body) {
    background-color: #fef2f2;
  }
</style>
