<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { goto } from '$app/navigation';
  
  export let data;
  
  let searchTerm = data.search || '';
  let selectedCategory = data.selectedCategory || '';
  let selectedStatus = data.selectedStatus || '';
  
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'ongoing', label: '连载中' },
    { value: 'finished', label: '已完结' }
  ];
  
  function handleSearch() {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    params.set('page', '1');
    goto(`/novels?${params.toString()}`);
  }
  
  function handleCategoryChange() {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    params.set('page', '1');
    goto(`/novels?${params.toString()}`);
  }

  function handleStatusChange() {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    params.set('page', '1');
    goto(`/novels?${params.toString()}`);
  }
  
  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    params.set('page', page.toString());
    goto(`/novels?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>{WEBSITE_NAME} - 书库</title>
</svelte:head>

<div class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="font-['Ma_Shan_Zheng'] text-5xl text-primary mb-4">墨香书库</h1>
      <p class="text-lg text-red-700">千卷书中自有黄金屋</p>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg mb-8 overflow-hidden">
      <div class="p-6 border-b border-red-100">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500">🔍</span>
          </div>
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="搜索书名..."
            class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-red-500 transition-all duration-200"
            on:keydown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>
      
      <div class="p-6 bg-gray-50 flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-2">类别</label>
          <div class="relative">
            <select
              bind:value={selectedCategory}
              on:change={handleCategoryChange}
              class="w-full pl-4 pr-10 py-2.5 bg-white rounded-lg border-2 border-red-100 focus:border-red-500 focus:ring-red-500 appearance-none transition-all duration-200"
            >
              <option value="">全部类别</option>
              {#each data.categories as category}
                <option value={category.name}>{category.name}</option>
              {/each}
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              ▼
            </div>
          </div>
        </div>
        
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <div class="relative">
            <select
              bind:value={selectedStatus}
              on:change={handleStatusChange}
              class="w-full pl-4 pr-10 py-2.5 bg-white rounded-lg border-2 border-red-100 focus:border-red-500 focus:ring-red-500 appearance-none transition-all duration-200"
            >
              {#each statusOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              ▼
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Novel Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {#each data.novels as novel}
        <div class="bg-white/90 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div class="aspect-w-3 aspect-h-4 bg-red-100 relative overflow-hidden">
            <img
              src={novel.cover_url || 'https://via.placeholder.com/300x400?text=封面未上传'}
              alt={novel.title}
              class="object-cover w-full h-48 group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div class="p-4">
            <div class="flex items-center gap-2 mb-3">
              {#each novel.categories as category}
              <span class="bg-red-50 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {category.name}
              </span>
              {/each}
              <span class="text-sm {novel.status === 'ongoing' ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'} px-3 py-1 rounded-full font-medium">
                {novel.status === 'ongoing' ? '连载中' : '已完结'}
              </span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{novel.title}</h3>
            <p class="text-sm text-gray-600 mb-2">作者：{novel.author || '佚名'}</p>
            <p class="text-sm text-gray-500 line-clamp-2 mb-4">{novel.description || '暂无简介'}</p>
            <a
              href={`/novel/${novel.id}`}
              class="inline-flex items-center text-red-700 hover:text-primary text-sm font-medium group-hover:translate-x-1 transition-transform duration-200"
            >
              开始阅读 →
            </a>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if data.totalPages > 1}
      <div class="flex justify-center gap-2">
        {#each Array(data.totalPages) as _, i}
          <button
            class="px-4 py-2 rounded-lg {data.currentPage === i + 1
              ? 'bg-[#FEF9D5] text-white shadow-md'
              : 'bg-white text-primary hover:bg-red-50'} 
              border-2 border-red-100 transition-all duration-200 hover:shadow-md"
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