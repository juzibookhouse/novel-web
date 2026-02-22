<script lang="ts">
  import { supabase } from "$lib/supabaseClient";
  import { WEBSITE_NAME } from '$lib/constants';
  import Btn from "$lib/components/common/Btn.svelte";
  import InputField from "$lib/components/common/InputField.svelte";

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
  class="min-h-screen  flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"
>
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class=" text-4xl text-primary mb-2">
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
        <div class="rounded-md  border-2 border-red-200 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-primary">{error}</h3>
            </div>
          </div>
        </div>
      {/if}

      <form
        class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded border-2 border-gray-400 shadow"
        on:submit|preventDefault={handleResetPassword}
      >
        <InputField field="email" label="电子邮箱" type="email" placeholder="请输入注册时使用的邮箱地址" bind:value={email} required />

        <Btn type="submit" disabled={loading} title={loading ? "发送中..." : "发送重置链接"} />

        <div class="text-sm text-center pt-4 border-t border-gray-400">
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
