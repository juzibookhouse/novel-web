<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { WEBSITE_NAME } from '$lib/constants';
  import { goto } from '$app/navigation';
  
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let error: string | null = null;

  async function handleUpdatePassword() {
    try {
      if (password !== confirmPassword) {
        error = '两次输入的密码不一致';
        return;
      }

      loading = true;
      error = null;
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      // Redirect to login page
      goto('/user/login');
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>更新密码 - {WEBSITE_NAME}</title>
</svelte:head>

<div class="min-h-screen bg-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-primary mb-2">
        {WEBSITE_NAME}
      </h2>
      <p class="text-lg text-red-700">设置新密码</p>
    </div>

    {#if error}
      <div class="rounded-md bg-red-50 border-2 border-red-200 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-primary">{error}</h3>
          </div>
        </div>
      </div>
    {/if}

    <form class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-lg border-2 border-gray-400 shadow-xl" on:submit|preventDefault={handleUpdatePassword}>
      <div class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">新密码</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
            minlength="6"
            class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
            placeholder="请输入新密码（至少6位）"
          />
        </div>

        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700">确认密码</label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            bind:value={confirmPassword}
            minlength="6"
            class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
            placeholder="请再次输入新密码"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          class="group relative flex w-full justify-center rounded-md bg-[#FEF9D5] py-2.5 px-3 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 transition duration-200"
          disabled={loading}
        >
          {loading ? '更新中...' : '更新密码'}
        </button>
      </div>
    </form>
  </div>
</div>