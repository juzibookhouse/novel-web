import { error, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { getMemberShipEndDate } from '$lib/membership';

export const load = async ({ url }) => {
    const user_membership_id = url.searchParams.get('user_membership_id');
    const previous_url = url.searchParams.get('previous_url');
    
    if (!user_membership_id) {
        throw error(400, '缺少必要参数');
    }

    // 获取pending状态的user_membership
    const { data: userMembership, error: userMembershipError } = await supabase
        .from('user_memberships')
        .select('*, membership_plans(*)')
        .eq('id', user_membership_id)
        .eq('status', 'pending')
        .single();

    if (userMembershipError || !userMembership) {
        throw error(404, '未找到待支付的会员记录');
    }

    const duration = userMembership.membership_plans.duration;
    const endDate = getMemberShipEndDate(duration);

    // 更新user_membership状态
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