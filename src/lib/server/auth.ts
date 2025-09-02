import { supabase } from "$lib/supabaseClient";

export async function getAuthUser(request:Request) {
  const authorization = request.headers.get('Authorization');
  let userProfile = {id:'',user_id:'',isAdmin:false,email:''};
  if (!authorization) return userProfile;
  try {
    const {access_token,user} = JSON.parse(authorization);
    if (user?.id) {
      const {data:profile,error} = await supabase.from('user_profiles').select('*').eq('user_id',user.id).single();
      if (profile) {
        userProfile = {
          ...profile,
          isAdmin: profile?.role === 'admin',
          name: `${profile.first_name} ${profile.last_name}`,
          initial: `${profile.first_name[0]}`,
        }
      }
    }
    return userProfile;
  } catch (err) {
    console.error("Parse error ", err)
    return userProfile;
  }
}