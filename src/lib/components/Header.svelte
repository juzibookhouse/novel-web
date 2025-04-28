<script lang="ts">
  import { WEBSITE_NAME } from "$lib/constants";
  import { user } from "$lib/stores/authStore";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";

  async function handleLogout() {
    await supabase.auth.signOut();
    goto("/");
  }
</script>

<nav class="bg-red-800 text-yellow-50 shadow-lg sticky top-0 z-50">
  <div class="container mx-auto px-4 py-3">
    <div class="flex items-center justify-between">
      <h1
        class="font-['Ma_Shan_Zheng'] text-3xl hover:text-yellow-200 transition-colors"
      >
        <a href="/">{WEBSITE_NAME}</a>
      </h1>

      <div class="flex space-x-6 items-center">
        <a href="/novels" class="hover:text-yellow-200 transition-colors"
          >书库</a
        >
        <a href="/contact" class="hover:text-yellow-200 transition-colors"
          >联系我们</a
        >

        {#if $user}
          {#if $user?.profile?.role === "admin"}
            <a href="/admin" class="hover:text-yellow-200 transition-colors"
              >管理员面板</a
            >
          {/if}
          {#if $user?.profile?.role === "author"}
            <a
              href="/author/dashboard"
              class="hover:text-yellow-200 transition-colors">作家专区</a
            >
          {:else}
            <a
              href="/author/signup"
              class="hover:text-yellow-200 transition-colors">注册成为作家</a
            >
          {/if}
          <a href="/user/dashboard" class="hover:text-yellow-200 transition-colors"
            >个人中心</a
          >
          <button
            on:click={handleLogout}
            class="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-full transition-colors cursor-pointer"
          >
            退出
          </button>
        {:else}
          <div class="space-x-4">
            <a
              href="/user/login"
              class="hover:text-yellow-200 transition-colors">登录</a
            >
            <a
              href="/user/signup"
              class="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-full transition-colors"
            >
              注册
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>
