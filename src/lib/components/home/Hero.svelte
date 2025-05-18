<script>
  import { WEBSITE_NAME } from "$lib/constants";
    import { user } from "$lib/stores/authStore";
  import { onMount } from 'svelte';
  
  let visible = false;
  
  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 100);
  });
</script>

<!-- Hero Section -->
<section
  class="relative flex items-center justify-center py-32 px-4 overflow-hidden"
  style="background-image: url('/images/chinese-pattern.png'); background-size: 200px; background-repeat: repeat;"
>
  <!-- 背景渐变 -->
  <div
    class="absolute inset-0 bg-gradient-to-r from-[var(--primary-color)] to-[var(--highlight-color)] opacity-90"
  ></div>
  
  <!-- 装饰元素 - 左侧 -->
  <div class="absolute left-0 top-0 h-full w-24 opacity-20">
    <div class="h-full w-full bg-white" style="mask-image: url('/images/chinese-border.png'); mask-size: contain; mask-repeat: repeat-y;"></div>
  </div>
  
  <!-- 装饰元素 - 右侧 -->
  <div class="absolute right-0 top-0 h-full w-24 opacity-20">
    <div class="h-full w-full bg-white" style="mask-image: url('/images/chinese-border.png'); mask-size: contain; mask-repeat: repeat-y; transform: scaleX(-1);"></div>
  </div>
  
  <div class="relative max-w-7xl mx-auto text-center z-10">
    <div class="flex flex-col items-center justify-center space-y-8">
      <div 
        class="flex items-center justify-center gap-4 transition-all duration-1000 transform {visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}"
      >
        <h1 class="font-['Ma_Shan_Zheng'] text-7xl text-white drop-shadow-lg">
          {WEBSITE_NAME}
        </h1>
      </div>
      
      <p 
        class="text-3xl text-[var(--accent-color)] max-w-2xl mx-auto font-medium transition-all duration-1000 delay-300 transform {visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}"
      >
      让我们在这里撒点野
      </p>
      
      {#if (!$user)}
      <div 
        class="flex flex-col md:flex-row gap-4 md:gap-6 mt-8 transition-all duration-1000 delay-500 transform {visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}"
      >
        <a
          href="/user/signup"
          class="bg-[var(--accent-color)] text-[var(--primary-color)] px-5 py-2 rounded-lg text-lg font-medium hover:bg-white transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          注册会员
        </a>
        
        <a
          href="/author/signup"
          class="border-2 border-[var(--accent-color)] text-[var(--accent-color)] px-5 py-2 rounded-lg text-lg font-medium hover:bg-[var(--accent-color)] hover:text-white transition duration-300 transform hover:-translate-y-1"
        >
          成为作家
        </a>
      </div>
      {/if}
      
      <!-- 装饰元素 - 底部波浪 -->
      <div class="absolute bottom-0 left-0 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" class="w-full h-auto">
          <path fill="var(--bg-color)" fill-opacity="1" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,56C1248,48,1344,32,1392,24L1440,16L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
        </svg>
      </div>
    </div>
  </div>
</section>

<style>
  /* 添加一些微妙的动画 */
  section {
    position: relative;
    background-color: var(--primary-color);
  }
  
  /* 确保图片资源存在 */
  @media (max-width: 768px) {
    section {
      background-size: 100px;
    }
  }
</style>