<script lang="ts">
  import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from "$env/static/public"
  import { supabase } from '$lib/supabaseClient';
  import { user } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import { loadStripe } from '@stripe/stripe-js';
  import { onMount } from 'svelte';

  export let onClose = () => {};
  export let redirectUrl: string | null = null;

  let plans: any[] = [];
  let loading = true;
  let error: string | null = null;
  let processing = false;
  let stripe: any;
  let elements: any;
  let selectedPlan: any = null;
  let paymentError: string | null = null;

  const stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);

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

    // Create payment intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId: selectedPlan.id }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const { clientSecret } = await response.json();

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
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
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

      // Update user membership
      const { error: subscribeError } = await supabase
        .from('user_memberships')
        .insert([{
          user_id: $user.id,
          plan_id: selectedPlan.id,
          status: 'active',
          end_date: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000)
        }]);

      if (subscribeError) throw subscribeError;

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_approved: true })
        .eq('user_id', $user.id);

      if (updateError) throw updateError;

      onClose();
    } catch (e: any) {
      paymentError = e.message;
    } finally {
      processing = false;
    }
  }

  async function selectPlan(plan: any) {
    selectedPlan = plan;
    await initializePaymentElement();
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
    <div class="p-6 border-b border-red-100">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-semibold text-gray-900">选择会员计划</h2>
        <button
          on:click={onClose}
          class="text-gray-400 hover:text-gray-500"
        >
          ✕
        </button>
      </div>
    </div>

    {#if error}
      <div class="p-4 bg-red-50 border-b border-red-100">
        <p class="text-sm text-red-800">{error}</p>
      </div>
    {/if}

    <div class="p-6">
      {#if loading}
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
        </div>
      {:else}
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Plans List -->
          <div class="space-y-6">
            {#each plans as plan}
              <div 
                class="border-2 {selectedPlan?.id === plan.id ? 'border-red-500' : 'border-red-100'} 
                       rounded-lg p-6 hover:border-red-300 transition-colors cursor-pointer"
                on:click={() => selectPlan(plan)}
              >
                <h3 class="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div class="text-3xl font-bold text-red-800 mb-4">
                  ¥{plan.price}<span class="text-base font-normal text-gray-600">/月</span>
                </div>
                <p class="text-gray-600 mb-4">{plan.description}</p>
                <ul class="space-y-2 mb-6">
                  {#each plan.features as feature}
                    <li class="flex items-center text-gray-700">
                      <span class="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>

          <!-- Payment Form -->
          {#if selectedPlan}
            <div class="border-2 border-red-100 rounded-lg p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">支付信息</h3>
              <div class="mb-6">
                <p class="text-gray-600">您选择了 <span class="font-semibold">{selectedPlan.name}</span></p>
                <p class="text-2xl font-bold text-red-800 mt-2">¥{selectedPlan.price}/月</p>
              </div>

              {#if paymentError}
                <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p class="text-sm text-red-800">{paymentError}</p>
                </div>
              {/if}

              <div id="payment-element" class="mb-6"></div>

              <button
                on:click={handlePayment}
                disabled={processing}
                class="w-full bg-red-800 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
              >
                {processing ? '处理中...' : '确认支付'}
              </button>
            </div>
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