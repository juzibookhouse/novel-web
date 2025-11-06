import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';
import { sendRequest } from '$lib/api';

export type PaymentMethod = 'card' | 'alipay' | 'wechat_pay';

let stripeInstance: Stripe | null = null;

export async function initializeStripe(): Promise<Stripe | null> {
  if (!stripeInstance) {
    stripeInstance = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripeInstance;
}

export async function createPaymentIntent(
  giftId: string,
  paymentMethod: PaymentMethod,
  existingClientSecret?: string
): Promise<string> {
  try {
    const { data, error } = await sendRequest('/api/gift-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        gift_id: giftId,
        payment_method: paymentMethod,
        stripeClientSecret: existingClientSecret
      })
    });

    if (error) {
      console.error('Failed to create payment intent:', error);
      return '';
    }

    return data.clientSecret;
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    return '';
  }
}

export function createStripeElements(
  stripe: Stripe,
  clientSecret: string
): StripeElements {
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3b82f6',
    }
  };

  return stripe.elements({ clientSecret, appearance });
}

export async function mountPaymentElement(
  elements: StripeElements,
  containerId: string = 'payment-element'
): Promise<void> {
  const paymentElement = elements.create('payment', { layout: 'tabs' });

  return new Promise((resolve) => {
    setTimeout(() => {
      const container = document.getElementById(containerId);
      if (container) {
        paymentElement.mount(`#${containerId}`);
      }
      resolve();
    }, 100);
  });
}
