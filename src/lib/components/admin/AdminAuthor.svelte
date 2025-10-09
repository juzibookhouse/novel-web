<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAdminAuthors, supabase } from '$lib/supabaseClient';
  import { getUserDateFormat } from "$lib/user";
    import { formatDuration } from '$lib/novel';

  let authors:any[] = [];

  onMount(()=> {
    fetchAuthors();
  });

 async function fetchAuthors() {
  try {
    const {data,error:authorsError} = await fetchAdminAuthors();
    if (authorsError) throw authorsError;
    authors = data;
  } catch (error) {
    
  }
 }


 async function toggleApproval(userId: string, currentStatus: boolean) {
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', userId);

      if (updateError) throw updateError;
      fetchAuthors();
    } catch (e: any) {
        // error = e.message;
    }
  }

  const TITLES = ['作家名','电子邮箱','注册时间','状态','作品阅读时间','操作'];
  let selectedAuthor: any = null;

</script>
<div class="p-6">
  {#if selectedAuthor}
    <div class="mb-6 p-4 bg-white rounded-lg shadow">
      <h3 class="text-lg font-medium mb-4">作家详情</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-500">笔名</p>
          <p class="text-gray-900">{selectedAuthor.published_pen_name || '未设置'}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">网站</p>
          <p class="text-gray-900">
            {#if selectedAuthor.published_website}
              <a href={selectedAuthor.published_website} target="_blank" class="text-primary hover:underline">
                {selectedAuthor.published_website}
              </a>
            {:else}
              未设置
            {/if}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500">已发布作品</p>
          <p class="text-gray-900">{selectedAuthor.published_work_title || '未设置'}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">计划创作</p>
          <p class="text-gray-900">{selectedAuthor.planned_work_description || '未设置'}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">草稿文件</p>
          <p class="text-gray-900">
            {#if selectedAuthor.draft_file_path}
              <a href={selectedAuthor.draft_file_path} target="_blank" download class="text-primary hover:underline flex items-center">
                <span>下载草稿文件</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            {:else}
              未上传
            {/if}
          </p>
        </div>
      </div>
      <button 
        on:click={() => selectedAuthor = null}
        class="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
      >
        返回列表
      </button>
    </div>
  {:else}
    <table class="min-w-full divide-y divide-red-100">
    <thead>
      <tr>
        {#each TITLES as title }
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-red-100">
      {#each authors as author}
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <button 
              on:click={() => selectedAuthor = author}
              class="cursor-pointer flex items-center"
            >
              <span class:font-bold={author.published_pen_name || author.published_website || author.published_work_title || author.draft_file_path}>
                {author.user_name}
              </span>
              {#if author.published_pen_name || author.published_website || author.published_work_title || author.draft_file_path}
                <span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  有发布的作品
                </span>
              {/if}
            </button>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {author.email || '未记录'}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {getUserDateFormat(author.created_at)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                {author.is_approved
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-primary'}"
            >
              {author.is_approved ? "已审核" : "未审核"}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 rounded-full">
              {formatDuration(author.novelReadingTime)}
            </span>
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            <button
              on:click={() => toggleApproval(author.id, author.is_approved)}
              class="text-red-600 hover:text-primary cursor-pointer"
            >
              {author.is_approved ? "取消审核" : "通过审核"}
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  {/if}
</div>