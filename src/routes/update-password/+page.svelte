<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { WEBSITE_NAME } from '$lib/constants';
  import Btn from '$lib/components/common/Btn.svelte';
  import InputField from '$lib/components/common/InputField.svelte';
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

<div class="min-h-screen  flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class=" text-4xl text-primary mb-2">
        {WEBSITE_NAME}
      </h2>
      <p class="text-lg text-red-700">设置新密码</p>
    </div>

    {#if error}
      <div class="rounded-md  border-2 border-red-200 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-primary">{error}</h3>
          </div>
        </div>
      </div>
    {/if}

    <form class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded border-2 border-gray-400 shadow" on:submit|preventDefault={handleUpdatePassword}>
      <div class="space-y-4">
        <InputField field="password" label="新密码" type="password" placeholder="请输入新密码（至少6位）" bind:value={password} required minlength={6} />
        <InputField field="confirmPassword" label="确认新密码" type="password" placeholder="请再次输入新密码" bind:value={confirmPassword} required minlength={6} />
      </div>

      <div>
        <Btn title={loading ? '更新中...' : '更新密码'} disabled={loading} type="submit" />
      </div>
    </form>
  </div>
</div>