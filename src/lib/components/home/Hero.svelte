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
<section class="relative flex items-center justify-center py-32 px-4 overflow-hidden">
  <!-- 背景渐变 -->
  <div
    class="absolute inset-0 bg-gradient-to-r from-[var(--primary-color)] to-[var(--highlight-color)] opacity-90"
  ></div>
  
  <div class="relative max-w-7xl mx-auto text-center z-10">
    <div class="flex flex-col items-center justify-center space-y-8">
      <div 
        class="flex items-center justify-center gap-4 transition-all duration-1000 transform {visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}"
      >
        <h1 class="font-jianhao text-8xl text-white drop-shadow-lg">
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
        class="flex flex-col md:flex-row gap-4 md:gap-6 transition-all duration-1000 delay-500 transform {visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}"
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