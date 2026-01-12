import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { checkPaymentIntentFromClientSecret } from '$lib/server/stripe';
import { getMemberShipEndDate } from '$lib/membership';
import { sendAdminEmail, sendPaymentConfirmationEmail } from '$lib/email';

export async function POST({ request }) {
  try {
    const { user_membership_id } = await request.json();

    if (!user_membership_id) {
      return json({ error: 'Missing user_membership_id' }, { status: 400 });
    }

    // Fetch pending membership record
    const { data: userMembership, error: userMembershipError } = await supabase
      .from('user_memberships')
      .select('*, membership_plans(*)')
      .eq('id', user_membership_id)
      .single();

    if (userMembershipError || !userMembership) {
      console.error(userMembershipError);
      return json({ error: 'Membership not found' }, { status: 404 });
    }

    const stripeClientSecret = userMembership.stripe_client_secret;
    if (!stripeClientSecret) {
      return json({ error: 'No stripe client secret for this membership' }, { status: 400 });
    }

    // Use shared helper to check payment status
    const check = await checkPaymentIntentFromClientSecret(stripeClientSecret);
    if (!check.paid) {
      console.error('Payment intent retrieval error:', check.error);
      return json({ error: 'Failed to retrieve payment intent', details: check.error }, { status: 500 });
    }

    // Activate membership and set end date
    const duration = userMembership.membership_plans.duration;
    const endDate = getMemberShipEndDate(duration);

    const { error: updateError } = await supabase
      .from('user_memberships')
      .update({
        status: 'active',
        end_date: endDate.toISOString()
      })
      .eq('id', user_membership_id);

    if (updateError) {
      console.error(updateError);
      return json({ error: 'Failed to update membership' }, { status: 500 });
    }

    // Fetch user profile for email
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userMembership.user_id)
      .single();

    const userForEmail = {
      email: userProfile?.email || null,
      profile: userProfile || {},
      membership: { end_date: endDate.toISOString() }
    };

    const amount = check.paymentIntent?.currency === 'cny' ? `¥${userMembership.membership_plans.price_cn}` : `$${userMembership.membership_plans.price}`;

    try {
      if (userForEmail.email) {
        await sendPaymentConfirmationEmail(userForEmail, userMembership.membership_plans, amount);
      } else {
        console.warn('User email not found; skipping confirmation email');
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // do not fail the whole request on email error
    }

    await sendAdminEmail('new_subscription', {
      username: userProfile?.user_name,
      email: userProfile?.email,
      subject: '新会员订阅通知',
      message: `用户 ${userProfile?.user_name} (${userProfile?.email}) 订阅了 ${userMembership.membership_plans.name} 计划。`
    });

    return json({ success: true, plan_name: userMembership.membership_plans.name });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}