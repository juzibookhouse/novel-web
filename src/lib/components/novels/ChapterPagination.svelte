<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  export let novelId:string, prevChapterId:string, nextChapterId:string;

  let prevChapterUrl:string, nextChapterUrl:string;
  $:{
    prevChapterUrl = `/novel/${novelId}/chapter/${prevChapterId}`;
    nextChapterUrl = `/novel/${novelId}/chapter/${nextChapterId}`;
  }

  console.log(prevChapterId, nextChapterId);
  
  // 处理键盘事件的函数
  function handleKeydown(event: KeyboardEvent) {
    // 左箭头键 - 上一章
    if (prevChapterId && event.key === 'ArrowLeft') {
      goto(prevChapterUrl);
    }
    // 右箭头键 - 下一章
    if (nextChapterId && event.key === 'ArrowRight') {
      goto(nextChapterUrl);
    }
  }
  
  // 组件挂载时添加键盘事件监听器
  if (typeof window != 'undefined') {
    onMount(() => {
      window.addEventListener('keydown', handleKeydown);
    });
    
    // 组件销毁时移除键盘事件监听器，防止内存泄漏
    onDestroy(() => {
      window.removeEventListener('keydown', handleKeydown);
    });
  }
</script>
<!-- Chapter Navigation Buttons -->
<div
class="p-6 border-t-2 border-gray-400 flex justify-between items-center"
>
{#if prevChapterId}
  <a
    href={prevChapterUrl}
    class="px-6 py-2 bg-red-100 text-primary rounded-full hover:bg-red-200 transition-colors duration-200"
  >
    ← 上一章
  </a>
{:else}
  <div></div>
{/if}
<div>使用键盘左箭头到上一张，右箭头到下一张</div>

{#if nextChapterId}
  <a
    href={nextChapterUrl}
    class="px-6 py-2 bg-red-100 text-primary rounded-full hover:bg-red-200 transition-colors duration-200"
  >
    下一章 →
  </a>
{:else}
  <div></div>
{/if}
</div>