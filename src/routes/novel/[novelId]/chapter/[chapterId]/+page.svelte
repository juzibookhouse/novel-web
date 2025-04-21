<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/authStore';
  import MembershipPlans from '$lib/components/MembershipPlans.svelte';

  export let data;
  const { chapter, prevChapterId, nextChapterId, novelId } = data;

  let showMembershipModal = false;
  let isApproved = false;
  let fontSize = 16;
  let isInBookshelf = false;
  let readingStartTime: number | null = null;
  let readingTimer: NodeJS.Timeout;

  onMount(async () => {
    if ($user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_approved')
        .eq('user_id', $user.id)
        .single();

      isApproved = profile?.is_approved || false;

      if (!isApproved) {
        showMembershipModal = true;
      } else {
        // Check if novel is in bookshelf
        const { data: bookshelf } = await supabase
          .from('bookshelves')
          .select()
          .eq('user_id', $user.id)
          .eq('novel_id', novelId)
          .single();
        
        isInBookshelf = !!bookshelf;

        // Start reading timer
        readingStartTime = Date.now();
        startReadingTimer();
      }
    }

    // Load saved font size from localStorage
    const savedFontSize = localStorage.getItem('reading-font-size');
    if (savedFontSize) {
      fontSize = parseInt(savedFontSize);
    }
  });

  onDestroy(() => {
    if (readingTimer) {
      clearInterval(readingTimer);
      saveReadingTime();
    }
  });

  function startReadingTimer() {
    readingTimer = setInterval(saveReadingTime, 30000); // Save every 30 seconds
  }

  async function saveReadingTime() {
    if (!$user || !readingStartTime || !isApproved) return;

    const readingTime = Math.floor((Date.now() - readingStartTime) / 1000);
    readingStartTime = Date.now();

    await supabase
      .from('reading_records')
      .insert({
        user_id: $user.id,
        novel_id: novelId,
        chapter_id: chapter.id,
        reading_time: readingTime
      });
  }

  function changeFontSize(delta: number) {
    fontSize = Math.max(12, Math.min(24, fontSize + delta));
    localStorage.setItem('reading-font-size', fontSize.toString());
  }

  async function toggleBookshelf() {
    if (!$user) return;

    if (isInBookshelf) {
      await supabase
        .from('bookshelves')
        .delete()
        .eq('user_id', $user.id)
        .eq('novel_id', novelId);
    } else {
      await supabase
        .from('bookshelves')
        .insert({
          user_id: $user.id,
          novel_id: novelId
        });
    }

    isInBookshelf = !isInBookshelf;
  }
</script>

<svelte:head>
<title>{chapter.title} - {chapter.novels.title} - 墨香书院</title>
<link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
</svelte:head>

{#if showMembershipModal}
<MembershipPlans
  onClose={() => showMembershipModal = false}
  redirectUrl={`/novel/${novelId}/chapter/${chapter.id}`}
/>
{/if}

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
      
      {#if $user && isApproved}
        <button
          on:click={toggleBookshelf}
          class="text-red-700 hover:text-red-800 transition-colors duration-200"
        >
          {isInBookshelf ? '移出书架' : '加入书架'}
        </button>
      {/if}
    </div>

    <!-- Reading Controls -->
    {#if $user && isApproved}
      <div class="p-4 border-b-2 border-red-100 flex justify-center space-x-4">
        <button
          on:click={() => changeFontSize(-2)}
          class="px-3 py-1 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
        >
          A-
        </button>
        <button
          on:click={() => changeFontSize(2)}
          class="px-3 py-1 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
        >
          A+
        </button>
      </div>
    {/if}

    <!-- Chapter Content -->
    <div class="p-8">
      <h2 class="text-3xl text-gray-900 mb-8 text-center">{chapter.title}</h2>
      {#if !$user}
        <div class="text-center py-8">
          <p class="text-gray-800 mb-4">请登录后继续阅读</p>
          <a
            href="/user/login"
            class="inline-block bg-red-800 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
          >
            立即登录
          </a>
        </div>
      {:else if !isApproved}
        <div class="text-center py-8">
          <p class="text-gray-800 mb-4">订阅会员后即可继续阅读</p>
          <button
            on:click={() => showMembershipModal = true}
            class="bg-red-800 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
          >
            立即订阅
          </button>
        </div>
      {:else}
        <div class="prose prose-lg max-w-none">
          <p 
            class="text-gray-800 leading-relaxed whitespace-pre-wrap"
            style="font-size: {fontSize}px"
          >
            {chapter.content || '本章节暂无内容'}
          </p>
        </div>
      {/if}
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