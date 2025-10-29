<script lang="ts">
  import type { Gift } from "$lib/types/gift";
  import PaymentMethodSelector from "./PaymentMethodSelector.svelte";

  export let gift: Gift;
  export let paymentMethod: 'card' | 'alipay' | 'wechat_pay';
  export let processing: boolean;
  export let clientSecret: string;
  export let message: string;
  export let onCancel: () => void;
  export let onChangeMethod: (method: 'card' | 'alipay' | 'wechat_pay') => void;
  export let onSubmit: () => void;

  $: displayPrice = paymentMethod === 'card' ? `$${gift.price}` : `¥${gift.price_cn}`;
</script>

<div>
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-xl font-medium text-gray-700">支付礼物</h3>
    <button
      on:click={onCancel}
      class="text-gray-500 hover:text-gray-700"
      aria-label="取消"
    >
      ✕
    </button>
  </div>

  <div class="bg-white p-4 rounded-lg mb-4 border border-gray-200">
    <div class="flex items-center gap-3">
      <img src={gift.image} alt={gift.title} class="w-12 h-12 rounded-full" />
      <div class="flex-1">
        <div class="font-medium text-gray-700">{gift.title}</div>
        <div class="text-sm text-gray-500">{displayPrice}</div>
      </div>
    </div>
  </div>

  <PaymentMethodSelector
    selectedMethod={paymentMethod}
    onChangeMethod={onChangeMethod}
  />

  <div id="payment-element" class="mb-4"></div>

  {#if message}
    <div class="mb-4 text-center text-sm font-medium text-red-500">
      {message}
    </div>
  {/if}

  <button
    on:click={onSubmit}
    disabled={processing || !clientSecret}
    class="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {processing ? '处理中...' : '确认支付'}
  </button>
</div>
