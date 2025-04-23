<script lang="ts">
  export let data;
  const { ongoingNovels, finishedNovels } = data;

  const categories = [
    { name: '武侠', icon: '⚔️', desc: '侠之大者，为国为民', color: 'bg-blue-50' },
    { name: '仙侠', icon: '🌌', desc: '飞天遁地，逍遥自在', color: 'bg-purple-50' },
    { name: '历史', icon: '📜', desc: '秦皇汉武，气吞万里', color: 'bg-yellow-50' },
    { name: '玄幻', icon: '🐉', desc: '神通广大，法力无边', color: 'bg-green-50' }
  ];

  const features = [
    {
      title: '海量小说',
      description: '数万部精品小说，涵盖各类题材，满足您的阅读需求',
      icon: '📚'
    },
    {
      title: '正版授权',
      description: '所有作品均获得作者授权，支持原创文学创作',
      icon: '📜'
    },
    {
      title: '极致体验',
      description: '个性化的阅读设置，让您享受舒适的阅读体验',
      icon: '⚡'
    },
    {
      title: '作者福利',
      description: '专业的创作平台，丰厚的稿费制度，助力作者成长',
      icon: '🎯'
    }
  ];

  const stats = [
    { number: '1000+', label: '签约作者' },
    { number: '10000+', label: '精品小说' },
    { number: '100万+', label: '活跃读者' },
    { number: '1亿+', label: '月阅读时长' }
  ];

  const promotions = [
    {
      title: '新人福利',
      description: '注册即送7天VIP会员',
      image: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      link: '/user/signup'
    },
    {
      title: '作家专区',
      description: '高额稿酬等你来拿',
      image: 'https://images.pexels.com/photos/3059747/pexels-photo-3059747.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      link: '/author/signup'
    },
    {
      title: '限时活动',
      description: '年度会员5折优惠',
      image: 'https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      link: '/user/signup'
    }
  ];

  const rankings = {
    daily: ongoingNovels.slice(0, 5),
    weekly: finishedNovels.slice(0, 5),
    monthly: [...ongoingNovels, ...finishedNovels].slice(0, 5)
  };

  let activeRanking: 'daily' | 'weekly' | 'monthly' = 'daily';
</script>

<svelte:head>
  <title>墨香书院 - 汇聚华夏文学精粹</title>
</svelte:head>

