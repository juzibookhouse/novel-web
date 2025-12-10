<script lang="ts">
  import { user } from "$lib/stores/authStore";
  import type { Gift } from "$lib/types/gift";
  export let chapterGifts: Gift[];
  export let isUserBookAuthor: boolean = true;

  const allowViewingGifts = $user?.isAdmin || isUserBookAuthor;

  let showModal = false;
  let modalGift: Gift | null = null;

  function openModal(gift: Gift) {
    if (!allowViewingGifts) return;
    modalGift = gift;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    modalGift = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && showModal) closeModal();
  }
</script>

{#if chapterGifts.length > 0}
  <div class="flex gap-1 items-center">
    <h3 class="text text-gray-700">已收到的打赏</h3>
    <div class="flex overflow-x-auto gap-1">
      {#each chapterGifts as gift}
        <button
          on:click={() => openModal(gift)}
          class="focus:outline-none rounded"
          aria-label={gift.title}
          title={allowViewingGifts ? gift.title : ""}
        >
          <img
            src={gift.image}
            alt={gift.title}
            class="w-6 h-6 cursor-pointer object-cover rounded"
            loading="lazy"
          />
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- Modal -->
<svelte:window on:keydown={handleKeydown} />

{#if showModal && modalGift}
  <div class="fixed inset-0 z-50 flex items-start px-4 py-8">
    <div
      class="absolute inset-0 bg-black/50"
      on:click={closeModal}
      aria-hidden="true"
    ></div>

    <div
      class="bg-white rounded-lg shadow-lg max-w-md mx-auto w-full z-10 p-3 text-left relative"
    >
        <button
          class="text-gray-500 hover:text-gray-700 cursor-pointer absolute top-3 right-3"
          on:click={closeModal}
          aria-label="Close"
        >
          ✕
        </button>
        <div class="flex items-center gap-4">
          <img
            src={modalGift.image}
            alt={modalGift.title}
            class="w-24 h-24 object-cover rounded-md"
          />
          <div class="flex-1">
            <h4 class="text-lg font-semibold text-gray-800">
              {modalGift.title}
            </h4>
            {#if modalGift.chapter_title}
              <p class="mt-1 text-sm text-gray-600">
                章节: {modalGift.chapter_title}
              </p>
            {/if}
            {#if modalGift.user_name}
              <p class="mt-1 text-sm text-gray-600">
                送礼者: {modalGift.user_name}
              </p>
            {/if}
            {#if modalGift.price_cn !== undefined}
              <p class="mt-2 text-sm text-gray-500">
                价格: {modalGift.price_cn}
              </p>
            {:else if modalGift.price !== undefined}
              <p class="mt-2 text-sm text-gray-500">价格: {modalGift.price}</p>
            {/if}
          </div>
        </div>
      </div>
    </div>
{/if}
