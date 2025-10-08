<script lang="ts">
  import { sendRequest } from "$lib/api";
  import { user } from "$lib/stores/authStore";
  import type { Gift } from "$lib/types/gift";
  import { onMount } from "svelte";
  import { loadStripe } from '@stripe/stripe-js';
  import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

  export let chapterId: string;
  export let novelId: string;

  let sending = false;
  let message = "";
  let gifts:Gift[] = [];
  let selectedGift: Gift | null = null;
  let showPaymentForm = false;
  let paymentMethod: 'card' | 'alipay' | 'wechat_pay' = 'card';
  let clientSecret = '';
  let stripe: any = null;
  let elements: any = null;
  let paymentElement: any = null;
  let processing = false;

  onMount(async() => {
    const {data} = await sendRequest('/api/gifts');
    if (data.gifts) {
      gifts = data.gifts
    }
    stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
  })

  async function selectGift(gift: Gift) {
    selectedGift = gift;
    showPaymentForm = true;
    paymentMethod = 'card';
    clientSecret = '';
    await loadPaymentForm();
  }

  async function changePaymentMethod(method: 'card' | 'alipay' | 'wechat_pay') {
    paymentMethod = method;
    await loadPaymentForm();
  }

  async function loadPaymentForm() {
    if (!selectedGift || !stripe) return;

    try {
      const {data} = await sendRequest('/api/gift-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          gift_id: selectedGift.id,
          payment_method: paymentMethod,
          stripeClientSecret: clientSecret
        })
      });

      if (data.clientSecret) {
        clientSecret = data.clientSecret;

        if (elements) {
          elements.destroy();
        }

        const appearance = {
          theme: 'stripe' as const,
          variables: {
            colorPrimary: '#3b82f6',
          }
        };

        elements = stripe.elements({
          clientSecret,
          appearance
        });

        paymentElement = elements.create('payment', {
          layout: 'tabs'
        });

        setTimeout(() => {
          const container = document.getElementById('payment-element');
          if (container) {
            paymentElement.mount('#payment-element');
          }
        }, 100);
      }
    } catch (error) {
      message = "加载支付表单失败";
    }
  }

  async function handleSubmitPayment() {
    if (!stripe || !elements || !selectedGift) return;

    processing = true;
    message = "";

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-confirm',
        },
      });

      if (error) {
        message = error.message || "支付失败，请重试";
      }
    } catch (error) {
      message = "支付失败，请重试";
    } finally {
      processing = false;
    }
  }

  function cancelPayment() {
    showPaymentForm = false;
    selectedGift = null;
    clientSecret = '';
    if (elements) {
      elements.destroy();
      elements = null;
    }
    message = "";
  }
</script>

{#if $user}
<div class="bg-gray-50 p-6 rounded-xl shadow-sm mx-auto max-w-md">
  {#if !showPaymentForm}
    <h3 class="text-xl font-medium mb-4 text-gray-700">给作者送礼物</h3>

    <div class="grid grid-cols-3 gap-4">
      {#each gifts as gift}
        <button
          on:click={() => selectGift(gift)}
          disabled={sending}
          class="py-3 px-4 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
        >
          <div class="text-3xl mb-2 text-gray-800">{gift.image}</div>
          <div class="text-sm text-gray-600">{gift.title}</div>
          <div class="text-xs text-gray-500 mt-1">${gift.price} / ¥{gift.price_cn}</div>
        </button>
      {/each}
    </div>

    {#if message}
      <div class="mt-4 text-center text-sm font-medium text-blue-500">
        {message}
      </div>
    {/if}
  {:else if selectedGift}
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-medium text-gray-700">支付礼物</h3>
        <button
          on:click={cancelPayment}
          class="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div class="bg-white p-4 rounded-lg mb-4 border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="text-3xl">{selectedGift.image}</div>
          <div class="flex-1">
            <div class="font-medium text-gray-700">{selectedGift.title}</div>
            <div class="text-sm text-gray-500">
              {paymentMethod === 'card' ? `$${selectedGift.price}` : `¥${selectedGift.price_cn}`}
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">选择支付方式</label>
        <div class="flex gap-2">
          <button
            on:click={() => changePaymentMethod('card')}
            class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors {paymentMethod === 'card' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
          >
            信用卡
          </button>
          <button
            on:click={() => changePaymentMethod('alipay')}
            class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors {paymentMethod === 'alipay' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
          >
            支付宝
          </button>
          <button
            on:click={() => changePaymentMethod('wechat_pay')}
            class="flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors {paymentMethod === 'wechat_pay' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
          >
            微信支付
          </button>
        </div>
      </div>

      <div id="payment-element" class="mb-4"></div>

      {#if message}
        <div class="mb-4 text-center text-sm font-medium text-red-500">
          {message}
        </div>
      {/if}

      <button
        on:click={handleSubmitPayment}
        disabled={processing || !clientSecret}
        class="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? '处理中...' : '确认支付'}
      </button>
    </div>
  {/if}
</div>
{/if}
