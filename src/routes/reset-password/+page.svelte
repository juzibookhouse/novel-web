<script lang="ts">
  import { supabase } from "$lib/supabaseClient";
  import { WEBSITE_NAME } from '$lib/constants';

  let email = "";
  let loading = false;
  let error: string | null = null;
  let success = false;

  async function handleResetPassword() {
    try {
      loading = true;
      error = null;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

      if (resetError) throw resetError;

      success = true;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>重置密码 - {WEBSITE_NAME}</title>
</svelte:head>

<div
  class="min-h-screen bg-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"
>
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-primary mb-2">
        {WEBSITE_NAME}
      </h2>
      <p class="text-lg text-red-700">重置您的密码</p>
    </div>

    {#if success}
      <div
        class="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center"
      >
        <h3 class="text-xl font-medium text-green-800 mb-2">
          重置链接已发送！
        </h3>
        <p class="text-green-700">请检查您的邮箱，按照邮件中的说明重置密码。</p>
      </div>
    {:else}
      {#if error}
        <div class="rounded-md bg-red-50 border-2 border-red-200 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-primary">{error}</h3>
            </div>
          </div>
        </div>
      {/if}

      <form
        class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-lg border-2 border-red-100 shadow-xl"
        on:submit|preventDefault={handleResetPassword}
      >
        <div>
          <label
            for="email-address"
            class="block text-sm font-medium text-gray-700">电子邮箱</label
          >
          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
            placeholder="请输入注册时使用的邮箱地址"
          />
        </div>

        <div>
          <button
            type="submit"
            class="group relative flex w-full justify-center rounded-md bg-[#FEF9D5] py-2.5 px-3 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 transition duration-200"
            disabled={loading}
          >
            {loading ? "发送中..." : "发送重置链接"}
          </button>
        </div>

        <div class="text-sm text-center mt-6 pt-4 border-t border-red-100">
          <a
            href="/user/login"
            class="font-medium text-red-600 hover:text-red-500 transition duration-200"
          >
            返回登录
          </a>
        </div>
      </form>
    {/if}
  </div>
</div>
