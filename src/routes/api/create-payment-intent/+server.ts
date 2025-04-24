import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabase } from '$lib/supabaseClient';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST({ request }) {
  try {
    const { planId } = await request.json();

    // Get plan details from Supabase
    const { data: plan } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return json({ error: 'Plan not found' }, { status: 404 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        planId,
      },
    });

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}