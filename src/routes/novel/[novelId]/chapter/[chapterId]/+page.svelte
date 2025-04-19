<script lang="ts">
    export let data;
    const { chapter, prevChapterId, nextChapterId, novelId } = data;
  </script>
  
  <svelte:head>
    <title>{chapter.title} - {chapter.novels.title} - 墨香书院</title>
    <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
  </svelte:head>
  
  <div class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl">
        <!-- Chapter Navigation -->
        <div class="p-6 border-b-2 border-red-100 flex items-center justify-between">
          <a
            href={`/novel/${novelId}`}
            class="text-red-700 hover:text-red-800 transition-colors duration-200"
          >
            ← 返回目录
          </a>
          <h1 class="font-['Ma_Shan_Zheng'] text-2xl text-red-800">{chapter.novels.title}</h1>
        </div>
  
        <!-- Chapter Content -->
        <div class="p-8">
          <h2 class="text-3xl text-gray-900 mb-8 text-center">{chapter.title}</h2>
          <div class="prose prose-lg max-w-none">
            <p class="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {chapter.content || '本章节暂无内容'}
            </p>
          </div>
        </div>
  
        <!-- Chapter Navigation Buttons -->
        <div class="p-6 border-t-2 border-red-100 flex justify-between items-center">
          {#if prevChapterId}
            <a
              href={`/novel/${novelId}/chapter/${prevChapterId}`}
              class="px-6 py-2 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors duration-200"
            >
              ← 上一章
            </a>
          {:else}
            <div></div>
          {/if}
  
          {#if nextChapterId}
            <a
              href={`/novel/${novelId}/chapter/${nextChapterId}`}
              class="px-6 py-2 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors duration-200"
            >
              下一章 →
            </a>
          {:else}
            <div></div>
          {/if}
        </div>
      </div>
    </div>
  </div>
  
  <style>
    :global(body) {
      background-color: #FEF2F2;
    }
  </style>