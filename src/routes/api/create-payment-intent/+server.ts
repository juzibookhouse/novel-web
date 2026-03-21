import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabase } from '$lib/supabaseClient';
import { STRIPE_SECRET_KEY, HOST_URL } from '$env/static/private';
import { sendEmail } from '$lib/email';
import { WEBSITE_NAME } from '$lib/constants';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST({ request }) {
  try {
    const { planId, stripeClientSecret, paymentMethod, userId } = await request.json();

    const {data: userProfile} = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();

    if (!userProfile) {
      await sendEmail('weisen.li@hotmail.com', `${WEBSITE_NAME} - 支付错误通知`, `${userId} 用户资料未找到，请检查数据库。`);
      return json({ error: 'User profile not found' }, { status: 404 });
    }

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

    // if (userProfile?.role === 'admin') {
    //   amount = 300;
    // }


    const paymentMethodTypes = [paymentMethod]; //card,alipay,wechat_pay

    if (stripeClientSecret) {
      // Extract payment intent ID from client secret
      const paymentIntentId = stripeClientSecret.split('_secret_')[0];

      // Get the existing payment intent to check its status
      const existingIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (existingIntent.status === 'canceled') {
        // Create a new payment intent if the old one is canceled
        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency,
          metadata: { planId },
          payment_method_types: paymentMethodTypes
        });
      } else {
        // Check if there's a payment method attached
        const hasAttachedPaymentMethod = existingIntent.payment_method !== null;

        if (hasAttachedPaymentMethod) {
          // Don't update payment_method_types if a payment method is already attached
          paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
            amount,
            currency,
            metadata: { planId }
          });
        } else {
          // Update existing payment intent with new payment method types
          paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
            amount,
            currency,
            metadata: { planId },
            payment_method_types: paymentMethodTypes
          });
        }
      }
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

    // Send error email to admin
    try {
      const errorHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #B91C1C; text-align: center;">${WEBSITE_NAME}</h1>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca;">
            <h2 style="color: #991b1b;">支付意图创建失败</h2>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #fecaca;">
              <h3 style="margin: 0; color: #991b1b;">错误详情：</h3>
              <p><strong>时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
              <p><strong>错误信息：</strong>${error instanceof Error ? error.message : String(error)}</p>
              <p><strong>错误堆栈：</strong></p>
              <pre style="background-color: #f9fafb; padding: 10px; overflow-x: auto; font-size: 12px;">${error instanceof Error ? error.stack : 'No stack trace'}</pre>
            </div>
            <p style="color: #991b1b;">请及时查看并处理此问题。</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${HOST_URL}"
                 style="background-color: #B91C1C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                登录管理后台
              </a>
            </div>
          </div>
        </div>
      `;

      await sendEmail('weisen.li@hotmail.com', `${WEBSITE_NAME} - 支付错误通知`, errorHtml);
    } catch (emailError) {
      console.error('Failed to send error email:', emailError);
    }

    return json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}