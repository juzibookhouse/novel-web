<!-- src/routes/+page.svelte -->
<script>
  import { fade } from 'svelte/transition';
  
  // 模拟数据
  const featuredNovels = [
    { id: 1, title: '九州·缥缈录', author: '江南', category: '玄幻', cover: '/images/cover1.jpg' },
    { id: 2, title: '剑来', author: '烽火戏诸侯', category: '仙侠', cover: '/images/cover2.jpg' },
    { id: 3, title: '庆余年', author: '猫腻', category: '权谋', cover: '/images/cover3.jpg' }
  ];

  const categories = [
    { name: '武侠', icon: '⚔️' },
    { name: '仙侠', icon: '🌌' },
    { name: '历史', icon: '📜' },
    { name: '言情', icon: '💞' },
    { name: '玄幻', icon: '🐉' }
  ];
</script>

<svelte:head>
  <title>墨香书院 - 阅尽江湖事</title>
  <!-- 引入书法字体 -->
  <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
</svelte:head>

<!-- 主容器使用传统红色背景 -->
<div class="min-h-screen bg-red-50 bg-opacity-95">
  <!-- 导航栏 -->
  <nav class="bg-red-800 text-yellow-50 shadow-lg">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <h1 class="font-mashanzheng text-3xl hover:text-yellow-200 transition-colors">
        <a href="/">墨香书院</a>
      </h1>
      
      <div class="hidden md:flex space-x-6">
        <a href="/library" class="hover:text-yellow-200 transition-colors">书库</a>
        <a href="/rankings" class="hover:text-yellow-200 transition-colors">排行榜</a>
        <a href="/authors" class="hover:text-yellow-200 transition-colors">作家专区</a>
      </div>
    </div>
  </nav>

  <!-- 搜索栏 -->
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto relative">
      <input 
        type="text" 
        placeholder="搜索书名或作者..."
        class="w-full px-6 py-3 rounded-full border-2 border-red-300 focus:outline-none focus:border-red-500 shadow-lg"
      />
      <button class="absolute right-3 top-2 bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors">
        寻书
      </button>
    </div>
  </div>

  <!-- 特色推荐 -->
  <section class="container mx-auto px-4 py-12">
    <h2 class="text-3xl font-mashanzheng text-red-800 mb-8 border-l-4 border-red-600 pl-4">
      精品推荐
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each featuredNovels as novel}
        <article 
          transition:fade
          class="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 group"
        >
          <img 
            src={novel.cover} 
            alt={novel.title}
            class="w-full h-48 object-cover transform group-hover:scale-105 transition-transform"
          />
          <div class="p-6">
            <div class="flex items-center mb-2">
              <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">{novel.category}</span>
            </div>
            <h3 class="text-xl font-semibold text-gray-800">{novel.title}</h3>
            <p class="text-gray-600 mt-2">作者：{novel.author}</p>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <!-- 分类导航 -->
  <section class="bg-red-100 py-12">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-mashanzheng text-red-800 mb-8 text-center">
        书海分类
      </h2>
      
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        {#each categories as category}
          <a 
            href="/category/{category.name}" 
            class="bg-white p-6 rounded-lg text-center hover:bg-red-50 transition-colors"
          >
            <span class="text-4xl mb-2 block">{category.icon}</span>
            <span class="text-gray-800 font-medium">{category.name}</span>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- 页脚 -->
  <footer class="bg-red-900 text-yellow-100 mt-12">
    <div class="container mx-auto px-4 py-8">
      <div class="text-center border-t border-red-700 pt-4">
        <p>© 2023 墨香书院 - 保留所有权利</p>
        <div class="mt-2 space-x-4">
          <a href="/about" class="hover:text-yellow-200">关于我们</a>
          <a href="/contact" class="hover:text-yellow-200">联系我们</a>
        </div>
      </div>
    </div>
  </footer>
</div>

<style global>
  /* 自定义字体样式 */
  .font-mashanzheng {
    font-family: 'Ma Shan Zheng', cursive;
  }

  /* 添加传统纹样背景 */
  body {
    background-image: url('/images/pattern.png');
    background-size: 300px;
  }

  /* 输入框传统样式 */
  input::placeholder {
    color: #9CA3AF;
    font-style: italic;
  }
</style>