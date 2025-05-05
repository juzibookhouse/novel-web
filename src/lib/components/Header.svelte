<script lang="ts">
  import { WEBSITE_NAME } from "$lib/constants";
  import { user, getUserSession } from "$lib/stores/authStore";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    getUserSession()
  })

  async function handleLogout() {
    await supabase.auth.signOut();
    goto("/");
  }
</script>

<nav class="text-primary shadow-lg fixed w-full top-0 z-50 bg-red-50">
  <div class="container mx-auto px-4 py-3">
    <div class="flex items-center justify-between">
      <a
        href="/"
        class="font-['Ma_Shan_Zheng'] text-3xl flex items-center gap-2"
      >
        <img src="/logo.jpg" alt={WEBSITE_NAME} class="w-10 h-10 rounded-full object-cover" />
        <span>{WEBSITE_NAME}</span>
      </a>

      <div class="flex space-x-6 items-center">
        <a href="/novels" class="hover:underline"
          >书库</a
        >
        <a href="/contact" class="hover:underline"
          >联系我们</a
        >

        {#if $user}
          {#if $user?.profile?.role === "admin"}
            <a href="/admin" class="hover:underline"
              >管理员面板</a
            >
          {/if}
          {#if $user?.profile?.role === "author"}
            <a
              href="/author/dashboard"
              class="hover:underline">作家专区</a
            >
          {:else}
            <a
              href="/author/signup"
              class="hover:underline">注册成为作家</a
            >
          {/if}
          <a href="/user/dashboard" class="hover:underline"
            >个人中心</a
          >
          <button
            on:click={handleLogout}
            class="px-4 py-2 rounded-full transition-colors cursor-pointer"
          >
            退出
          </button>
        {:else}
          <div class="space-x-4">
            <a
              href="/user/login"
              class="hover:underline">登录</a
            >
            <a
              href="/user/signup"
              class="px-4 py-2 rounded-full transition-colors"
            >
              注册
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>