<script lang="ts">
  export let novelId,prevChapterId,nextChapterId;
</script>
<!-- Chapter Navigation Buttons -->
<div
class="p-6 border-t-2 border-red-100 flex justify-between items-center"
>
{#if prevChapterId}
  <a
    href={`/novel/${novelId}/chapter/${prevChapterId}`}
    class="px-6 py-2 bg-red-100 text-primary rounded-full hover:bg-red-200 transition-colors duration-200"
  >
    ← 上一章
  </a>
{:else}
  <div></div>
{/if}

{#if nextChapterId}
  <a
    href={`/novel/${novelId}/chapter/${nextChapterId}`}
    class="px-6 py-2 bg-red-100 text-primary rounded-full hover:bg-red-200 transition-colors duration-200"
  >
    下一章 →
  </a>
{:else}
  <div></div>
{/if}
</div>