<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import Btn from './common/Btn.svelte';
  import InputField from './common/InputField.svelte';
  import { getUserIp } from '$lib/helpers';
  import ErrorMessage from './common/ErrorMessage.svelte';
  import AuthorSignupForm from './AuthorSignupForm.svelte';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  
  export let role = '';
  export let isLoggedIn = false;
  
  let email = '';
  let password = '';
  let username = '';
  let loading = false;
  let error: null = null;

  onMount(()=>{
    if ($user) {
      isLoggedIn = true;
    }
  });
  
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
        try {
          // 获取用户IP地址
          const userIp = await getUserIp();

          const userProfileData = {
            user_name: username,
            email,
            role,
            user_id: userId,
            ip: userIp
          };

          const {data:userProfile, error:userProfileError} = await supabase
          .from('user_profiles')
          .insert(userProfileData);

          if (userProfileError) throw userProfileError;
        } catch (ipError) {
          console.error("获取IP地址失败:", ipError.message);
          // 即使获取IP失败，也继续创建用户资料
          const {data:userProfile, error:userProfileError} = await supabase
          .from('user_profiles')
          .insert({
            user_name: username,
            email,
            role,
            user_id: userId
          });

          if (userProfileError) throw userProfileError;
        }
      }

      // Redirect to email confirmation page if signup is successful
      if (userId) {
        goto('/email-confirmation');
      }
    } catch (e: any) {
      error = e;
    } finally {
      loading = false;
    }
  }
</script>

{#if role === 'author' || isLoggedIn}
  <AuthorSignupForm {isLoggedIn} />
{:else if !isLoggedIn}
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="text-4xl text-primary mb-2">
          {WEBSITE_NAME}
        </h2>
        <p class="text-lg text-red-700">
          读者注册
        </p>
      </div>
      
      {#if error}
        <ErrorMessage error={error} />
      {/if}
      
      <form class="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-lg border-2 border-gray-400 shadow-xl" on:submit|preventDefault={handleSignup}>
        <div class="space-y-4">
          <div class="prose text-gray-700 mb-4">
            <h3 class="text-lg font-medium">欢迎加入我们</h3>
            <p class="text-sm">
              这里是一个小众的文学社区，我们希望能够为您提供一个安静的阅读环境。
            </p>
          </div>

          <InputField field="user_name" label="呢称" type="text" placeholder="请输入名字" bind:value={username} required />
          <InputField field="email" label="电子邮箱" type="email" placeholder="请输入邮箱地址" bind:value={email} required />
          <InputField field="password" label="密码" type="password" placeholder="请输入密码（至少6位）" bind:value={password} required minlength={6} />
        </div>

        <div>
          <Btn title={loading ? '注册中...' : '立即注册'} disabled={loading} type="submit" />
        </div>
        
        <div class="text-sm text-center mt-6 pt-4 border-t border-gray-400">
          <a href="/user/login" class="font-medium text-red-600 hover:text-red-500 transition duration-200">
            已有账户？立即登录
          </a>
        </div>
      </form>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center bg-white/80 backdrop-blur-sm p-8 rounded-lg border-2 border-gray-400 shadow-xl">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          您已登录
        </h2>
        <p class="text-gray-600 mb-4">
          您已经是注册用户，无需再次注册。
        </p>
      </div>
    </div>
  </div>
{/if}