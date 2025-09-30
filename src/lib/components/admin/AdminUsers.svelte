<script lang="ts">
  import { supabase } from "$lib/supabaseClient";
  import {
    getUserDateFormat,
    getUserMembershipDate,
    getUserMembership,
  } from "$lib/user";
  import { onMount } from "svelte";
  let users: any[] = [];

  onMount(() => {
    fetchUsers();
  });

  async function fetchUsers() {
    try {
      // Load users from user_profiles
      const { data: usersData, error: usersError } = await supabase
        .from("user_profiles")
        .select(
          `
          id,
          user_id,
          role,
          created_at,
          user_name,
          ip,
          email,
          user_memberships (
            id,
            status,
            plan_id,
            end_date
          )
        `,
        )
        // .gte("user_memberships.end_date", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;
      users = usersData;
    } catch (error) {}
  }
</script>

<div class="p-6">
  <h3 class="text-2xl font-bold mb-4">用户数: {users.length}</h3>
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
              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
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
        </tr>
      {/each}
    </tbody>
  </table>
</div>