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

  onMount(async () => {
    const { data,error } = await sendRequest(`/api/novels/${novelId}/chapters/${chapterId}/gifts`);
    if (error) {
      message = error.toString();
    }
    if (data.gifts) {
      gifts = data.gifts;
    }
    if (data.chapterGifts) {
      chapterGifts = data.chapterGifts;
    }
    stripe = await initializeStripe();


    const { data:{gift, stripe_client_secret,payment_method}} = await sendRequest(`/api/novels/${novelId}/chapters/${chapterId}/gift`);
    if (gift) {
      selectedGift = gift;
      clientSecret = stripe_client_secret;
      paymentMethod = payment_method;
      showPaymentForm = true;
      await loadPaymentForm();
    }

  });

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

  async function loadPaymentForm() {
    if (!selectedGift || !stripe) return;

    try {
      const newClientSecret = await createPaymentIntent(
        selectedGift.id,
        paymentMethod,
        clientSecret
      );

      if (newClientSecret) {
        clientSecret = newClientSecret;

        const {data} = await sendRequest(`/api/novels/${novelId}/chapters/${chapterId}/gifts`,{
          method:'POST',
          body:JSON.stringify({
            gift_id:selectedGift.id,
            stripe_client_secret:clientSecret,
            payment_method:paymentMethod
          })
        });

        console.log(data);

        // if (elements) {
        //   elements.destroy();
        // }

        elements = createStripeElements(stripe, clientSecret);
        await mountPaymentElement(elements);
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
      const paymentOption = {
        elements,
        redirect: "if_required",
      };
      if (paymentMethod === 'alipay') {
        // paymentOption.confirmParams = {
        //   return_url: window.location.origin + `/payment-confirm?user_membership_id=${$user?.membership?.id}&previous_url=${window.location.href}`
        // }
      }
      const { error } = await stripe.confirmPayment(paymentOption)

      if (error) {
        message = error.message || "支付失败，请重试";
      } else {
        const {data:{msg, error}} = await sendRequest(`/api/novels/${novelId}/chapters/${chapterId}/gifts`, {
          method:'POST',
          body:JSON.stringify({
            gift_id:selectedGift.id, 
            stripe_client_secret:clientSecret,
            payment_method:paymentMethod})
          })
        clientSecret = ''
        showPaymentForm = false;
        selectedGift = null;
        message = msg;
      }
    } catch (error) {
      message = "支付失败，请重试";
    } finally {
      processing = false;
    }
  }

  function handleCancelPayment() {
    showPaymentForm = false;
    selectedGift = null;
    if (elements) {
      // elements.destroy();
      elements = null;
    }
    message = "";
  }
</script>

{#if $user}
<div class="bg-gray-50 p-6 rounded-xl shadow-sm mx-auto max-w-md">
  {#if chapterGifts.length > 0}
    <div class="mb-4">
      <h3 class="text-lg font-medium mb-2 text-gray-700">已收到的打赏</h3>
      <div class="flex space-x-1 overflow-x-auto pb-1">
        {#each chapterGifts as gift}
          <div class="text-3xl mb-1">{gift.image}</div>
        {/each}
      </div>
    </div>
  {/if}
  {#if !showPaymentForm}
    <GiftSelectors
      {gifts}
      onSelectGift={handleSelectGift}
      disabled={processing}
    />

    {#if message}
      <div class="mt-3 text-center text-sm text-gray-600">
        {message}
      </div>
    {/if}
  {:else if selectedGift}
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
  {/if}
</div>
{/if}
