export const getMemberShipEndDate = (duration: number) => {
  const membershipEndDate = new Date();
  membershipEndDate.setMonth(membershipEndDate.getMonth() + duration);
  return membershipEndDate;
}

export const getPlanPrice = (plan, selectedPaymentMethod='') => {
  if (!selectedPaymentMethod) return `US $${plan?.price} 或者 ¥${plan?.price_cn}`;
  const PAYMENT_MAPS:{[key:string]:string} = {
    'alipay': `¥${plan?.price_cn}`,
    'wechat_pay': `¥${plan?.price_cn}`,
    'card': `US $${plan?.price}`
  };
  return PAYMENT_MAPS[selectedPaymentMethod];
}