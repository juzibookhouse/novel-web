<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';

  export let quotationChapters;
  
  let currentIndex = 0;
  let intervalId: NodeJS.Timeout;
  
  // 自动切换幻灯片
  const startAutoPlay = () => {
    intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % quotationChapters.length;
    }, 5000); // 每5秒切换一次
  };

  // 手动切换幻灯片
  const prevSlide = () => {
    currentIndex = (currentIndex - 1 + quotationChapters.length) % quotationChapters.length;
  };

  const nextSlide = () => {
    currentIndex = (currentIndex + 1) % quotationChapters.length;
  };

  // 组件挂载时启动自动播放
  onMount(() => {
    if (quotationChapters.length > 1) {
      startAutoPlay();
    }
  });

  // 组件销毁时清理定时器
  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
</script>

<!-- Featured Novel Section -->
<section class="relative py-24 bg-primary overflow-hidden">
  <div class="max-w-5xl mx-auto px-4 relative min-h-[300px]">
    {#if quotationChapters.length > 0}
      {#each [quotationChapters[currentIndex]] as { quotation, novel_id, title, novels:{title: novelTitle} }}
        <div class="text-center" 
             in:fade={{ duration: 300 }} 
             out:fade={{ duration: 300 }}>
          <a href="/novel/{novel_id}" class="block">
            <span class="text-9xl font-bold text-gray-600">“</span>
            <p class="text-3xl italic text-gray-800 mb-8 text-center relative z-10">
              {quotation}
            </p>
            <h2 class="text-2xl font-bold mb-2">{novelTitle} {title}</h2>
          </a>
        </div>
      {/each}

      <!-- Navigation Buttons -->
      {#if quotationChapters.length > 1}
        <button 
          class="absolute cursor-pointer -left-10 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
          on:click={prevSlide}
          aria-label="Previous slide">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          class="absolute cursor-pointer -right-10 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
          on:click={nextSlide}
          aria-label="Next slide">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Slide Indicators -->
        <div class="flex space-x-2 mt-5 justify-center">
          {#each quotationChapters as _, i}
            <button
              class="w-2 h-2 cursor-pointer rounded-full transition-colors {i === currentIndex ? 'bg-white' : 'bg-gray-300'}"
              on:click={() => currentIndex = i}
              aria-label="Go to slide {i + 1}"
            ></button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  button {
    outline: none;
  }
  
  button:focus-visible {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
  }
</style>