import { getAuthUser } from "$lib/server/auth";
import { supabase } from "$lib/supabaseClient";
import { logError } from "$lib/errorLogger";
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
    await logError(error, 'GET /api/admin/users', 'Error fetching admin users');
    return json({error: "Failed to fetch users"},{status:500})
  }
};

export const PATCH: RequestHandler = async (event) => {
  try {
    const user = await getAuthUser(event.request);

    if (!user?.isAdmin) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await event.request.json();
    const { membershipId, status, endDate } = body;

    if (!membershipId) {
      return json({ error: 'membershipId is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (endDate !== undefined) {
      updateData.end_date = endDate;
    }

    const { data, error } = await supabase
      .from('user_memberships')
      .update(updateData)
      .eq('id', membershipId)
      .select()
      .single();

    if (error) throw error;

    return json({ success: true, data });
  } catch (error) {
    await logError(error, 'PATCH /api/admin/users', 'Error updating user membership');
    return json({ error: 'Failed to update membership' }, { status: 500 });
  }
};
