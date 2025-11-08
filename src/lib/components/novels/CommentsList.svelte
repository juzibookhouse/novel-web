<script lang="ts">
  import { onMount } from 'svelte';
  import type { Comment } from "$lib/types/comment";

  export let comments: Array<Comment> = [];

  let currentIndex = 0;
  let intervalId: any;
  let isPaused = false;

  onMount(() => {
    startCarousel();
    return () => clearInterval(intervalId);
  });

  function startCarousel() {
    intervalId = setInterval(() => {
      if (!isPaused && comments.length > 0) {
        currentIndex = (currentIndex + 1) % comments.length;
      }
    }, 8000);
  }

  function nextComment() {
    if (comments.length > 0) {
      currentIndex = (currentIndex + 1) % comments.length;
      resetCarousel();
    }
  }

  function prevComment() {
    if (comments.length > 0) {
      currentIndex = (currentIndex - 1 + comments.length) % comments.length;
      resetCarousel();
    }
  }

  function resetCarousel() {
    clearInterval(intervalId);
    startCarousel();
  }
</script>

<div class="relative overflow-hidden w-full min-h-[200px]">
  {#if comments.length === 0}
    <p class="text-gray-500 text-center py-4">暂无评论</p>
  {:else}
    <div 
      class="absolute inset-0 flex transition-transform duration-500 ease-in-out"
      style="transform: translateX(-{currentIndex * 100}%)"
    >
      {#each comments as comment (comment.id)}
        <div class="min-w-full bg-white/80 p-4 rounded-lg shadow-sm flex flex-col justify-center">
          <p class="text-gray-700">{comment.content}</p>
          {#if comment.chapter_title}
            <p class="text text-center text-gray-500 mt-1">来自章节：{comment.chapter_title}</p>
          {/if}
        </div>
      {/each}
    </div>
    
    <!-- Navigation buttons -->
    {#if comments.length > 1}
      <div class="absolute inset-x-0 bottom-0 flex justify-between space-x-4">
        <button 
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
          on:click={prevComment}
        >
          上一页
        </button>
        <span class="text-gray-600 text-sm py-1">
          {currentIndex + 1} / {comments.length}
        </span>
        <button 
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
          on:click={nextComment}
        >
          下一页
        </button>
      </div>
    {/if}
  {/if}
</div>