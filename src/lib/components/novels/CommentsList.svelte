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
            <p class="text-xs text-center text-gray-500 mt-1">来自章节：{comment.chapter_title}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>