<script lang="ts">
  import { WEBSITE_NAME } from "$lib/constants";
  import { onMount } from "svelte";
  import { getAdminNovels, supabase } from "$lib/supabaseClient";
  import AdminNovels from "$lib/components/admin/AdminNovels.svelte";
  import AdminCategories from "$lib/components/admin/AdminCategories.svelte";
  import AdminUsers from "$lib/components/admin/AdminUsers.svelte";
  import AdminAuthor from "$lib/components/admin/AdminAuthor.svelte";
  import AdminTags from "$lib/components/admin/AdminTags.svelte";
  import AdminContactForms from "$lib/components/admin/AdminContactForms.svelte";
  import AdminReadingTime from "$lib/components/admin/AdminReadingTime.svelte";
  import { user } from "$lib/stores/authStore";
  import { goto } from "$app/navigation";

  let activeTab:
      | "users"
      | "authors"
      | "novels"
      | "categories"
      | "tags"
      | "forms"
      | "reading-time" = "users";

  let novels: any[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    if (!($user?.role === "admin")) {
      return goto("/user/login");
    }
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = null;

      const {data:novelsData, error: novelsError} = await getAdminNovels();

      if (novelsError) throw novelsError;
      novels = novelsData;
      
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>管理后台 - {WEBSITE_NAME}</title>
</svelte:head>

<div
  class="min-h-screen  py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"
>
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-12">
      <h1 class=" text-5xl text-primary mb-4">
        管理后台
      </h1>
      <p class="text-lg text-red-700">运筹帷幄，决胜千里</p>
    </div>

    {#if error}
      <div class=" border-2 border-red-200 rounded-lg p-4 mb-6">
        <p class="text-sm text-primary">{error}</p>
      </div>
    {/if}

    <!-- Tabs -->
    <div
      class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-400 shadow-xl mb-8"
    >
      <div class="border-b border-gray-400">
        <nav class="flex -mb-px" aria-label="Tabs">
          {#each [{ id: "users", name: "读者管理" }, { id: "authors", name: "作家管理" }, { id: "novels", name: "作品管理" }, { id: "categories", name: "分类管理" }, { id: "tags", name: "标签管理" }, { id: "forms", name: "表单管理" }, { id: "reading-time", name: "阅读时间" }] as tab}
            <button
              class="w-1/4 py-4 px-1 cursor-pointer text-center border-b-2 font-medium text-sm
                {activeTab === tab.id
                ? 'border-red-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
              on:click={() => (activeTab = tab.id as any)}
            >
              {tab.name}
            </button>
          {/each}
        </nav>
      </div>
    </div>

    <!-- Content -->
    <div
      class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-400 shadow-xl"
    >
      {#if loading}
        <div class="flex justify-center py-12">
          <div
            class="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"
          ></div>
        </div>
      {:else}
        <!-- Users Tab -->
        {#if activeTab === "users"}
          <AdminUsers />
        {/if}

        <!-- Authors Tab -->
        {#if activeTab === "authors"}
          <AdminAuthor />
        {/if}

        <!-- Novels Tab -->
        {#if activeTab === "novels"}
          <AdminNovels {novels} />
        {/if}

        <!-- Categories Tab -->
        {#if activeTab === "categories"}
          <AdminCategories />
        {/if}

        <!-- Tags Tab -->
        {#if activeTab === "tags"}
          <AdminTags />
        {/if}

        {#if activeTab === "forms"}
          <AdminContactForms />
        {/if}

        {#if activeTab === "reading-time"}
          <AdminReadingTime />
        {/if}
      {/if}
    </div>
  </div>
</div>