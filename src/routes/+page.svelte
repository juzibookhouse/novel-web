<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let featuredNovels: any[] = [];
  let loading = true;

  onMount(async () => {
    const { data } = await supabase
      .from('novels')
      .select('*')
      .limit(6)
      .order('created_at', { ascending: false });
    
    featuredNovels = data || [];
    loading = false;
  });

  const categories = [
    { name: '武侠', icon: '⚔️', desc: '侠之大者，为国为民' },
    { name: '仙侠', icon: '🌌', desc: '飞天遁地，逍遥自在' },
    { name: '历史', icon: '📜', desc: '秦皇汉武，气吞万里' },
    { name: '玄幻', icon: '🐉', desc: '神通广大，法力无边' }
  ];
</script>

<svelte:head>
  <title>墨香书院 - 汇聚华夏文学精粹</title>
</svelte:head>

<div class="bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <!-- Hero Section -->
  <section class="relative py-20 px-4 sm:px-6 lg:px-8 bg-red-800 text-white overflow-hidden">
    <div class="absolute inset-0 bg-red-900/30"></div>
    <div class="relative max-w-7xl mx-auto text-center">
      <h1 class="font-['Ma_Shan_Zheng'] text-6xl mb-6">墨香书院</h1>
      <p class="text-xl text-yellow-100 mb-8">汇聚华夏文学精粹，传承千年文化瑰宝</p>
      <div class="flex justify-center space-x-4">
        <a
          href="/novels"
          class="bg-yellow-100 text-red-800 px-8 py-3 rounded-full hover:bg-yellow-200 transition duration-200"
        >
          浏览书库
        </a>
        <a
          href="/author/signup"
          class="border-2 border-yellow-100 text-yellow-100 px-8 py-3 rounded-full hover:bg-red-700 transition duration-200"
        >
          成为作家
        </a>
      </div>
    </div>
  </section>

  <!-- Categories Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 text-center mb-12">精选分类</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {#each categories as category}
          <a
            href={`/novels?category=${category.name}`}
            class="group bg-white/80 backdrop-blur-sm rounded-lg p-6 text-center border-2 border-red-100 hover:border-red-300 transition duration-200"
          >
            <span class="text-4xl mb-4 block">{category.icon}</span>
            <h3 class="text-xl font-medium text-gray-900 mb-2">{category.name}</h3>
            <p class="text-gray-600">{category.desc}</p>
          </a>
        {/each}
      </div>
    </section>

    <!-- Featured Novels Section -->
    <section class="py-16 px-4 sm:px-6 lg:px-8 bg-red-50/50">
      <div class="max-w-7xl mx-auto">
        <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 text-center mb-12">精品推荐</h2>
        {#if loading}
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each featuredNovels as novel}
              <a
                href={`/novel/${novel.id}`}
                class="group bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden border-2 border-red-100 hover:border-red-300 transition duration-200"
              >
                <div class="aspect-w-3 aspect-h-2">
                  <img
                    src={novel.cover_url || 'https://via.placeholder.com/400x300?text=封面未上传'}
                    alt={novel.title}
                    class="object-cover w-full h-48 group-hover:scale-105 transition duration-200"
                  />
                </div>
                <div class="p-6">
                  <h3 class="text-xl font-medium text-gray-900 mb-2">{novel.title}</h3>
                  <p class="text-gray-600 line-clamp-2">{novel.description}</p>
                  <div class="mt-4 flex items-center justify-between">
                    <span class="text-sm text-gray-500">{novel.author}</span>
                    <span class="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {novel.category}
                    </span>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </section>
</div>