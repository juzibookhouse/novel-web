import { getAuthUser } from "$lib/server/auth";
import { supabase } from "$lib/supabaseClient";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
  try {
    const user = await getAuthUser(event.request);
    
    if (!user?.isAdmin) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }
    const { data: usersData, error: usersError } = await supabase
      .from("user_profiles")
      .select(
        `
        id,
        user_id,
        role,
        created_at,
        user_name,
        ip,
        email,
        user_memberships (
          id,
          status,
          plan_id,
          end_date
        )
      `,
      )
      // .gte("user_memberships.end_date", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;

    return json({users: usersData})
  } catch (error) {
    console.error(error);
    return json({error: ""},{status:500})
  }
};
