<script lang="ts">
  import { goto } from '$app/navigation';
  export let novelId:string, prevChapterId:string, nextChapterId:string;

  let prevChapterUrl:string, nextChapterUrl:string;
  $:{
    prevChapterUrl = `/novel/${novelId}/chapter/${prevChapterId}`;
    nextChapterUrl = `/novel/${novelId}/chapter/${nextChapterId}`;
  }
</script>
<!-- Chapter Navigation Buttons -->
<div
class="p-4 border-t-2 border-gray-400 flex justify-between items-center"
>
{#if prevChapterId}
  <a
    href={prevChapterUrl}
    class="px-6 py-2 bg-red-100 text-primary rounded hover:bg-red-200 transition-colors duration-200"
  >
    ← 上一章
  </a>
{:else}
  <div class="px-6 py-2 bg-gray-100 text-primary rounded cursor-not-allowed">没有上一章</div>
{/if}
<div>使用键盘左箭头到上一张，右箭头到下一张</div>

{#if nextChapterId}
  <a
    href={nextChapterUrl}
    class="px-6 py-2 bg-red-100 text-primary rounded hover:bg-red-200 transition-colors duration-200"
  >
    下一章 →
  </a>
{:else}
  <div class="px-6 py-2 bg-gray-100 text-primary rounded cursor-not-allowed">没有下一章</div>
{/if}
</div>