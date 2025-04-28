 <script lang="ts">
   import { supabase } from '$lib/supabaseClient';
   import { user } from '$lib/stores/authStore';
   import { onMount } from 'svelte';
   import { WEBSITE_NAME } from '$lib/constants';
   import MembershipPlans from '$lib/components/MembershipPlans.svelte';

   let activeTab = 'profile';
   let firstName = '';
   let lastName = '';
   let loading = false;
   let message = '';
   let shelfNovels: any[] = [];
   let readNovels: any[] = [];
   let membershipPlan: any = null;
   let showMembershipModal = false;

   onMount(async () => {
     if ($user) {
       // Fetch user profile
       const { data: profile } = await supabase
         .from('user_profiles')
         .select('first_name, last_name')
         .eq('user_id', $user.id)
         .single();

       if (profile) {
         firstName = profile.first_name || '';
         lastName = profile.last_name || '';
       }

       // Fetch membership plan details if user has active membership
       if ($user.membership?.plan_id) {
         const { data: plan } = await supabase
           .from('membership_plans')
           .select('*')
           .eq('id', $user.membership.plan_id)
           .single();

         membershipPlan = plan;
       }

       // Fetch bookshelf novels
       const { data: shelf } = await supabase
         .from('bookshelves')
         .select(`
           *,
           novels (
             id,
             title,
             cover_url
           )
         `)
         .eq('user_id', $user.id);

       if (shelf) {
         shelfNovels = shelf.map(item => item.novels);
       }

       // Fetch read novels
       const { data: read } = await supabase
         .from('bookshelves')
         .select(`
           *,
           novels (
             id,
             title,
             cover_url
           )
         `)
         .eq('user_id', $user.id);

       if (read) {
         readNovels = read.map(item => item.novels);
       }
     }
   });

   async function updateProfile() {
     try {
       loading = true;
       const { error } = await supabase
         .from('user_profiles')
         .update({
           first_name: firstName,
           last_name: lastName
         })
         .eq('user_id', $user?.id);

       if (error) throw error;
       message = '个人资料已更新';
     } catch (error) {
       message = '更新失败，请重试';
     } finally {
       loading = false;
     }
   }

   function formatDate(dateString: string) {
     return new Date(dateString).toLocaleDateString('zh-CN');
   }
 </script>

 <svelte:head>
   <title>个人中心 - {WEBSITE_NAME}</title>
 </svelte:head>

 {#if showMembershipModal}
   <MembershipPlans onClose={() => showMembershipModal = false} />
 {/if}

 <div class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
   <div class="max-w-7xl mx-auto">
     <div class="text-center mb-12">
       <h1 class="font-['Ma_Shan_Zheng'] text-5xl text-red-800 mb-4">个人中心</h1>
       <p class="text-lg text-red-700">管理您的账户和阅读记录</p>
     </div>

     <div class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl">
       <div class="border-b border-red-100">
         <nav class="flex -mb-px" aria-label="Tabs">
           {#each [
             { id: 'profile', name: '个人资料' },
             { id: 'shelf', name: '书架' },
             //{ id: 'read', name: '已读' }
           ] as tab}
             <button
               class="w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
                 {activeTab === tab.id
                   ? 'border-red-800 text-red-800'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
               on:click={() => activeTab = tab.id}
             >
               {tab.name}
             </button>
           {/each}
         </nav>
       </div>

       {#if activeTab === 'profile'}
         <div class="p-6">
           <!-- Membership Card -->
           <div class="mb-8">
             <h2 class="text-xl font-medium text-gray-900 mb-4">会员状态</h2>
             {#if $user?.membership}
               <div class="bg-gradient-to-r from-red-800 to-red-600 rounded-lg p-6 text-white">
                 <div class="flex justify-between items-start mb-4">
                   <div>
                     <h3 class="text-2xl font-semibold">{membershipPlan?.name || '会员'}</h3>
                     <p class="text-red-100">会员编号: {$user.membership.id}</p>
                   </div>
                   <div class="text-right">
                     <p class="text-xl font-bold">¥{membershipPlan?.price || 0}/月</p>
                     <p class="text-red-100">
                       到期时间: {formatDate($user.membership.end_date)}
                     </p>
                   </div>
                 </div>
                 <div class="flex justify-between items-center">
                   <p class="text-red-100">状态: {$user.membership.status === 'active' ? '有效' : '待续费'}</p>
                   <button
                     on:click={() => showMembershipModal = true}
                     class="bg-white text-red-800 px-4 py-2 rounded-full text-sm hover:bg-red-50 transition-colors"
                   >
                     续费会员
                   </button>
                 </div>
               </div>
             {:else}
               <div class="bg-gray-50 rounded-lg p-6 text-center">
                 <p class="text-gray-600 mb-4">您还不是会员</p>
                 <button
                   on:click={() => showMembershipModal = true}
                   class="bg-red-800 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
                 >
                   立即开通
                 </button>
               </div>
             {/if}
           </div>

           <!-- Profile Form -->
           <div class="max-w-lg">
             <h2 class="text-xl font-medium text-gray-900 mb-4">基本信息</h2>
             <div class="space-y-4">
               {#if message}
                 <div class="bg-green-50 p-4 rounded-md text-green-700">
                   {message}
                 </div>
               {/if}
               <div>
                 <label for="firstName" class="block text-sm font-medium text-gray-700">名</label>
                 <input
                   type="text"
                   id="firstName"
                   bind:value={firstName}
                   class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500"
                 />
               </div>
               <div>
                 <label for="lastName" class="block text-sm font-medium text-gray-700">姓</label>
                 <input
                   type="text"
                   id="lastName"
                   bind:value={lastName}
                   class="mt-1 block w-full rounded-md border-2 border-red-200 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500"
                 />
               </div>
               <button
                 on:click={updateProfile}
                 disabled={loading}
                 class="bg-red-800 text-white px-6 py-2 rounded-full hover:bg-red-700 disabled:bg-red-300 transition-colors"
               >
                 {loading ? '更新中...' : '更新资料'}
               </button>
             </div>
           </div>
         </div>
       {:else if activeTab === 'shelf'}
         <div class="p-6">
           <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {#each shelfNovels as novel}
               <a href="/novel/{novel.id}" class="block">
                 <div class="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                   <img
                     src={novel.cover_url || 'https://via.placeholder.com/150'}
                     alt={novel.title}
                     class="w-full h-48 object-cover rounded-md mb-2"
                   />
                   <h3 class="text-gray-900 font-medium">{novel.title}</h3>
                 </div>
               </a>
             {/each}
           </div>
         </div>
       {:else if activeTab === 'read'}
         <div class="p-6">
           <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {#each readNovels as novel}
               <a href="/novel/{novel.id}" class="block">
                 <div class="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                   <img
                     src={novel.cover_url || 'https://via.placeholder.com/150'}
                     alt={novel.title}
                     class="w-full h-48 object-cover rounded-md mb-2"
                   />
                   <h3 class="text-gray-900 font-medium">{novel.title}</h3>
                 </div>
               </a>
             {/each}
           </div>
         </div>
       {/if}
     </div>
   </div>
 </div>

 <style>
   :global(body) {
     background-color: #FEF2F2;
   }
 </style>