import type { MembershipPlan } from "./types/membership";

export const getMemberShipEndDate = (duration: number) => {
  const membershipEndDate = new Date();
  membershipEndDate.setMonth(membershipEndDate.getMonth() + duration);
  return membershipEndDate;
}

export const getPlanPrice = (plan:MembershipPlan, selectedPaymentMethod='') => {
  const price = plan.price;
  const price_cn = plan.price_cn;
  if (!selectedPaymentMethod) return `US $${price} 或者 ¥${price_cn}`;
  const PAYMENT_MAPS:{[key:string]:string} = {
    'alipay': `¥${price_cn}`,
    'wechat_pay': `¥${price_cn}`,
    'card': `US $${price}`
  };
  return PAYMENT_MAPS[selectedPaymentMethod];
}