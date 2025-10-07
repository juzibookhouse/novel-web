<script lang="ts">
  import { sendRequest } from "$lib/api";
  import { user } from "$lib/stores/authStore";
  import type { Gift } from "$lib/types/gift";
  import { onMount } from "svelte";

  export let chapterId: string;
  export let novelId: string;

  let sending = false;
  let message = "";
  let gifts:Gift[] = [];

  onMount(async() => {
    const {data} = await sendRequest('/api/gifts');
    if (data.gifts) {
      gifts = data.gifts
    }
  })

  async function sendGift(gift_id:string) {
    if (!$user) return;

    sending = true;
    message = "";

    try {
      const {response} = await sendRequest(`/api/novels/${novelId}/chapters/${chapterId}/gifts`, {
        method: "POST",
        body: JSON.stringify({
          gift_id,
        })
      });

      if (response?.ok) {
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
<div class="bg-gray-50 p-6 rounded-xl shadow-sm mx-auto max-w-md">
  <h3 class="text-xl font-medium mb-4 text-gray-700">给作者送礼物</h3>

  <div class="grid grid-cols-3 gap-4">
    {#each gifts as gift}
      <button
        on:click={() => sendGift(gift.id)}
        disabled={sending}
        class="py-3 px-4 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
      >
        <div class="text-3xl mb-2 text-gray-800">{gift.image}</div>
        <div class="text-sm text-gray-600">{gift.title}</div>
      </button>
    {/each}
  </div>

  {#if message}
    <div class="mt-4 text-center text-sm font-medium text-blue-500">
      {message}
    </div>
  {/if}
</div>
{/if}
