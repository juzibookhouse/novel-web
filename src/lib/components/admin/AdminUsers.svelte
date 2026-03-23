<script lang="ts">
  import { sendRequest } from "$lib/api";
  import { supabase } from "$lib/supabaseClient";
  import {
    getUserDateFormat,
    getUserMembershipDate,
    getUserMembership,
  } from "$lib/user";
  import { onMount } from "svelte";

  let users: any[] = [];
  let currentPage = 1;
  const perPage = 20;
  let pagination: any = {
    page: 1,
    per_page: perPage,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  // Modal state
  let showEditModal = false;
  let editingUser: any = null;
  let editingMembership: any = null;
  let status = '';
  let endDate = '';

  onMount(() => {
    fetchUsers();
  });

  async function fetchUsers(page = currentPage) {
    try {
      // Load users from user_profiles
      const {data, error} = await sendRequest(`/api/admin/users?page=${page}&per_page=${perPage}`, {
        method: "GET",
      });
      if (data.users) {
        users = data.users;
        pagination = data.pagination;
        currentPage = page;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchUsers(page);
    }
  }

  function openEditModal(user: any) {
    editingUser = user;
    editingMembership = user.user_memberships && user.user_memberships.length > 0
      ? user.user_memberships[0]
      : null;

    if (editingMembership) {
      status = editingMembership.status;
      endDate = editingMembership.end_date ? editingMembership.end_date.split('T')[0] : '';
    } else {
      status = '';
      endDate = '';
    }
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    editingUser = null;
    editingMembership = null;
    status = '';
    endDate = '';
  }

  async function saveMembership() {
    try {
      if (!editingMembership) {
        alert('该用户没有会员记录');
        return;
      }

      const { data, error } = await sendRequest('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({
          membershipId: editingMembership.id,
          status: status || undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined
        })
      });

      if (error) {
        alert('更新失败: ' + error);
      } else {
        alert('更新成功');
        closeEditModal();
        fetchUsers(currentPage);
      }
    } catch (error) {
      console.error('Error saving membership:', error);
      alert('更新失败');
    }
  }
</script>

<div class="p-6">
  <div class="flex justify-between items-center mb-4">
    <h3 class="text-2xl font-bold">用户总数: {pagination.total}</h3>
    <span class="text-sm text-gray-500">第 {pagination.page} / {pagination.totalPages} 页</span>
  </div>

  <table class="min-w-full divide-y divide-red-100">
    <thead>
      <tr>
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >用户名</th
        >
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >IP地址</th
        >
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >电子邮箱</th
        >
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >注册时间</th
        >
        <th
          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >状态</th
        >
        <th
          class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
          >会员日期</th
        >
      </tr>
    </thead>
    <tbody class="divide-y divide-red-100">
      {#each users as user}
        <tr>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >{user.user_name}</td
          >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {#if user.ip}
              <a
                href={`https://whatismyipaddress.com/ip/${user.ip}`}
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
                title="点击查看IP位置信息"
              >
                {user.ip}
              </a>
            {:else}
              未记录
            {/if}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
            >{user.email || '未记录'}</td
          >
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {getUserDateFormat(user.created_at)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              class="py-0.5 px-1 inline-flex text-xs leading-5 rounded
              {getUserMembership(user) !== '会员'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-primary'}"
            >
              {getUserMembership(user)}
            </span>
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
          >
            {getUserMembershipDate(user)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            {#if user.user_memberships && user.user_memberships.length > 0}
              <button
                class="text-primary hover:text-indigo-900"
                on:click={() => openEditModal(user)}
              >
                编辑
              </button>
            {:else}
              <span class="text-gray-400">无会员</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  <!-- Edit Modal -->
  {#if showEditModal && editingUser}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">编辑会员信息</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={editingUser.user_name}
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          {#if editingMembership}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                bind:value={status}
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">请选择状态</option>
                <option value="active">VIP</option>
                <option value="pending">非VIP</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">到期日期</label>
              <input
                type="date"
                bind:value={endDate}
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          {:else}
            <p class="text-gray-500 text-sm">该用户没有会员记录</p>
          {/if}

          <div class="flex justify-end space-x-3 pt-4">
            <button
              on:click={closeEditModal}
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            {#if editingMembership}
              <button
                on:click={saveMembership}
                class="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700"
              >
                保存
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Pagination Controls -->
  {#if pagination.totalPages > 1}
    <div class="mt-4 flex justify-center items-center space-x-2">
      <button
        class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium
               {pagination.hasPreviousPage
                 ? 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                 : 'text-gray-400 cursor-not-allowed'}"
        disabled={!pagination.hasPreviousPage}
        on:click={() => goToPage(currentPage - 1)}
      >
        上一页
      </button>

      <div class="flex space-x-1">
        {#each Array(pagination.totalPages) as _, i}
          <button
            class="px-3 py-2 rounded-lg text-sm font-medium
                   {pagination.page === i + 1
                     ? 'bg-primary text-white'
                     : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'}"
            on:click={() => goToPage(i + 1)}
          >
            {i + 1}
          </button>
        {/each}
      </div>

      <button
        class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium
               {pagination.hasNextPage
                 ? 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                 : 'text-gray-400 cursor-not-allowed'}"
        disabled={!pagination.hasNextPage}
        on:click={() => goToPage(currentPage + 1)}
      >
        下一页
      </button>
    </div>
  {/if}
</div>
