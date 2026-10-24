import { verifyRequestIdentity, IdentityVerificationError } from "$lib/server/verifiedIdentity";
import { assertServerAdmin, AdminAuthorizationError } from "$lib/server/adminAuthorization";
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { logError } from "$lib/errorLogger";
import { json, type RequestHandler } from "@sveltejs/kit";
import { WEBSITE_NAME } from "$lib/constants";

class AdminListConfigurationError extends Error {
  constructor() { super('admin_database_unavailable'); }
}

// GET and PATCH: construct this private client only after administrator authorization.
function privateListClient() {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) throw new AdminListConfigurationError();
  let parsed: URL;
  try { parsed = new URL(url); }
  catch { throw new AdminListConfigurationError(); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new AdminListConfigurationError();
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

export const GET: RequestHandler = async (event) => {
  try {
    const identity = await verifyRequestIdentity(event.request);
    assertServerAdmin(identity.id);

    const url = new URL(event.request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const per_page = parseInt(url.searchParams.get('per_page') || '20', 10);
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data: usersData, error: usersError, count } = await privateListClient()
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
    if (error instanceof IdentityVerificationError || error instanceof AdminAuthorizationError) {
      return json({ code: error.code }, { status: error.status });
    }
    if (error instanceof AdminListConfigurationError) {
      return json({ error: error.message, code: error.message }, { status: 503 });
    }
    console.error('GET /api/admin/users:', error);
    await logError(error, { request: event.request }, `${WEBSITE_NAME} - 获取用户列表失败`);
    return json({error: "Failed to fetch users"},{status:500})
  }
};

export const PATCH: RequestHandler = async (event) => {
  try {
    const identity = await verifyRequestIdentity(event.request);
    assertServerAdmin(identity.id);

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

    const { data, error } = await privateListClient()
      .from('user_memberships')
      .update(updateData)
      .eq('id', membershipId)
      .select()
      .single();

    if (error) throw error;

    return json({ success: true, data });
  } catch (error) {
    if (error instanceof IdentityVerificationError || error instanceof AdminAuthorizationError) {
      return json({ code: error.code }, { status: error.status });
    }
    if (error instanceof AdminListConfigurationError) {
      return json({ error: error.message, code: error.message }, { status: 503 });
    }
    console.error('PATCH /api/admin/users:', error);
    await logError(error, { request: event.request }, `${WEBSITE_NAME} - 更新用户会员失败`);
    return json({ error: 'Failed to update membership' }, { status: 500 });
  }
};
