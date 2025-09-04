<script lang="ts">
  import { WEBSITE_NAME, WEBSITE_URL } from "$lib/constants";
  import { user } from "$lib/stores/authStore";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import { page } from '$app/stores';

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

<nav class="text-[var(--text-color)] shadow-lg fixed w-full top-0 z-50 bg-[var(--bg-color)] backdrop-blur-sm bg-opacity-95 border-b border-gray-200">
  <div class="container mx-auto px-4 py-3">
    <div class="flex items-center justify-between">
      <a
        href="/"
        class=" text-3xl flex items-center flex-col text-[var(--primary-color)] hover:text-[var(--accent-color)] transition-colors duration-300"
      >
        <!-- <img src="/logo.jpg" alt={WEBSITE_NAME} class="w-10 h-10 rounded-full object-cover shadow-md hover:shadow-lg transition-all duration-300" />
        <span class="hover-lift">{WEBSITE_NAME}</span> -->
        <span class="font-jianhao text-3xl font-bold text-[var(--primary-color)]">{WEBSITE_NAME}</span>
        <span class="text-sm">{WEBSITE_URL}</span>
      </a>

      <div class="flex space-x-6 items-center">
        {#each menuItems as item}
          {#if item.href === "/user/signup" && !$user}
            <a
              href={item.href}
              class="btn-primary"
            >
              {item.label}
            </a>
          {:else if item.href === "/user/login" && !$user}
            <a
              href={item.href}
              class="btn-secondary"
            >
              {item.label}
            </a>
          {:else}
            <a 
              href={item.href} 
              class="relative px-2 py-1 transition-all duration-300 hover:text-[var(--primary-color)] {$page.url.pathname === item.href ? 'text-[var(--primary-color)] font-medium' : ''}"
            >
              <span>{item.label}</span>
              <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary-color)] transition-all duration-300 {$page.url.pathname === item.href ? 'w-full' : 'group-hover:w-full'}"></span>
            </a>
          {/if}
        {/each}

        {#if $user}
          <button 
            on:click={handleLogout}
            class="btn-secondary"
          >
            登出
          </button>
        {/if}
      </div>
      
      <!-- 移动端菜单按钮 -->
      <!-- <button class="md:hidden flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button> -->
    </div>
  </div>
</nav>