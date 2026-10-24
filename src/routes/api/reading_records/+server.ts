import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { verifyRequestIdentity, IdentityVerificationError } from "$lib/server/verifiedIdentity";
import { assertServerAdmin, AdminAuthorizationError } from "$lib/server/adminAuthorization";
import { logError } from "$lib/errorLogger";
import { WEBSITE_NAME } from "$lib/constants";

// Same server-private configuration and client options as admin/authors.
// Construct only after verified identity and private allowlist authorization.
function privateClient() {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error('database_unavailable');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('database_unavailable');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

export const GET: RequestHandler = async ({ url, request }) => {
  const month = url.searchParams.get("month");
  const filter = url.searchParams.get("filter");

  if (!month || !filter) {
    return json({ error: "Missing required parameters: month and filter" }, { status: 400 });
  }

  try {
    const user = await verifyRequestIdentity(request);
    assertServerAdmin(user.id);
    const startDate = new Date(month + "-01");
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    let query = privateClient()
      .from('reading_records')
      .select(`
        id,
        reading_time,
        user_profiles (
          id,
          user_name
        ),
        novels (
          id,
          title,
          user_id,
          user_profiles (
            id,
            user_name
          )
        )
      `)
      .eq('date', month);

    const { data, error } = await query;

    if (error) throw error;

    // 根据选择的过滤方式处理数据
    const aggregatedData = new Map();

    data.forEach((record: any) => {
      let key, displayName;
      
      if (filter === 'user') {
        key = record.user_profiles.id;
        displayName = record.user_profiles.user_name;
      } else if (filter === 'novel') {
        key = record.novels.id;
        displayName = record.novels.title;
      } else if (filter === 'author') {
        key = record.novels.user_id;
        displayName = record.novels.user_profiles.pen_name || record.novels.user_profiles.user_name;
      }
      
      if (!aggregatedData.has(key)) {
        aggregatedData.set(key, {
          name: displayName,
          totalTime: 0,
        });
      }

      const entry = aggregatedData.get(key);
      entry.totalTime += record.reading_time;
    });

    const result = Array.from(aggregatedData.values())
      .sort((a, b) => b.totalTime - a.totalTime);

    return json(result);
  } catch (e: any) {
    if (e instanceof IdentityVerificationError || e instanceof AdminAuthorizationError) {
      return json({ error: e.code, code: e.code }, { status: e.status });
    }
    console.error('GET /api/reading_records:', e);
    await logError(e, { request }, `${WEBSITE_NAME} - 获取阅读记录失败`);
    return json({ error: e.message }, { status: 500 });
  }
};
