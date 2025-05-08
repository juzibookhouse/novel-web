<script lang="ts">
  import { WEBSITE_NAME } from "$lib/constants";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { addUserNovel, checkUserNovel, removeUserNovel, supabase } from "$lib/supabaseClient";
  import { user, setUser } from "$lib/stores/authStore";
  import MembershipPlans from "$lib/components/MembershipPlans.svelte";
  import { getUserDateFormat } from "$lib/user.js";
  import { getChapterLength } from "$lib/novel.js";
    import ChapterPagination from "$lib/components/novels/ChapterPagination.svelte";
    import ChapterContent from "$lib/components/novels/ChapterContent.svelte";
    import ChapterLoginMsg from "$lib/components/novels/ChapterLoginMsg.svelte";
    import ChapterMemberSubscriptionMsg from "$lib/components/novels/ChapterMemberSubscriptionMsg.svelte";

  export let data;
  $: ({ chapter, prevChapterId, nextChapterId, novelId } = data);

  let showMembershipModal = false;
  let isApproved = false;
  
  let isInBookshelf = false;
  let readingStartTime: number | null = null;
  let readingTimer: NodeJS.Timeout;

  onMount(async () => {
    if ($user) {
      isApproved = $user.isMembership;

      const { data: bookshelf } = await checkUserNovel($user, novelId);
      isInBookshelf = !!bookshelf;

      if (!isApproved) {
      } else {
        // Start reading timer
        readingStartTime = Date.now();
        startReadingTimer();
      }
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

    await supabase.from("reading_records").upsert({
      user_id: $user.id,
      novel_id: novelId,
      chapter_id: chapter.id,
      reading_time: readingTime,
    });
  }

  async function toggleBookshelf() {
    if (!$user) return;

    if (isInBookshelf) {
      await removeUserNovel($user, novelId);
    } else {
      await addUserNovel($user, novelId);
    }

    isInBookshelf = !isInBookshelf;
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
    <div
      class="p-6 border-b-2 border-red-100 flex items-center justify-between"
    >
      <a
        href={`/novel/${novelId}`}
        class="text-red-700 hover:text-primary transition-colors duration-200"
      >
        ← 返回目录
      </a>
      <h1 class="font-['Ma_Shan_Zheng'] text-2xl text-primary">
        {chapter.novels.title}
      </h1>

      {#if $user}
        <button
          on:click={toggleBookshelf}
          class="text-red-700 cursor-pointer hover:text-primary transition-colors duration-200"
        >
          {isInBookshelf ? "移出书架" : "加入书架"}
        </button>
      {/if}
    </div>

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
