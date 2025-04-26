<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import MembershipPlans from '$lib/components/MembershipPlans.svelte';
  import { user } from '$lib/stores/authStore';

  let email = '';
  let password = '';
  let loading = false;
  let error: string | null = null;
  let showMembership = false;

  async function handleLogin() {
    try {
      loading = true;
      error = null;
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) throw loginError;

      if ($user?.profile?.role == 'author') {
        goto('/author/dashboard');
      } else {
        if (!$user.profile.is_approved) {
          showMembership = true;
        } else {
          // Redirect to dashboard
          goto('/');
        }
      }
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function handleMembershipClose() {
    showMembership = false;
    goto('/');
  }
</script>

<svelte:head>
  <title>登录 - {WEBSITE_NAME}</title>
</svelte:head>

{#if showMembership}
  <MembershipPlans onClose={handleMembershipClose} />
{/if}

<div class="min-h-screen bg-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 mb-2">
        {WEBSITE_NAME}
      </h2>
      <p class="text-lg text-red-700">登录您的账户</p>
    </div>
    
    {#if error}
      <div class="rounded-md bg-red-50 border-2 border-red-200 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    {/if}
    
    <form class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-lg border-2 border-red-100 shadow-xl" on:submit|preventDefault={handleLogin}>
      <div class="space-y-4">
        <div>
          <label for="email-address" class="block text-sm font-medium text-gray-700">电子邮箱</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
            placeholder="请输入邮箱地址"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={password}
            class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
            placeholder="请输入密码"
          />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-sm">
          <a href="/reset-password" class="font-medium text-red-600 hover:text-red-500 transition duration-200">
            忘记密码？
          </a>
        </div>
      </div>

      <div>
        <button
          type="submit"
          class="group relative flex w-full justify-center rounded-md bg-red-800 py-2.5 px-3 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 transition duration-200"
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </div>
      
      <div class="text-sm text-center mt-6 pt-4 border-t border-red-100">
        <a href="/user/signup" class="font-medium text-red-600 hover:text-red-500 transition duration-200">
          还没有账户？立即注册
        </a>
      </div>
    </form>
  </div>
</div>

<style>
  :global(body) {
    background-color: #FEF2F2;
  }
</style>