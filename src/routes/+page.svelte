<script lang="ts">
   import { WEBSITE_NAME } from '$lib/constants';
   export let data;
   const { ongoingNovels, finishedNovels, randomNovel } = data;

   const categories = [
     { name: '武侠', icon: '⚔️', desc: '侠之大者，为国为民', color: 'bg-blue-50' },
     { name: '仙侠', icon: '🌌', desc: '飞天遁地，逍遥自在', color: 'bg-purple-50' },
     { name: '历史', icon: '📜', desc: '秦皇汉武，气吞万里', color: 'bg-yellow-50' },
     { name: '玄幻', icon: '🐉', desc: '神通广大，法力无边', color: 'bg-green-50' }
   ];
</script>

<svelte:head>
   <title>{WEBSITE_NAME} - 汇聚华夏文学精粹</title>
</svelte:head>

<div class="bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
   <!-- Hero Section -->
   <section class="relative min-h-screen flex items-center justify-center py-32 px-4 bg-[#FEF9D5]">
     <div class="absolute inset-0 bg-gradient-to-b from-red-900/30 to-transparent"></div>
     <div class="relative max-w-7xl mx-auto text-center">
       <div class="flex flex-col items-center justify-center space-y-8">
         <div class="flex items-center justify-center gap-4">
           <img src="/logo.jpg" alt={WEBSITE_NAME} class="w-24 h-24 rounded-full object-cover shadow-xl" />
           <h1 class="font-['Ma_Shan_Zheng'] text-7xl text-white">{WEBSITE_NAME}</h1>
         </div>
         <p class="text-2xl text-yellow-100 max-w-2xl mx-auto">汇聚华夏文学精粹，传承千年文化瑰宝</p>
         <div class="flex gap-6 mt-8">
           <a
             href="/novels"
             class="bg-yellow-100 text-primary px-12 py-4 rounded-full text-lg hover:bg-yellow-200 transition duration-300 shadow-lg hover:shadow-xl"
           >
             浏览书库
           </a>
           <a
             href="/author/signup"
             class="border-2 border-yellow-100 text-yellow-100 px-12 py-4 rounded-full text-lg hover:bg-red-700/30 transition duration-300"
           >
             成为作家
           </a>
         </div>
       </div>
     </div>
   </section>

   <!-- Featured Novel Section -->
   <section class="relative py-24 bg-primary overflow-hidden">
     <div class="max-w-7xl mx-auto px-4">
       <div class="relative z-10 flex items-center gap-12">
         <div class="w-1/2">
           <img
             src={randomNovel.cover_url || 'https://via.placeholder.com/600x800'}
             alt={randomNovel.title}
             class="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
           />
         </div>
         <div class="w-1/2 text-left">
           <h2 class="text-4xl font-bold text-primary mb-6">{randomNovel.title}</h2>
           <p class="text-xl italic text-gray-800 mb-8">"{randomNovel.description}"</p>
           <a 
             href="/novel/{randomNovel.id}"
             class="inline-block bg-red-800 text-white px-8 py-3 rounded-full hover:bg-red-700 transition duration-300"
           >
             开始阅读
           </a>
         </div>
       </div>
     </div>
   </section>

   <!-- Categories Section -->
   <section class="py-24 px-4 bg-white/80">
     <div class="max-w-7xl mx-auto">
       <h2 class="font-['Ma_Shan_Zheng'] text-5xl text-primary text-center mb-16">精选分类</h2>
       <div class="grid grid-cols-4 gap-8">
         {#each categories as category}
           <a
             href={`/novels?category=${category.name}`}
             class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
           >
             <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             <div class="relative p-8 text-center">
               <span class="text-6xl mb-6 block transform group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
               <h3 class="text-3xl font-medium text-white mb-2">{category.name}</h3>
               <p class="text-white/80">{category.desc}</p>
             </div>
           </a>
         {/each}
       </div>
     </div>
   </section>

   <!-- Ongoing Novels Section -->
   <section class="py-24 px-4 bg-red-50/50">
     <div class="max-w-7xl mx-auto">
       <h2 class="font-['Ma_Shan_Zheng'] text-5xl text-primary text-center mb-16">连载作品</h2>
       <div class="grid grid-cols-3 gap-8">
         {#each ongoingNovels as novel}
           <a
             href={`/novel/${novel.id}`}
             class="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
           >
             <div class="relative">
               <img
                 src={novel.cover_url || 'https://via.placeholder.com/400x300?text=封面未上传'}
                 alt={novel.title}
                 class="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
               />
               <div class="absolute top-4 right-4">
                 <span class="bg-green-500 text-white px-4 py-1 rounded-full text-sm">
                   连载中
                 </span>
               </div>
             </div>
             <div class="p-6">
               <h3 class="text-2xl font-medium text-gray-900 mb-2">{novel.title}</h3>
               <p class="text-gray-600 line-clamp-2 mb-4">{novel.description}</p>
               <div class="flex items-center justify-between">
                 <span class="text-sm text-gray-500">{novel.author || '佚名'}</span>
                 <span class="text-red-600 group-hover:translate-x-2 transition-transform duration-300">
                   阅读更多 →
                 </span>
               </div>
             </div>
           </a>
         {/each}
       </div>
     </div>
   </section>

   <!-- Finished Novels Section -->
   <section class="py-24 px-4 bg-white/80">
     <div class="max-w-7xl mx-auto">
       <h2 class="font-['Ma_Shan_Zheng'] text-5xl text-primary text-center mb-16">完结作品</h2>
       <div class="grid grid-cols-3 gap-8">
         {#each finishedNovels as novel}
           <a
             href={`/novel/${novel.id}`}
             class="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
           >
             <div class="relative">
               <img
                 src={novel.cover_url || 'https://via.placeholder.com/400x300?text=封面未上传'}
                 alt={novel.title}
                 class="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
               />
               <div class="absolute top-4 right-4">
                 <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                   已完结
                 </span>
               </div>
             </div>
             <div class="p-6">
               <h3 class="text-2xl font-medium text-gray-900 mb-2">{novel.title}</h3>
               <p class="text-gray-600 line-clamp-2 mb-4">{novel.description}</p>
               <div class="flex items-center justify-between">
                 <span class="text-sm text-gray-500">{novel.author || '佚名'}</span>
                 <span class="text-red-600 group-hover:translate-x-2 transition-transform duration-300">
                   阅读更多 →
                 </span>
               </div>
             </div>
           </a>
         {/each}
       </div>
     </div>
   </section>

   <!-- About Section -->
   <section class="py-24 px-4 bg-primary">
     <div class="max-w-7xl mx-auto">
       <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl">
         <div class="max-w-3xl mx-auto text-center">
           <h2 class="font-['Ma_Shan_Zheng'] text-5xl text-primary mb-8">关于{WEBSITE_NAME}</h2>
           <div class="prose prose-lg mx-auto">
             <p class="text-gray-600 mb-6">
               {WEBSITE_NAME}成立于2025年，是一个专注于中文网络文学创作与阅读的综合性平台。我们致力于为读者提供优质的阅读体验，为作者打造理想的创作平台。
             </p>
             <p class="text-gray-600 mb-6">
               在这里，您可以找到各类精品小说，从武侠仙侠到都市言情，应有尽有。我们重视原创内容，尊重知识产权，为作者提供合理的收益分成。
             </p>
             <p class="text-gray-600">
               加入{WEBSITE_NAME}，与我们一起传承中华文化，共创网络文学的美好未来。
             </p>
           </div>
         </div>
       </div>
     </div>
   </section>
</div>

<style>
  :global(body) {
    background-color: #FEF2F2;
  }
</style>