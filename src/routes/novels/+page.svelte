<script lang="ts">
  import { goto } from '$app/navigation';
  
  export let data;
  
  let searchTerm = data.search || '';
  let selectedCategory = data.selectedCategory || '';
  
  function handleSearch() {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    params.set('page', '1');
    goto(`/novels?${params.toString()}`);
  }
  
  function handleCategoryChange() {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    params.set('page', '1');
    goto(`/novels?${params.toString()}`);
  }
  
  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    params.set('page', page.toString());
    goto(`/novels?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>墨香书院 - 书库</title>
  <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="font-['Ma_Shan_Zheng'] text-5xl text-red-800 mb-4">墨香书库</h1>
      <p class="text-lg text-red-700">千卷书中自有黄金屋</p>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white/80 backdrop-blur-sm p-6 rounded-lg border-2 border-red-100 shadow-lg mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="relative">
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="搜索书名..."
            class="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-red-500"
            on:keydown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div class="relative">
          <select
            bind:value={selectedCategory}
            on:change={handleCategoryChange}
            class="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-red-500 bg-white"
          >
            <option value="">全部类别</option>
            {#each data.categories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Novel Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {#each data.novels as novel}
        <div class="bg-white/90 rounded-lg overflow-hidden shadow-lg border border-red-100 hover:shadow-xl transition-shadow duration-300">
          <div class="aspect-w-3 aspect-h-4 bg-red-100">
            <img
              src={novel.cover_url || 'https://via.placeholder.com/300x400?text=封面未上传'}
              alt={novel.title}
              class="object-cover w-full h-48"
            />
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                {novel.category || '未分类'}
              </span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-1">{novel.title}</h3>
            <p class="text-sm text-gray-600 mb-2">作者：{novel.author || '佚名'}</p>
            <p class="text-sm text-gray-500 line-clamp-2">{novel.description || '暂无简介'}</p>
          </div>
          <div class="px-4 py-3 bg-red-50 border-t border-red-100">
            <a
              href={`/novel/${novel.id}`}
              class="text-red-700 hover:text-red-800 text-sm font-medium"
            >
              开始阅读 →
            </a>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if data.totalPages > 1}
      <div class="flex justify-center space-x-2">
        {#each Array(data.totalPages) as _, i}
          <button
            class="px-4 py-2 rounded-md {data.currentPage === i + 1
              ? 'bg-red-800 text-white'
              : 'bg-white text-red-800 hover:bg-red-100'} 
              border-2 border-red-200 transition-colors duration-200"
            on:click={() => goToPage(i + 1)}
          >
            {i + 1}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background-color: #FEF2F2;
  }
</style>