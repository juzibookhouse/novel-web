import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabase } from '$lib/supabaseClient';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { logError } from '$lib/errorLogger';
import { WEBSITE_NAME } from '$lib/constants';

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST({ request }:{request:Request}) {
  try {
    const { planId, stripeClientSecret, paymentMethod, userId } = await request.json();

    const {data: userProfile} = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();

    if (!userProfile) {
      await logError(new Error('User profile not found'), {
        request,
        userId,
        planId,
        additionalInfo: { reason: '用户资料未找到，请检查数据库' }
      }, `${WEBSITE_NAME} - 用户资料未找到`);
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
    const metadata = {
      planId,
      userId,
      email: userProfile.email
    }

    if (stripeClientSecret) {
      const paymentIntentId = stripeClientSecret.split('_secret_')[0];
      const existingIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      const shouldCreateNewIntent =
        existingIntent.status === 'canceled' ||
        existingIntent.currency !== currency ||
        (existingIntent.payment_method === null && !existingIntent.payment_method_types?.includes(paymentMethod));

      if (shouldCreateNewIntent) {
        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency,
          metadata,
          payment_method_types: paymentMethodTypes
        });
      } else if (existingIntent.payment_method) {
        paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
          amount,
          metadata
        });
      } else {
        paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
          amount,
          currency,
          metadata,
          payment_method_types: paymentMethodTypes
        });
      }
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        payment_method_types: paymentMethodTypes
      });
    }

    const {error:updateMembershipPlanError,data:updateMembershipPlanData} = await supabase.from('user_memberships').update({plan_id: planId}).eq('stripe_client_secret',paymentIntent.client_secret).eq('user_id',userId);
    if (updateMembershipPlanError) {
      await logError(updateMembershipPlanError, {
        userId,
        planId,
        additionalInfo: {
          stripe_client_secret: paymentIntent.client_secret,
          operation: 'update user_memberships plan_id'
        }
      }, `${WEBSITE_NAME} - 更新会员计划失败`);
      console.error(`Update membership error:`, updateMembershipPlanError)
    }

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    await logError(error, { request }, `${WEBSITE_NAME} - 支付意图创建失败`);
    return json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}