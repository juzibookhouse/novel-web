<script lang="ts">
  export let selectedMethod: 'card' | 'alipay' | 'wechat_pay';
  export let onChangeMethod: (method: 'card' | 'alipay' | 'wechat_pay') => void;

  const methods = [
    { value: 'card' as const, label: '信用卡' },
    { value: 'alipay' as const, label: '支付宝' },
    { value: 'wechat_pay' as const, label: '微信支付' }
  ];
</script>

<div class="mb-4">
  <div class="flex gap-2">
    {#each methods as method}
      <button
        on:click={() => onChangeMethod(method.value)}
        class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors {selectedMethod === method.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
      >
        {method.label}
      </button>
    {/each}
  </div>
</div>
