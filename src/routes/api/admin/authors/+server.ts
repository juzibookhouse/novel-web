import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { verifyRequestIdentity, IdentityVerificationError } from '$lib/server/verifiedIdentity';
import { assertServerAdmin, AdminAuthorizationError } from '$lib/server/adminAuthorization';

// Same server-private configuration and client options as the admin users route.
// Its private factory is deliberately not exported from an API or browser module.
function privateClient() {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error('database_unavailable');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('database_unavailable');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function failure(error: unknown) {
  if (error instanceof IdentityVerificationError || error instanceof AdminAuthorizationError) {
    return json({ code: error.code }, { status: error.status });
  }
  return json({ code: 'author_review_unavailable' }, { status: 503 });
}

export const GET: RequestHandler = async ({ request }) => {
  try {
    const identity = await verifyRequestIdentity(request);
    assertServerAdmin(identity.id);
    const { data, error } = await privateClient().from('user_profiles').select(`
      id,user_name,email,created_at,is_approved,
      published_website,published_pen_name,published_work_title,planned_work_description,draft_file_path,
      novels(id,reading_records(reading_time))
    `).eq('role', 'author');
    if (error || !Array.isArray(data)) throw new Error('database_failed');
    const authors = data.map(({ novels, ...profile }) => ({
      ...profile,
      novelCount: novels?.length || 0,
      novelReadingTime: (novels || []).reduce((total: number, novel: any) =>
        total + (novel.reading_records || []).reduce((sum: number, record: any) => sum + (record.reading_time || 0), 0), 0)
    }));
    return json({ authors }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const identity = await verifyRequestIdentity(request);
    assertServerAdmin(identity.id);
    let body;
    try { body = await request.json(); }
    catch { return json({ code: 'author_review_invalid' }, { status: 400 }); }
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).length !== 3 || Object.keys(body).some(key => !['profileId', 'is_approved', 'expected_is_approved'].includes(key)) ||
        typeof body.profileId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.profileId) ||
        typeof body.is_approved !== 'boolean' || typeof body.expected_is_approved !== 'boolean' ||
        body.is_approved === body.expected_is_approved) {
      return json({ code: 'author_review_invalid' }, { status: 400 });
    }
    const client = privateClient();
    const { data: target, error: readError } = await client.from('user_profiles')
      .select('id,role,is_approved').eq('id', body.profileId).maybeSingle();
    if (readError) throw new Error('database_failed');
    if (!target) return json({ code: 'author_not_found' }, { status: 404 });
    if (target.role !== 'author' || target.is_approved !== body.expected_is_approved) {
      return json({ code: 'author_review_conflict' }, { status: 409 });
    }
    // Conditional UPDATE, not an unconditional write after the read. Never modify
    // role, account ownership, application text or any other profile fields.
    const { data, error } = await client.from('user_profiles')
      .update({ is_approved: body.is_approved }).eq('id', body.profileId)
      .eq('role', 'author').eq('is_approved', body.expected_is_approved).select('id,is_approved');
    if (error || !Array.isArray(data)) throw new Error('database_failed');
    if (data.length !== 1) return json({ code: 'author_review_conflict' }, { status: 409 });
    return json({ success: true, author: data[0] });
  } catch (error) { return failure(error); }
};
