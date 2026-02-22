<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  export let data;

  let countdown = 5;
  let timer: ReturnType<typeof setInterval>;
  let confirmTimeout: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    // 设置倒计时，5秒后自动返回上一页
    timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timer);
        goBack();
      }
    }, 1000);

    // 如果 URL 中包含 user_membership_id，则在 2 秒后调用后端确认接口
    try {
      const params = new URLSearchParams(window.location.search);
      const user_membership_id = params.get("user_membership_id");
      if (user_membership_id) {
        confirmTimeout = setTimeout(() => {
          fetch('/api/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_membership_id })
          }).catch((err) => console.error('confirm-payment request failed', err));
        }, 2000);
      }
    } catch (e) {
      console.error('confirm-payment call error', e);
    }

    // 组件卸载时清除定时器和确认请求超时
    return () => {
      if (timer) clearInterval(timer);
      if (confirmTimeout) clearTimeout(confirmTimeout);
    };
  });

  function goBack() {
    // 返回上一页
    if (data?.previous_url) {
      goto(data?.previous_url);
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
    <div class="text-center">
      <svg
        class="w-16 h-16 text-green-500 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        ></path>
      </svg>

      <h2 class="text-2xl font-bold text-gray-800 mb-2">支付成功！</h2>
      <p class="text-gray-600 mb-4">
        您已成功开通 <span class="font-semibold">{data.plan_name}</span> 会员服务
      </p>

      <div class="text-sm text-gray-500 mb-6">
        将在 <span class="font-bold">{countdown}</span> 秒后自动返回...
      </div>

      <button
        on:click={goBack}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        立即返回
      </button>
    </div>
  </div>
</div>

<style>
  /* 可以添加额外的样式 */
</style>
