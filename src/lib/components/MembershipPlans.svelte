<script lang="ts">
  import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from "$env/static/public"
  import { supabase, upsertMembership } from '$lib/supabaseClient';
  import { user, setUser } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import { loadStripe } from '@stripe/stripe-js';
  import { onMount } from 'svelte';
    import UserMembershipPlans from "./user/UserMembershipPlans.svelte";
    import { getMemberShipEndDate, getPlanPrice } from "$lib/membership";

  export let onClose = () => {};

  let plans: any[] = [];
  let loading = true;
  let error: string | null = null;
  let processing = false;
  let stripe: any;
  let elements: any;
  let selectedPlan: any = null;
  let paymentError: string | null = null;
  let selectedPaymentMethod = '';
  let showPaymentMethods = false;
  let paymentFormLoaded = false;

  const stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);

  const paymentMethods = [
    { id: 'card', name: '银行卡', icon: '💳' },
    { id: 'alipay', name: '支付宝', icon: '🔵' },
    { id: 'wechat_pay', name: '微信支付', icon: '🟢' }
  ];

  onMount(async () => {
    stripe = await stripePromise;
    loadPlans();
  });

  async function loadPlans() {
    try {
      const { data, error: fetchError } = await supabase
        .from('membership_plans')
        .select('*')
        .order('price');

      if (fetchError) throw fetchError;
      plans = data;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function initializePaymentElement() {
    if (!stripe || !selectedPlan) return;
    paymentFormLoaded = true;

    // Create payment intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        planId: selectedPlan.id, 
        stripeClientSecret: $user?.membership?.stripe_client_secret,
        paymentMethod: selectedPaymentMethod
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const { clientSecret } = await response.json();
    
    const {error: subscribeError} = await upsertMembership({user:$user, selectedPlan, clientSecret});
    if (subscribeError) throw subscribeError;
    setUser($user);

    // Initialize Elements
    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#991b1b',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '8px',
        },
      },
    });

    // Create and mount the Payment Element
    const paymentElement = elements.create('payment', {
      defaultValues: {
        billingDetails: {
          name: `${$user?.profile?.user_name}`,
        }
      },
      paymentMethodTypes: ['card', 'alipay', 'wechat_pay']
    });
    paymentElement.mount('#payment-element');
    paymentFormLoaded = false;
  }

  async function handlePayment() {
    try {
      if (!$user) {
        goto('/user/login');
        return;
      }

      processing = true;
      paymentError = null;

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      });

      if (stripeError) {
        paymentError = stripeError.message;
        return;
      }

      // update existing subscription
      const { error: subscribeError } = await supabase
        .from('user_memberships')
        .update({ 
          status: 'active', 
          end_date: getMemberShipEndDate(selectedPlan.duration)
        }).
        eq('id', $user?.membership?.id);
      
      if (subscribeError) throw subscribeError;
      
      onClose();
    } catch (e: any) {
      paymentError = e.message;
    } finally {
      processing = false;
    }
  }

  async function selectPlan(plan: any) {
    selectedPlan = plan;
    showPaymentMethods = true;
  }

  async function selectPaymentMethod(method: string) {
    selectedPaymentMethod = method;
    await initializePaymentElement();
  }
</script>

<div class="fixed inset-0 top-0 left-0 w-full h-full flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
    <div class="p-6 border-b border-red-100">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-semibold text-gray-900">选择会员计划</h2>
        <button
          on:click={onClose}
          class="text-gray-400 hover:text-gray-500 cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div class="mt-4">会员权益：成为会员后，畅读全平台所有已上线小说，不再另外收费。<br/>

        加入会员须知：本平台内容为原创文学作品，包括成人向题材，会员必须年满18周岁。<br/>
        
        会员服务为数字内容访问权限，开通后即视为服务开始，不支持退款。感谢您的理解和支持。<br/>
        
        支付为第三方安全通道。</div>
    </div>

    {#if error}
      <div class="p-4 bg-red-50 border-b border-red-100">
        <p class="text-sm text-primary">{error}</p>
      </div>
    {/if}

    <div class="p-6">
      {#if loading}
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-6">
          <!-- Plans List -->
          {#if !showPaymentMethods}
            <UserMembershipPlans selectPlan={selectPlan} plans={plans} />

          {:else}
            <!-- Payment Methods -->
            <div class="space-y-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">选择支付方式</h3>
              <div class="grid gap-4">
                {#each paymentMethods as method}
                  <button
                    class="flex items-center p-4 border-2 rounded-lg {selectedPaymentMethod === method.id ? 'border-red-500 bg-red-50' : 'border-gray-200'} hover:border-red-300 transition-all"
                    on:click={() => selectPaymentMethod(method.id)}
                  >
                    <span class="text-2xl mr-3">{method.icon}</span>
                    <span class="text-lg">{method.name}</span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Payment Form -->
            {#if selectedPaymentMethod}
              <div class="border-2 border-red-100 rounded-lg p-6">
                <h3 class="text-xl font-semibold text-gray-900 mb-4">支付信息</h3>
                <div class="mb-6">
                  <p class="text-gray-600">您选择了 <span class="font-semibold">{selectedPlan.name}</span></p>
                  <p class="text-2xl font-bold text-primary mt-2">{getPlanPrice(selectedPlan)}</p>
                </div>

                {#if paymentError}
                  <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-sm text-primary">{paymentError}</p>
                  </div>
                {/if}

                <div id="payment-element" class="mb-6"></div>

                {#if !paymentFormLoaded}
                <button
                  on:click={handlePayment}
                  disabled={processing}
                  class="w-full bg-[#FEF9D5] text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
                >
                  {processing ? '处理中...' : '确认支付'}
                </button>
                {:else}
                <div>加载中</div>
                {/if}
              </div>
            {/if}


          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
:global(.StripeElement) {
  background-color: white;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

:global(.StripeElement--focus) {
  border-color: #991b1b;
  box-shadow: 0 0 0 1px #991b1b;
}

:global(.StripeElement--invalid) {
  border-color: #ef4444;
}
</style>