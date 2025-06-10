interface UserMembership {
  status: string;
  end_date: string;
}

interface User {
  first_name: string;
  last_name: string;
  user_memberships: UserMembership[]
}


export const getUserMembership = (user:User) => {
  const userMemberships = user?.user_memberships;
  if (!userMemberships || userMemberships.length === 0) return '会员';
  return (userMemberships[0].status === 'active') ? 'VIP': '会员';
}

export const getUserDateFormat = (date:string) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  return new Date(date).toLocaleDateString('zh-CN',options);
}

export const getUserMembershipDate = (user:User) => {
  const memberships = user.user_memberships;
  if (memberships.length === 0) return '';
  return getUserDateFormat(memberships[0].end_date);
}