 <script lang="ts">
   import { supabase } from '$lib/supabaseClient';
   import { user } from '$lib/stores/authStore';
   import { onMount } from 'svelte';
   import { WEBSITE_NAME } from '$lib/constants';
    import type { Novel } from '$lib/novel';
    import UserProfile from '$lib/components/user/UserProfile.svelte';
    import UserShelfNovels from '$lib/components/user/UserShelfNovels.svelte';
    import NovelCard from '$lib/components/novels/NovelCard.svelte';

   let activeTab = 'profile';
   let readNovels: Novel[] = [];

   onMount(async () => {
     if ($user) {
       // Fetch read novels
       const { data: read } = await supabase
         .from('bookshelves')
         .select(`
           *,
           novels (
             id,
             title,
             cover_url,
             description,
             categories!inner (
              id,name
             ),
             novel_tags (
              tags!inner (
                id,
                name
              )
            )
           )
         `)
         .eq('user_id', $user.id);

       if (read) {
         readNovels = read.map(item => item.novels);
       }
     }
   });

  

 </script>

 <svelte:head>
   <title>个人中心 - {WEBSITE_NAME}</title>
 </svelte:head>

 <div class="min-h-screen  py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
   <div class="max-w-7xl mx-auto">
     <div class="text-center mb-12">
       <h1 class=" text-5xl text-primary mb-4">个人中心</h1>
       <p class="text-lg text-red-700">管理您的账户和阅读记录</p>
     </div>

     <div class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-400 shadow-xl">
       <div class="border-b border-gray-400">
         <nav class="flex -mb-px" aria-label="Tabs">
           {#each [
             { id: 'profile', name: '个人资料' },
             { id: 'shelf', name: '书架' },
             //{ id: 'read', name: '已读' }
           ] as tab}
             <button
               class="w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm cursor-pointer
                 {activeTab === tab.id
                   ? 'border-red-800'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
               on:click={() => activeTab = tab.id}
             >
               {tab.name}
             </button>
           {/each}
         </nav>
       </div>

       {#if activeTab === 'profile'}
         <UserProfile />
       {:else if activeTab === 'shelf'}
         <UserShelfNovels />
       {:else if activeTab === 'read'}
         <div class="p-6">
           <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {#each readNovels as novel}
               <NovelCard novel={novel} />
             {/each}
           </div>
         </div>
       {/if}
     </div>
   </div>
 </div>