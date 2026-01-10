import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function checkPaymentIntentFromClientSecret(clientSecret: string) {
  if (!clientSecret) return { ok: false, error: 'no_client_secret' };
  const parts = clientSecret.split('_secret_');
  const paymentIntentId = parts[0];
  if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
    return { ok: false, error: 'invalid_client_secret' };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paid = paymentIntent && paymentIntent.status === 'succeeded';
    return { ok: true, paymentIntent, paid };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}
