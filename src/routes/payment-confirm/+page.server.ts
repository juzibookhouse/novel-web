import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { getMemberShipEndDate } from '$lib/membership';
import { checkPaymentIntentFromClientSecret } from '$lib/server/stripe';
import { sendPaymentConfirmationEmail } from '$lib/email';

export const load = async ({ url }) => {
    const user_membership_id = url.searchParams.get('user_membership_id');
    const previous_url = url.searchParams.get('previous_url');
    
    if (!user_membership_id) {
        throw error(400, '缺少必要参数');
    }

    // Fetch membership
    const { data: userMembership, error: userMembershipError } = await supabase
        .from('user_memberships')
        .select('*, membership_plans(*)')
        .eq('id', user_membership_id)
        .single();

    if (userMembershipError || !userMembership) {
        console.error(userMembershipError);
        throw error(404, '未找到会员记录');
    }

    const stripeClientSecret = userMembership.stripe_client_secret;
    const check = await checkPaymentIntentFromClientSecret(stripeClientSecret);
    if (!check.paid) {
        console.error('Failed to retrieve payment intent:', check.error);
        throw error(500, '查询支付状态失败');
    }

    if (!check.paid) {
        throw error(400, '支付未完成');
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
        throw error(500, '更新会员状态失败');
    }

    return {
        success: true,
        previous_url,
        plan_name: userMembership.membership_plans.name
    };
};