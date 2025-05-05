export const getMemberShipEndDate = (duration: number) => {
  const membershipEndDate = new Date();
  membershipEndDate.setMonth(membershipEndDate.getMonth() + duration);
  return membershipEndDate
}

export const getPlanPrice = (plan) => {
  return `$${plan?.price} 或者 ¥${plan?.price_cn}/月`
}