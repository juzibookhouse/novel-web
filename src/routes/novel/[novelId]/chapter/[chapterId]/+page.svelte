<script lang="ts">
  import { WEBSITE_NAME } from "$lib/constants";
  import { onMount, onDestroy } from "svelte";
  import { upsertChapterReadingRecords } from "$lib/supabaseClient";
  import { user, setUser } from "$lib/stores/authStore";
  import MembershipPlans from "$lib/components/MembershipPlans.svelte";
  import { getUserDateFormat } from "$lib/user.js";
  import { getChapterLength } from "$lib/novel.js";
  import ChapterPagination from "$lib/components/novels/ChapterPagination.svelte";
  import ChapterContent from "$lib/components/novels/ChapterContent.svelte";
  import ChapterLoginMsg from "$lib/components/novels/ChapterLoginMsg.svelte";
  import ChapterMemberSubscriptionMsg from "$lib/components/novels/ChapterMemberSubscriptionMsg.svelte";
  import ChapterHeader from "$lib/components/novels/ChapterHeader.svelte";
  import FavNovel from "$lib/components/novels/FavNovel.svelte";
  import ChapterComments from "$lib/components/novels/ChapterComments.svelte";
  import ChapterGifts from "$lib/components/novels/ChapterGifts.svelte";
  import { goto } from '$app/navigation';

  export let data;
  $: ({ chapter, prevChapterId, nextChapterId, novelId } = data);
  
  let prevChapterUrl:string, nextChapterUrl:string;
  $:{
    prevChapterUrl = `/novel/${novelId}/chapter/${prevChapterId}`;
    nextChapterUrl = `/novel/${novelId}/chapter/${nextChapterId}`;
  }
  
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
  
  // 切换键盘事件监听器的状态
  let isKeydownEnabled = true;
  function toggleKeydownEvent(enable: boolean) {
    if (typeof window === 'undefined') return;
    if (enable) {
      window.addEventListener('keydown', handleKeydown);
    } else {
      window.removeEventListener('keydown', handleKeydown);
    }
    isKeydownEnabled = enable;
  }
  
  // 组件挂载时添加键盘事件监听器
  if (typeof window != 'undefined') {
    onMount(() => {
      if (isKeydownEnabled) {
        window.addEventListener('keydown', handleKeydown);
      }
    });
    
    // 组件销毁时移除键盘事件监听器，防止内存泄漏
    onDestroy(() => {
      if (isKeydownEnabled) {
        window.removeEventListener('keydown', handleKeydown);
      }
    });
  }
  
  $: chapterReadingStatus = data.chapter?.is_free || data.chapter?.novels?.is_free;
  
  $: canReadChapter = 
      ($user?.role === 'admin') || 
      (chapterReadingStatus === 'public') || 
      (chapterReadingStatus === 'private' && $user) || 
      (chapterReadingStatus === 'vip' && $user?.isMembership);

  let showMembershipModal = false;
  let readingStartTime: number | null = null;
  let readingTimer: NodeJS.Timeout;
  let isUserActive = false;
  let inactivityTimer: NodeJS.Timeout;

  function handleUserActivity() {
    if (!isUserActive) {
      isUserActive = true;
      readingStartTime = Date.now();
      startReadingTimer();
    }
    
    // Reset inactivity timer
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      isUserActive = false;
      if (readingTimer) {
        clearInterval(readingTimer);
        saveReadingTime();
      }
    }, 60000); // Stop tracking after 1 minute of inactivity
  }

  onMount(() => {
    if ($user) {
      // Add event listeners for user activity
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('scroll', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
    }

    // Add copy protection and context menu prevention
    const preventCopy = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
      }
    };
    const preventContextMenu = (e: Event) => e.preventDefault();
    
    window.addEventListener('keydown', preventCopy);
    window.addEventListener('contextmenu', preventContextMenu);

    return () => {
      window.removeEventListener('keydown', preventCopy);
      window.removeEventListener('contextmenu', preventContextMenu);
    };
  });

  onDestroy(() => {
    // Clean up event listeners and timers
    if (typeof window !== "undefined") {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    }
    
    if (readingTimer) {
      clearInterval(readingTimer);
      saveReadingTime();
    }
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
  });

  function startReadingTimer() {
    readingTimer = setInterval(saveReadingTime, 30000); // Save every 30 seconds
  }

  async function saveReadingTime() {
    if (!readingStartTime || !isUserActive) return;

    const readingTime = Math.floor((Date.now() - readingStartTime) / 1000);
    readingStartTime = Date.now();

    await upsertChapterReadingRecords(chapter, readingTime, $user);
  }

  const handleClose = () => {
    showMembershipModal = false;
    setUser($user);
  };
</script>

<svelte:head>
  <title>{chapter.title} - {chapter.novels?.title} - {WEBSITE_NAME}</title>
</svelte:head>

{#if showMembershipModal}
  <MembershipPlans
    onClose={() => handleClose()}
    redirectUrl={`/novel/${novelId}/chapter/${chapter.id}`}
  />
{/if}
<div class="max-w-4xl mx-auto relative">
  <div class="fixed top-1/2 right-[calc(50vw-520px)] transform -translate-y-1/2 z-10 bg-white p-3 rounded shadow-xl">
    <a
    href={`/novel/${chapter.novel_id}`}
    class="text-red-700 hover:text-primary transition-colors duration-200 mb-4 block"
  >
    返回目录
  </a>
    <FavNovel novelId={novelId} />
  </div>
<div class="bg-[#f2f2f2] backdrop-blur-sm rounded-lg shadow-xl">
    <!-- Chapter Navigation -->
  <ChapterHeader chapter={chapter} />

  <!-- Chapter Content -->
  <div class="pt-8">
    <h2 class="text-3xl text-gray-900 mb-4 text-center">{chapter.title}</h2>
    <div class="text-gray-600 text-center mb-2">
      <p class="font-bold">字数: {getChapterLength(chapter)}</p>
      <p>更新时间: {getUserDateFormat(chapter.updated_at)}</p>
    </div>

    {#if chapter.published && chapter.novels.published}
      {#if chapter.novels.user_id === $user?.id || canReadChapter}
        <ChapterContent chapter={chapter} />
      {:else if !$user}
        <ChapterLoginMsg novelId={novelId} chapterId={chapter.id}/>
      {:else if !$user?.isMembership}
        <ChapterMemberSubscriptionMsg handleMembershipModal={()=>showMembershipModal=true} />
      {/if}
    {:else if chapter.novels.user_id === $user?.id}
      <!-- 作者可以看到未发布的章节 -->
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 mx-4">
        <p class="font-medium">编辑状态</p>
        <p>这个章节或小说目前正在编辑中，尚未发布。只有作者可以查看。</p>
      </div>
      <ChapterContent chapter={chapter} />
    {:else}
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 mx-4">
        <p class="font-medium">章节未发布</p>
        <p>这个章节或小说目前正在编辑中，尚未发布。请稍后再来查看。</p>
      </div>
    {/if}
  </div>

  <ChapterPagination novelId={novelId} prevChapterId={prevChapterId} nextChapterId={nextChapterId} />

  {#if $user?.isAdmin}
  <ChapterGifts chapterId={chapter.id} {novelId} />
  {/if}

  <ChapterComments chapterId={chapter.id} novelId={novelId} toggleKeydownEvent={toggleKeydownEvent} />
    
</div>
</div>

<style>
  :global(body) {
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