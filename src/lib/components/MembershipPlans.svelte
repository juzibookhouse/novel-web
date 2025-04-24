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
  let card: any;
  let selectedPlan: any = null;

  const stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);

  onMount(async () => {
    stripe = await stripePromise;
    elements = stripe.elements();
    card = elements.create('card');
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

  async function subscribeToPlan(plan: any) {
    try {
      if (!$user) {
        goto('/user/login');
        return;
      }

      processing = true;
      error = null;
      selectedPlan = plan;

      // Mount card element if not already mounted
      if (!card) {
        card = elements.create('card');
      }
      card.mount('#card-element');

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            email: $user.email,
          },
        },
      });

      if (stripeError) throw stripeError;

      // Update user membership
      const { error: subscribeError } = await supabase
        .from('user_memberships')
        .insert([{
          user_id: $user.id,
          plan_id: plan.id,
          status: 'active',
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }]);

      if (subscribeError) throw subscribeError;

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_approved: true })
        .eq('user_id', $user.id);

      if (updateError) throw updateError;

      if (redirectUrl) {
        goto(redirectUrl);
      } else {
        onClose();
      }
    } catch (e: any) {
      error = e.message;
    } finally {
      processing = false;
      selectedPlan = null;
    }
  }

  onMount(() => {
    loadPlans();
  });
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
<div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
        {#each plans as plan}
          <div class="border-2 border-red-100 rounded-lg p-6 hover:border-red-300 transition-colors">
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
            <button
              on:click={() => subscribeToPlan(plan)}
              disabled={processing}
              class="w-full bg-red-800 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors"
            >
              {processing && selectedPlan?.id === plan.id ? '处理中...' : '立即订阅'}
            </button>
            
            <div class="mt-4 {selectedPlan?.id === plan.id ? 'block' : 'hidden'}">
              <div id="card-element" class="p-3 border rounded-md"></div>
            </div>
          </div>
        {/each}
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
  border-color: #4f46e5;
  box-shadow: 0 0 0 1px #4f46e5;
}

:global(.StripeElement--invalid) {
  border-color: #ef4444;
}
</style>