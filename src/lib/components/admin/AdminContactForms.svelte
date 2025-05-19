<script lang="ts">
  import { getContactForms } from "$lib/supabaseClient";
  import { onMount } from "svelte";
  import { slide } from 'svelte/transition';

  let forms: any[] = [];
  let expandedFormId: string | null = null;

  onMount(async () => {
    const { data, error } = await getContactForms();
    if (error) console.error(error);
    forms = data || [];
  });

  function truncateText(text: string, length: number = 50) {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function toggleFormDetail(formId: string) {
    if (expandedFormId === formId) {
      expandedFormId = null; // 收起当前展开的行
    } else {
      expandedFormId = formId; // 展开新的行
    }
  }
</script>

<div class="p-6">
  <table class="min-w-full divide-y divide-red-100">
    <thead>
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮件</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-red-100">
      {#each forms as form (form.id)}
        <tr 
          class="hover:bg-gray-50 cursor-pointer transition-colors {expandedFormId === form.id ? 'bg-gray-50' : ''}"
          on:click={() => toggleFormDetail(form.id)}
          on:keydown={(e) => e.key === 'Enter' && toggleFormDetail(form.id)}
          tabindex="0"
          role="button"
          aria-expanded={expandedFormId === form.id}
        >
          <td class="px-6 py-4 text-sm text-gray-900">{form.title}</td>
          <td class="px-6 py-4 text-sm text-gray-900">{form.email}</td>
          <td class="px-6 py-4 text-sm text-gray-500">{truncateText(form.content)}</td>
          <td class="px-6 py-4 text-right text-sm font-medium">
            {formatDate(form.created_at)}
            <span class="ml-2 text-gray-400">
              {#if expandedFormId === form.id}
                <svg class="inline-block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              {:else}
                <svg class="inline-block w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              {/if}
            </span>
          </td>
        </tr>
        
        {#if expandedFormId === form.id}
          <tr class="bg-gray-50">
            <td colspan="4" class="px-6 py-4">
              <div class="border-l-4 border-red-400 pl-4" transition:slide={{ duration: 300 }}>
                <div class="space-y-6">
                  {#if form.user_name}
                    <div>
                      <h4 class="text-sm font-medium text-gray-500">发送者</h4>
                      <div class="mt-2 flex items-center">
                        <span class="text-base text-gray-900">{form.user_name}</span>
                        <span class="mx-2 text-gray-400">•</span>
                        <span class="text-base text-gray-900">{form.email}</span>
                      </div>
                    </div>
                  {/if}
                  
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">内容</h4>
                    <div class="mt-2 bg-white rounded-md p-4 border border-gray-200 shadow-sm">
                      <p class="text-base text-gray-900 whitespace-pre-wrap">{form.content}</p>
                    </div>
                  </div>
                  
                  <div class="flex justify-end">
                    <button 
                      class="text-sm text-gray-500 hover:text-red-500 transition-colors"
                      on:click|stopPropagation={() => toggleFormDetail(form.id)}
                    >
                      收起详情
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

<style>
  tr[role="button"]:focus {
    outline: 2px solid #ef4444;
    outline-offset: -2px;
  }
  
  /* 确保表格布局正确 */
  table {
    border-collapse: collapse;
    width: 100%;
  }
</style>