<script lang="ts">
  import { user } from "$lib/stores/authStore";

  export let chapterId: string;

  let sending = false;
  let message = "";

  const gifts = [
    { type: "咖啡", icon: "☕", amount: 1 },
    { type: "鲜花", icon: "🌹", amount: 5 },
    { type: "爱心", icon: "❤️", amount: 10 }
  ];

  async function sendGift(giftType: string, amount: number) {
    if (!$user) return;

    sending = true;
    message = "";

    try {
      const response = await fetch("/api/chapter-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          giftType,
          amount
        })
      });

      if (response.ok) {
        message = "礼物已送出！";
        setTimeout(() => message = "", 2000);
      } else {
        message = "送礼失败，请重试";
      }
    } catch (error) {
      message = "送礼失败，请重试";
    } finally {
      sending = false;
    }
  }
</script>

{#if $user}
<div class="bg-white p-4 rounded-lg shadow-md mx-4 mb-4">
  <h3 class="text-lg font-semibold mb-3 text-gray-800">给作者送礼物</h3>

  <div class="flex gap-3">
    {#each gifts as gift}
      <button
        on:click={() => sendGift(gift.type, gift.amount)}
        disabled={sending}
        class="flex-1 py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div class="text-2xl mb-1">{gift.icon}</div>
        <div class="text-sm">{gift.type}</div>
      </button>
    {/each}
  </div>

  {#if message}
    <div class="mt-3 text-center text-sm font-medium text-green-600">
      {message}
    </div>
  {/if}
</div>
{/if}
