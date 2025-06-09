<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import SignupForm from '$lib/components/SignupForm.svelte';
  import { page } from '$app/stores';
  
  // 从 page store 获取用户会话状态
  $: isLoggedIn = !!$page.data.session;
</script>

<svelte:head>
  <title>作家注册 - {WEBSITE_NAME}</title>
</svelte:head>

<SignupForm role="author" {isLoggedIn} />