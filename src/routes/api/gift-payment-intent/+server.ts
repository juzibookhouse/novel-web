import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabase } from '$lib/supabaseClient';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { getAuthUser } from '$lib/server/auth.js';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST({ request }) {
  try {
    const { gift_id, stripeClientSecret, payment_method } = await request.json();

    const user = await getAuthUser(request);
    if (!user.user_id) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    const {data: userProfile} = await supabase.from('user_profiles').select('*').eq('user_id', user.user_id).single();

    // Get gift details from Supabase
    const { data: gift } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', gift_id)
      .single();

    if (!gift) {
      return json({ error: 'gift not found' }, { status: 404 });
    }

    let paymentIntent;
    let amount = gift.price * 100; // Convert to cents
    let currency = 'usd';
    if (payment_method != 'card') {
      amount = gift.price_cn * 100;
      currency = 'cny';
    }

    if (userProfile.role === 'admin') {
      amount = 300;
    }


    const paymentMethodTypes = [payment_method]; //card,alipay,wechat_pay

    const paymentOption = {
        amount,
        currency,
        metadata: { gift_id },
        payment_method_types: paymentMethodTypes
      }

    if (stripeClientSecret) {
      // Extract payment intent ID from client secret
      const paymentIntentId = stripeClientSecret.split('_secret_')[0];

      // Update existing payment intent
      paymentIntent = await stripe.paymentIntents.update(paymentIntentId, paymentOption);
    } else {
      // Create payment intent
      paymentIntent = await stripe.paymentIntents.create(paymentOption);
    }

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}