<script lang="ts">
  import { WEBSITE_NAME } from '$lib/constants';
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/authStore';
  import MembershipPlans from '$lib/components/MembershipPlans.svelte';

  export let data;
  $: ({ chapter, prevChapterId, nextChapterId, novelId } = data);

  let showMembershipModal = false;
  let isApproved = false;
  let fontSize = 16;
  let isInBookshelf = false;
  let readingStartTime: number | null = null;
  let readingTimer: NodeJS.Timeout;

  onMount(async () => {
    if ($user) {

      isApproved = $user.isMembership;

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
      .upsert({
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

  const handleClose = () => {
    showMembershipModal = false;
    setUser($user);
  }

</script>

<svelte:head>
<title>{chapter.title} - {chapter.novels.title} - {WEBSITE_NAME}</title>
</svelte:head>

{#if showMembershipModal}
<MembershipPlans
  onClose={() => handleClose()}
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
        class="text-red-700 hover:text-primary transition-colors duration-200"
      >
        ← 返回目录
      </a>
      <h1 class="font-['Ma_Shan_Zheng'] text-2xl text-primary">{chapter.novels.title}</h1>
      
      {#if $user?.isMembership}
        <button
          on:click={toggleBookshelf}
          class="text-red-700 cursor-pointer hover:text-primary transition-colors duration-200"
        >
          {isInBookshelf ? '移出书架' : '加入书架'}
        </button>
      {/if}
    </div>

    <!-- Reading Controls -->
    {#if $user?.isMembership}
      <div class="p-4 border-b-2 border-red-100 flex justify-center space-x-4">
        <button
          on:click={() => changeFontSize(-2)}
          class="px-3 py-1 rounded-full"
        >
          A-
        </button>
        <button
          on:click={() => changeFontSize(2)}
          class="px-3 py-1 rounded-full"
        >
          A+
        </button>
      </div>
    {/if}

    <!-- Chapter Content -->
    <div class="p-8">
      <h2 class="text-3xl text-gray-900 mb-4 text-center">{chapter.title}</h2>
      <div class="text-gray-600 text-center mb-8">
        <p>字数: {chapter.content?.length || 0}</p>
        <p>更新时间: {new Date(chapter.updated_at || chapter.created_at).toLocaleString('zh-CN')}</p>
      </div>
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
      {:else if !$user?.isMembership}
        <div class="text-center py-8">
          <p class="text-gray-800 mb-4">订阅会员后即可继续阅读</p>
          <button
            on:click={() => showMembershipModal = true}
            class="px-6 py-2 rounded-full"
          >
            立即订阅
          </button>
        </div>
      {:else}
        <div class="prose prose-lg max-w-none">
          <div 
            class="text-gray-800 leading-relaxed"
            style="font-size: {fontSize}px"
          >
            {@html chapter.content || '本章节暂无内容'}
          </div>
        </div>
      {/if}
    </div>

    <!-- Chapter Navigation Buttons -->
    <div class="p-6 border-t-2 border-red-100 flex justify-between items-center">
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
  </div>
</div>
</div>

<style>
:global(body) {
  background-color: #FEF2F2;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.prose {
  pointer-events: none;
}

.prose :global(*) {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>

<svelte:window 
  on:keydown={(e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
    }
  }}
  on:contextmenu={(e) => e.preventDefault()}
/>