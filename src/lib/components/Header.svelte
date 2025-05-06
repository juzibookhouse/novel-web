<script lang="ts">
  import { WEBSITE_NAME } from "$lib/constants";
  import { user, getUserSession } from "$lib/stores/authStore";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    getUserSession()
  })

  const commonMenuItems = [
    { href: "/novels", label: "书库" },
    { href: "/contact", label: "联系我们" }
  ];

  const adminMenuItems = [
    ...commonMenuItems,
    { href: "/admin", label: "管理员面板" },
    { href: "/author/dashboard", label: "作家专区" },
    { href: "/user/dashboard", label: "个人中心" }
  ];

  const authorMenuItems = [
    ...commonMenuItems,
    { href: "/author/dashboard", label: "作家专区" },
    { href: "/user/dashboard", label: "个人中心" }
  ];

  const readerMenuItems = [
    ...commonMenuItems,
    { href: "/author/signup", label: "注册成为作家" },
    { href: "/user/dashboard", label: "个人中心" }
  ];

  const guestMenuItems = [
    ...commonMenuItems,
    { href: "/user/login", label: "登录" },
    { href: "/user/signup", label: "注册" }
  ];

  $: menuItems = $user 
    ? $user?.profile?.role === "admin" 
      ? adminMenuItems
      : $user?.profile?.role === "author"
        ? authorMenuItems
        : readerMenuItems
    : guestMenuItems;

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
        {#each menuItems as item}
          {#if item.href === "/user/signup" && !$user}
            <a
              href={item.href}
              class="px-4 py-2 rounded-full transition-colors"
            >
              {item.label}
            </a>
          {:else}
            <a href={item.href} class="transition">
              {item.label}
            </a>
          {/if}
        {/each}

        {#if $user}
          <button
            on:click={handleLogout}
            class="px-4 py-2 rounded-full transition-colors cursor-pointer"
          >
            退出
          </button>
        {/if}
      </div>
    </div>
  </div>
</nav>