<div class="bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
  <!-- Hero Section -->
  <section class="relative py-32 px-4 sm:px-6 lg:px-8 bg-red-800 text-white overflow-hidden">
    <div class="absolute inset-0 bg-red-900/30"></div>
    <div class="relative max-w-7xl mx-auto">
      <div class="lg:grid lg:grid-cols-12 lg:gap-8">
        <div class="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
          <h1 class="font-['Ma_Shan_Zheng'] text-6xl mb-6">墨香书院</h1>
          <p class="text-xl text-yellow-100 mb-8">汇聚华夏文学精粹，传承千年文化瑰宝</p>
          <div class="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="/novels"
              class="bg-yellow-100 text-red-800 px-8 py-3 rounded-full hover:bg-yellow-200 transition duration-200 text-center"
            >
              浏览书库
            </a>
            <a
              href="/author/signup"
              class="border-2 border-yellow-100 text-yellow-100 px-8 py-3 rounded-full hover:bg-red-700 transition duration-200 text-center"
            >
              成为作家
            </a>
          </div>
        </div>
        <div class="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div class="grid grid-cols-2 gap-6">
              {#each stats as stat}
                <div class="text-center">
                  <div class="text-3xl font-bold text-yellow-100">{stat.number}</div>
                  <div class="text-sm text-yellow-50 mt-1">{stat.label}</div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Promotions Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {#each promotions as promo}
          <a
            href={promo.link}
            class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <img
              src={promo.image}
              alt={promo.title}
              class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
              <h3 class="text-2xl font-bold text-white mb-2">{promo.title}</h3>
              <p class="text-white/80">{promo.description}</p>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- Rankings Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8 bg-white/80">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 text-center mb-12">热门榜单</h2>
      <div class="flex justify-center space-x-4 mb-8">
        {#each [
          { id: 'daily', label: '日榜' },
          { id: 'weekly', label: '周榜' },
          { id: 'monthly', label: '月榜' }
        ] as tab}
          <button
            class="px-6 py-2 rounded-full {activeRanking === tab.id ? 'bg-red-800 text-white' : 'bg-red-50 text-red-800'} hover:bg-red-700 hover:text-white transition-colors"
            on:click={() => activeRanking = tab.id as any}
          >
            {tab.label}
          </button>
        {/each}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {#each rankings[activeRanking] as novel, i}
          <a
            href={`/novel/${novel.id}`}
            class="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div class="relative">
              <img
                src={novel.cover_url || 'https://via.placeholder.com/300x400?text=封面未上传'}
                alt={novel.title}
                class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div class="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-800 text-white flex items-center justify-center text-lg font-bold">
                {i + 1}
              </div>
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium text-gray-900 mb-1 line-clamp-1">{novel.title}</h3>
              <p class="text-sm text-gray-500 line-clamp-2">{novel.description}</p>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8 bg-white/80">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 text-center mb-12">平台特色</h2>
      <div class="grid grid-cols-4 gap-8">
        {#each features as feature}
          <div class="text-center p-6 rounded-lg border-2 border-red-100 hover:border-red-300 transition-all duration-200">
            <div class="text-4xl mb-4">{feature.icon}</div>
            <h3 class="text-xl font-medium text-gray-900 mb-2">{feature.title}</h3>
            <p class="text-gray-600">{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Categories Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 text-center mb-12">精选分类</h2>
      <div class="grid grid-cols-4 gap-8">
        {#each categories as category}
          <a
            href={`/novels?category=${category.name}`}
            class="group {category.color} rounded-lg p-8 text-center hover:shadow-xl transition-all duration-300"
          >
            <span class="text-5xl mb-6 block transform group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
            <h3 class="text-2xl font-medium text-gray-900 mb-2">{category.name}</h3>
            <p class="text-gray-600">{category.desc}</p>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- Ongoing Novels Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8 bg-red-50/50">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 text-center mb-12">连载作品</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each ongoingNovels as novel}
          <a
            href={`/novel/${novel.id}`}
            class="group bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden border-2 border-red-100 hover:border-red-300 transition duration-200"
          >
            <div class="aspect-w-3 aspect-h-2">
              <img
                src={novel.cover_url || 'https://via.placeholder.com/400x300?text=封面未上传'}
                alt={novel.title}
                class="object-cover w-full h-48 group-hover:scale-105 transition duration-200"
              />
            </div>
            <div class="p-6">
              <h3 class="text-xl font-medium text-gray-900 mb-2">{novel.title}</h3>
              <p class="text-gray-600 line-clamp-2">{novel.description}</p>
              <div class="mt-4 flex items-center justify-between">
                <span class="text-sm text-gray-500">{novel.author}</span>
                <span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  连载中
                </span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- Finished Novels Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8 bg-white/80">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 text-center mb-12">完结作品</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each finishedNovels as novel}
          <a
            href={`/novel/${novel.id}`}
            class="group bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden border-2 border-red-100 hover:border-red-300 transition duration-200"
          >
            <div class="aspect-w-3 aspect-h-2">
              <img
                src={novel.cover_url || 'https://via.placeholder.com/400x300?text=封面未上传'}
                alt={novel.title}
                class="object-cover w-full h-48 group-hover:scale-105 transition duration-200"
              />
            </div>
            <div class="p-6">
              <h3 class="text-xl font-medium text-gray-900 mb-2">{novel.title}</h3>
              <p class="text-gray-600 line-clamp-2">{novel.description}</p>
              <div class="mt-4 flex items-center justify-between">
                <span class="text-sm text-gray-500">{novel.author}</span>
                <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  已完结
                </span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- About Section -->
  <section class="py-16 px-4 sm:px-6 lg:px-8 bg-white/80">
    <div class="max-w-7xl mx-auto">
      <div class="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
        <div>
          <h2 class="font-['Ma_Shan_Zheng'] text-4xl text-red-800 mb-6">关于墨香书院</h2>
          <div class="prose prose-lg">
            <p class="text-gray-600 mb-4">
              墨香书院成立于2025年，是一个专注于中文网络文学创作与阅读的综合性平台。我们致力于为读者提供优质的阅读体验，为作者打造理想的创作平台。
            </p>
            <p class="text-gray-600 mb-4">
              在这里，您可以找到各类精品小说，从武侠仙侠到都市言情，应有尽有。我们重视原创内容，尊重知识产权，为作者提供合理的收益分成。
            </p>
            <p class="text-gray-600">
              加入墨香书院，与我们一起传承中华文化，共创网络文学的美好未来。
            </p>
          </div>
        </div>
        <div class="mt-10 lg:mt-0 grid grid-cols-2 gap-6">
          {#each stats as stat}
            <div class="bg-red-50 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-red-800">{stat.number}</div>
              <div class="text-sm text-red-600 mt-1">{stat.label}</div>
            </div>
          {/each}
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