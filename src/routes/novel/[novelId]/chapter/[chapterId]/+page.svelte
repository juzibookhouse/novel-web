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

  export let data;
  $: ({ chapter, prevChapterId, nextChapterId, novelId } = data);

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
    // Add event listeners for user activity
    if (window) {
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('scroll', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
    }
  });

  onDestroy(() => {
    // Clean up event listeners and timers
    window.removeEventListener('mousemove', handleUserActivity);
    window.removeEventListener('keydown', handleUserActivity);
    window.removeEventListener('scroll', handleUserActivity);
    window.removeEventListener('click', handleUserActivity);
    
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

    await upsertChapterReadingRecords(chapter, readingTime);
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

<div
  class="min-h-screen bg-red-50 py-8 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/chinese-pattern.png')]"
>
  <div
    class="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-lg border-2 border-red-100 shadow-xl"
  >
    <!-- Chapter Navigation -->
    <ChapterHeader chapter={chapter} />

    <!-- Chapter Content -->
    <div class="p-8">
      <h2 class="text-3xl text-gray-900 mb-4 text-center">{chapter.title}</h2>
      <div class="text-gray-600 text-center mb-2">
        <p>字数: {getChapterLength(chapter)}</p>
        <p>更新时间: {getUserDateFormat(chapter.updated_at)}</p>
      </div>

      {#if chapter.novels.user_id === $user?.id || chapter.is_free || chapter.novels.is_free || $user?.isMembership}
        <ChapterContent chapter={chapter} />
      {:else if !$user}
        <ChapterLoginMsg />
      {:else if !$user?.isMembership}
        <ChapterMemberSubscriptionMsg handleMembershipModal={()=>showMembershipModal=true} />
      {/if}
    </div>

    <ChapterPagination novelId={novelId} prevChapterId={prevChapterId} nextChapterId={nextChapterId} />
    
  </div>
</div>

<svelte:window
  on:keydown={(e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
    }
  }}
  on:contextmenu={(e) => e.preventDefault()}
/>

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
