interface UserMembership {
  status: string;
  end_date: string;
}

interface User {
  first_name: string;
  last_name: string;
  user_memberships: UserMembership[]
}


export const isValidMembership = (user:User) => {
  return user.user_memberships.length > 0;
}

export const getUserDateFormat = (date:string) => {
  return new Date(date).toLocaleDateString('zh-CN');
}

export const getUserMembershipDate = (user:User) => {
  const memberships = user.user_memberships;
  if (memberships.length === 0) return '';
  return getUserDateFormat(memberships[0].end_date);
}