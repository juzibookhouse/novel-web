<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { goto } from '$app/navigation';
    import NovelCard from '$lib/components/novels/NovelCard.svelte';
  
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
          <label for="category" class="block text-sm font-medium text-gray-700 mb-2">类别</label>
          <div class="relative">
            <select
              id="category"
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
          <label for="status" class="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <div class="relative">
            <select
              id="status"
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
    <div class="grid grid-cols-4 gap-6 mb-8">
      {#each data.novels as novel}
        <NovelCard novel={novel} />
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