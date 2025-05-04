<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { getNovelStatus } from '$lib/novel';
  import { getUserDateFormat, getUserMembershipDate, isValidMembership } from '$lib/user';

  let activeTab: 'users' | 'authors' | 'novels' | 'categories' = 'users';
  let users: any[] = [];
  let authors: any[] = [];
  let novels: any[] = [];
  let categories: any[] = [];
  let loading = true;
  let error: string | null = null;

  // New category form
  let newCategoryName = '';
  let addingCategory = false;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
      try {
          loading = true;
          error = null;

          // Load users from user_profiles
          const { data: usersData, error: usersError } = await supabase
              .from('user_profiles')
              .select(`
                id,
                user_id,
                role,
                created_at,
                first_name,
                last_name,
                user_memberships (
                  id,
                  status,
                  plan_id,
                  end_date
                )
              `)
              .gte('user_memberships.end_date', new Date().toISOString())
              .eq('user_memberships.status', 'active');

          if (usersError) throw usersError;
          users = usersData;

          // Load authors from user_profiles
          const { data: authorsData, error: authorsError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('role', 'author');

          if (authorsError) throw authorsError;
          authors = authorsData;

          // Load novels
          const { data: novelsData, error: novelsError } = await supabase
              .from('novels')
              .select(`
                id,
                title,
                status,
                created_at
              `);

          if (novelsError) throw novelsError;
          novels = novelsData;

          // Load categories
          const { data: categoriesData, error: categoriesError } = await supabase
              .from('categories')
              .select('*')
              .order('name');

          if (categoriesError) throw categoriesError;
          categories = categoriesData;

      } catch (e: any) {
          error = e.message;
      } finally {
          loading = false;
      }
  }

  async function toggleApproval(userId: string, currentStatus: boolean) {
      try {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ is_approved: !currentStatus })
            .eq('id', userId);

          if (updateError) throw updateError;
          await loadData();
      } catch (e: any) {
          error = e.message;
      }
  }

  async function addCategory() {
    try {
      if (!newCategoryName.trim()) return;
      
      addingCategory = true;
      const { error: categoryError } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }]);

      if (categoryError) throw categoryError;
      
      newCategoryName = '';
      await loadData();
    } catch (e: any) {
      error = e.message;
    } finally {
      addingCategory = false;
    }
  }

  async function deleteCategory(categoryId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;
      await loadData();
    } catch (e: any) {
      error = e.message;
    }
  }
</script>

<svelte:head>
  <title>管理后台 - {WEBSITE_NAME}</title>
</svelte:head>

  
<div class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="font-['Ma_Shan_Zheng'] text-5xl text-primary mb-4">管理后台</h1>
      <p class="text-lg text-red-700">运筹帷幄，决胜千里</p>
    </div>
  
    {#if error}
      <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
        <p class="text-sm text-primary">{error}</p>
      </div>
    {/if}
  
    <!-- Tabs -->
    <div class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl mb-8">
      <div class="border-b border-red-100">
        <nav class="flex -mb-px" aria-label="Tabs">
          {#each [
            { id: 'users', name: '读者管理' },
            { id: 'authors', name: '作家管理' },
            { id: 'novels', name: '作品管理' },
            { id: 'categories', name: '分类管理' }
          ] as tab}
            <button
              class="w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm
                {activeTab === tab.id
                  ? 'border-red-800 underline'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              on:click={() => activeTab = tab.id as any}
            >
              {tab.name}
            </button>
          {/each}
        </nav>
      </div>
    </div>
  
    <!-- Content -->
    <div class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl">
      {#if loading}
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
        </div>
      {:else}
        <!-- Users Tab -->
        {#if activeTab === 'users'}
          <div class="p-6">
            <table class="min-w-full divide-y divide-red-100">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">会员日期</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-red-100">
                {#each users as user}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.first_name} {user.last_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.user_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUserDateFormat(user.created_at)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {isValidMembership(user) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-primary'}">
                        {isValidMembership(user) ? '会员' : '非会员'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {getUserMembershipDate(user)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
  
        <!-- Authors Tab -->
        {#if activeTab === 'authors'}
          <div class="p-6">
            <table class="min-w-full divide-y divide-red-100">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作家名</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-red-100">
                {#each authors as author}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{author.first_name} {author.last_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{author.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUserDateFormat(author.created_at)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        {author.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-primary'}">
                        {author.is_approved ? '已审核' : '未审核'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        on:click={() => toggleApproval(author.id, author.is_approved)}
                        class="text-red-600 hover:text-primary"
                      >
                        {author.is_approved ? '取消审核' : '通过审核'}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
  
        <!-- Novels Tab -->
        {#if activeTab === 'novels'}
          <div class="p-6">
            <table class="min-w-full divide-y divide-red-100">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作品名</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-red-100">
                {#each novels as novel}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{novel.title}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getNovelStatus(novel)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUserDateFormat(novel.created_at)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/novel/${novel.id}`}
                        class="text-red-600 hover:text-primary"
                      >
                        查看详情
                      </a>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

        <!-- Categories Tab -->
        {#if activeTab === 'categories'}
          <div class="p-6">
            <div class="mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">添加新分类</h3>
              <div class="flex gap-4">
                <input
                  type="text"
                  bind:value={newCategoryName}
                  placeholder="输入分类名称"
                  class="flex-1 rounded-md border-2 border-red-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                />
                <button
                  on:click={addCategory}
                  disabled={addingCategory || !newCategoryName.trim()}
                  class="px-6 py-2 rounded-md disabled:opacity-50"
                >
                  {addingCategory ? '添加中...' : '添加'}
                </button>
              </div>
            </div>

            <table class="min-w-full divide-y divide-red-100">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类名称</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-red-100">
                {#each categories as category}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        on:click={() => deleteCategory(category.id)}
                        class="text-red-600 hover:text-primary"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
  
<style>
  :global(body) {
    background-color: #FEF2F2;
  }
</style>