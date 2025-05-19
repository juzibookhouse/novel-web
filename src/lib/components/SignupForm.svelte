<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Btn from './common/Btn.svelte';
  
  export let role = '';
  
  let email = '';
  let password = '';
  let username = '';
  let loading = false;
  let error: string | null = null;
  
  async function handleSignup() {
    try {
      loading = true;
      error = null;
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) throw signupError;
      const userId = data?.user?.id;

      if (userId) {
        const {data:userProfile, error:userProfileError} = await supabase
        .from('user_profiles')
        .insert({
          user_name: username,
          role,
          user_id: userId
        });

        if (userProfileError) throw userProfileError
      }

      // Redirect to email confirmation page if signup is successful
      if (userId) {
        goto('/email-confirmation');
      }
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-primary mb-2">
        {WEBSITE_NAME}
      </h2>
      <p class="text-lg text-red-700">
        {role === 'author' ? '作家注册' : '读者注册'}
      </p>
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
    
    <form class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-lg border-2 border-red-100 shadow-xl" on:submit|preventDefault={handleSignup}>
      <div class="space-y-4">
        <div>
          <label for="user_name" class="block text-sm font-medium text-gray-700">呢称</label>
          <input
            id="user_name"
            name="user_name"
            type="text"
            required
            bind:value={username}
            class="mt-1 block w-full rounded-md border-red-200 border-2 py-2 px-3 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500 sm:text-sm transition duration-200"
            placeholder="请输入名字"
          />
        </div>
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
            autocomplete="new-password"
            required
            bind:value={password}
            minlength="6"
            class="mt-1 block w-full rounded-md border-2 py-2 px-3"
            placeholder="请输入密码（至少6位）"
          />
        </div>
      </div>
  
      <div>
        <Btn title={loading ? '注册中...' : '立即注册'} disabled={loading} type="submit" />
      </div>
      
      <div class="text-sm text-center mt-6 pt-4 border-t border-red-100">
        <a href="/user/login" class="font-medium text-red-600 hover:text-red-500 transition duration-200">
          已有账户？立即登录
        </a>
      </div>
    </form>
  </div>
</div>