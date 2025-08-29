import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabase } from '$lib/supabaseClient';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST({ request }) {
  try {
    const { planId, stripeClientSecret, paymentMethod, userId } = await request.json();

    const {data: userProfile} = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();

    // Get plan details from Supabase
    const { data: plan } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return json({ error: 'Plan not found' }, { status: 404 });
    }

    let paymentIntent;
    let amount = plan.price * 100; // Convert to cents
    let currency = 'usd';
    if (paymentMethod != 'card') {
      amount = plan.price_cn * 100;
      currency = 'cny';
    }

    if (userProfile.role === 'admin') {
      amount = 1000;
    }


    const paymentMethodTypes = [paymentMethod]; //card,alipay,wechat_pay

    if (stripeClientSecret) {
      // Extract payment intent ID from client secret
      const paymentIntentId = stripeClientSecret.split('_secret_')[0];

      // Update existing payment intent
      paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
        amount,
        currency,
        metadata: { planId },
        payment_method_types: paymentMethodTypes
      });
    } else {
      // Create payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: { planId },
        payment_method_types: paymentMethodTypes
      });
    }

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}