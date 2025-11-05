<script lang="ts">
  import { sendRequest } from "$lib/api";
  import { user } from "$lib/stores/authStore";
  import type { Gift } from "$lib/types/gift";
  import { onMount } from "svelte";
  import type { Stripe, StripeElements } from '@stripe/stripe-js';
  import GiftSelectors from "$lib/components/gifts/GiftSelectors.svelte";
  import GiftPaymentForm from "$lib/components/gifts/GiftPaymentForm.svelte";
  import {
    initializeStripe,
    createPaymentIntent,
    createStripeElements,
    mountPaymentElement,
    type PaymentMethod
  } from "$lib/utils/stripePayment";
  import ReceivedGifts from "./ReceivedGifts.svelte";

  export let chapterId: string;
  export let novelId: string;

  let message = "";
  let gifts: Gift[] = [];
  let chapterGifts: Gift[] = [];
  let selectedGift: Gift | null = null;
  let showPaymentForm = false;
  let paymentMethod: PaymentMethod = 'card';
  let clientSecret = '';
  let stripe: Stripe | null = null;
  let elements: StripeElements | null = null;
  let processing = false;

  const fetchChapterGifts = async () => {
    const { data, error } = await sendRequest(`/api/novels/${novelId}/chapters/${chapterId}/gifts`);
    if (error) {
      message = error.toString();
    }
    if (data?.gifts) gifts = data.gifts;
    if (data?.chapterGifts) chapterGifts = data.chapterGifts;

    stripe = await initializeStripe();

    // check if there's an in-progress gift payment
    const res = await sendRequest(`/api/novels/${novelId}/chapters/${chapterId}/gift`);
    const payload = res?.data || {};
    if (payload.gift) {
      selectedGift = payload.gift;
      clientSecret = payload.stripe_client_secret || '';
      paymentMethod = payload.payment_method || 'card';
      showPaymentForm = true;
      await loadPaymentForm();
    }
  };

  // keep behavior: load gifts and optionally pending gift payment
  onMount(async () => {
    // Check for payment intent client secret in query string
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
    const redirect_status = urlParams.get('redirect_status');
    const source_type = urlParams.get('source_type') || 'card';
    
    if (paymentIntentClientSecret && redirect_status === 'succeeded') {
      console.log('Found payment intent client secret:', paymentIntentClientSecret);
      
      clientSecret = paymentIntentClientSecret;
      paymentMethod = source_type;
      showPaymentForm = false;
      await saveChapterGift();
      message = '感谢你的打赏！';
      const paymentElement = document.getElementById('payment-element');
      if (paymentElement) {
        paymentElement.scrollIntoView({ behavior: 'smooth' });
      }
      clientSecret = '';
      paymentMethod = 'card';
    }
    
    await fetchChapterGifts();
  });

  $: {
    if (chapterId) {
      clientSecret = ''
      paymentMethod = 'card';
      showPaymentForm = false;
      message = '';
      fetchChapterGifts();
    }
  }

  async function handleSelectGift(gift: Gift) {
    selectedGift = gift;
    showPaymentForm = true;
    paymentMethod = 'card';
    await loadPaymentForm();
  }

  async function handleChangePaymentMethod(method: PaymentMethod) {
    paymentMethod = method;
    await loadPaymentForm();
  }

  async function saveChapterGift() {
    return await sendRequest(`/api/novels/${novelId}/chapters/${chapterId}/gifts`, {
      method: 'POST',
      body: JSON.stringify({
        gift_id: selectedGift?.id,
        stripe_client_secret: clientSecret,
        payment_method: paymentMethod
      })
    });
  }

  async function loadPaymentForm() {
    if (!selectedGift?.id || !stripe) return;

    try {
      const newClientSecret = await createPaymentIntent(selectedGift.id, paymentMethod, clientSecret);
      if (!newClientSecret) return;
      clientSecret = newClientSecret;

      await saveChapterGift();

      elements = createStripeElements(stripe, clientSecret);
      await mountPaymentElement(elements);
    } catch (e) {
      message = "加载支付表单失败";
    }
  }

  async function handleSubmitPayment() {
    if (!stripe || !elements || !selectedGift) return;

    processing = true;
    message = "";

    try {
      const paymentOption: any = { elements, redirect: 'if_required' };
      // Alipay requires a return_url when confirming the PaymentIntent
      if (paymentMethod === 'alipay' || paymentMethod === 'wechat_pay') {
        // Use a payment confirmation route in the app so the server/client can finalize state
        paymentOption.confirmParams = {
          return_url: `${location.href}`
        };
      }

      const result = await stripe.confirmPayment(paymentOption);

      if (result?.error) {
        message = result.error.message || "支付失败，请重试";
      } else {
        const response = await saveChapterGift();
        clientSecret = '';
        showPaymentForm = false;
        selectedGift = null;
        message = response?.data?.msg || '感谢你的打赏！';
      }
    } catch (err) {
      message = "支付失败，请重试";
    } finally {
      processing = false;
    }
  }

  function handleCancelPayment() {
    showPaymentForm = false;
    selectedGift = null;
    elements = null;
    message = "";
  }
</script>

{#if $user}
  <div class="max-w-xl mx-auto bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-gray-100">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">支持作者 · 打赏章节</h3>
        <p class="mt-1 text-sm text-gray-500">选择一个礼物来表达你的支持。</p>
      </div>
      <div class="text-sm text-gray-400">{chapterGifts?.length || 0} 收到</div>
    </div>

    <div class="mt-4 space-y-4">
      <ReceivedGifts {chapterGifts} />

      {#if !showPaymentForm}
        <GiftSelectors
          {gifts}
          onSelectGift={handleSelectGift}
          disabled={processing}
        />

        {#if message}
          <div class="mt-2 text-center text-sm text-rose-600">{message}</div>
        {/if}
      {:else if selectedGift}
        <div class="mt-2">
          <GiftPaymentForm
            gift={selectedGift}
            {paymentMethod}
            {processing}
            {clientSecret}
            {message}
            onCancel={handleCancelPayment}
            onChangeMethod={handleChangePaymentMethod}
            onSubmit={handleSubmitPayment}
          />
        </div>
      {/if}
    </div>
  </div>
{/if}
