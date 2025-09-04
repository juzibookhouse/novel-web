import { supabase } from "$lib/supabaseClient";

export async function getAuthUser(request:Request) {
  let authorization = request.headers.get('Authorization')?.replace('Bearer ', '');
  let userProfile = {id:'',user_id:'',isAdmin:false,email:''};
  if (!authorization) return userProfile;
  try {
    const {access_token,user} = JSON.parse(authorization);
    if (user?.id) {
      const {data:profile,error} = await supabase.from('user_profiles').select('*').eq('user_id',user.id).single();

      // Fetch active membership
      const now = new Date().toISOString();
      const { data: membership, error: membershipError } = await supabase
        .from("user_memberships")
        .select("id, plan_id, start_date, end_date, status, stripe_client_secret")
        .eq("user_id", user.id)
        .or("status.eq.active,status.eq.pending)")
        .gte("end_date", now)
        .lte("start_date", now)
        .limit(1)
        .single();

      if (profile) {
        userProfile = {
          ...profile,
          isAdmin: profile?.role === 'admin',
          membership: membership || undefined,
          isMembership: membership?.status == "active" && membership?.end_date > new Date().toISOString()
        }
      }
    }
    return userProfile;
  } catch (err) {
    console.error("Parse error ", err)
    return userProfile;
  }
}