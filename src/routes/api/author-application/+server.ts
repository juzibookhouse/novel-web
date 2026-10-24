import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { verifyRequestIdentity, IdentityVerificationError } from '$lib/server/verifiedIdentity';
import { assertServerAdmin, AdminAuthorizationError } from '$lib/server/adminAuthorization';

// Server-only route. No public-key fallback and no client-supplied identity fields.
export const POST: RequestHandler = async ({ request }) => {
  try {
    const identity = await verifyRequestIdentity(request);
    // A private allowlisted administrator is ineligible even if its profile says reader.
    try {
      assertServerAdmin(identity.id);
      return json({ code: 'application_not_eligible' }, { status: 409 });
    } catch (error) {
      if (!(error instanceof AdminAuthorizationError)) throw error;
    }
    let body: Record<string, unknown>;
    try { body = await request.json(); }
    catch { return json({ code: 'application_invalid' }, { status: 400 }); }
    const fields = ['published_website', 'published_pen_name', 'published_work_title', 'planned_work_description', 'draft_file_path'];
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !fields.includes(key))) {
      return json({ code: 'application_invalid' }, { status: 400 });
    }
    const details: Record<string, string> = {};
    for (const field of fields) {
      if (Object.hasOwn(body, field)) {
        const value = body[field];
        if (typeof value !== 'string' || value.length > (field === 'planned_work_description' ? 20000 : 2000)) {
          return json({ code: 'application_invalid' }, { status: 400 });
        }
        details[field] = value;
      }
    }
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url?.trim() || !key?.trim()) throw new Error('configuration_missing');
    const base = new URL(url);
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('configuration_invalid');
    if (Object.hasOwn(details, 'draft_file_path')) {
      const prefix = `${base.origin}/storage/v1/object/public/user-documents/user_uploads/${identity.id}/`;
      // Only the existing account-scoped draft upload URL format is accepted.
      if (!details.draft_file_path.startsWith(prefix) ||
          !/^draft_\d+\.[a-zA-Z0-9]+$/.test(details.draft_file_path.slice(prefix.length))) {
        return json({ code: 'application_invalid_attachment' }, { status: 400 });
      }
    }
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    // One conditional UPDATE is the concurrency boundary. PostgreSQL rechecks the
    // predicate after a competing row update; no read-then-unconditional-write.
    const { data, error } = await client.from('user_profiles')
      .update({ ...details, role: 'author', is_approved: false })
      .eq('user_id', identity.id).eq('role', 'reader').eq('is_approved', false)
      .select('user_id');
    if (error) throw new Error('database_failed');
    if (!Array.isArray(data)) throw new Error('database_invalid_response');
    if (data.length !== 1) return json({ code: 'application_not_eligible' }, { status: 409 });
    return json({ success: true });
  } catch (error) {
    if (error instanceof IdentityVerificationError) return json({ code: error.code }, { status: error.status });
    // No provider errors, personal data, credentials or application contents in logs/responses.
    return json({ code: 'application_unavailable' }, { status: 503 });
  }
};
