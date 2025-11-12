import type { MembershipPlan } from "./types/membership";

export const getMemberShipEndDate = (duration: number) => {
  const membershipEndDate = new Date();
  membershipEndDate.setMonth(membershipEndDate.getMonth() + duration);
  return membershipEndDate;
}

interface GetPlanPriceParams {
  plan: MembershipPlan;
  payment_method?: string;
  isOldPrice?: boolean;
}

export const getPlanPrice = ({plan, payment_method='',isOldPrice}:GetPlanPriceParams) => {
  const price = isOldPrice ? plan.old_price : plan.price;
  const price_cn = isOldPrice ? plan.old_price_cn : plan.price_cn;
  if (!payment_method) return `US $${price} 或者 ¥${price_cn}`;
  const PAYMENT_MAPS:{[key:string]:string} = {
    'alipay': `¥${price_cn}`,
    'wechat_pay': `¥${price_cn}`,
    'card': `US $${price}`
  };
  return PAYMENT_MAPS[payment_method];
}