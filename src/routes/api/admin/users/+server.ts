import { getAuthUser } from "$lib/server/auth";
import { supabase } from "$lib/supabaseClient";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
  try {
    const user = await getAuthUser(event.request);

    if (!user?.isAdmin) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    const url = new URL(event.request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const per_page = parseInt(url.searchParams.get('per_page') || '20', 10);
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data: usersData, error: usersError, count } = await supabase
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
        { count: 'exact' }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (usersError) throw usersError;

    const totalPages = Math.ceil((count || 0) / per_page);

    return json({
      users: usersData,
      pagination: {
        page,
        per_page,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error(error);
    return json({error: "Failed to fetch users"},{status:500})
  }
};
