import { browser } from '$app/environment';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// $lib/server is also protected from browser imports by SvelteKit.
if (browser || typeof window !== 'undefined') throw new Error('identity_verification_server_only');

export class IdentityVerificationError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
    this.name = 'IdentityVerificationError';
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Identity only: no profile, membership, or administrator authorization. */
export async function verifyRequestIdentity(request: Request): Promise<{ id: string }> {
  const header = request.headers.get('Authorization');
  if (!header) throw new IdentityVerificationError(401, 'credentials_missing');
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  if (!bearer) throw new IdentityVerificationError(401, 'credentials_invalid');
  let token: unknown = bearer[1].trim();
  // Legacy clients send a session JSON. Its user/role fields are never trusted.
  if (typeof token === 'string' && token.startsWith('{')) {
    try { token = JSON.parse(token).access_token; }
    catch { throw new IdentityVerificationError(401, 'credentials_invalid'); }
  }
  if (typeof token !== 'string' || !token.trim() || token === 'null') {
    throw new IdentityVerificationError(401, 'credentials_invalid');
  }
  try {
    // A fresh client per request prevents cross-request session mutation.
    const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data, error } = await client.auth.getUser(token);
    if (error) {
      if (error.status === 429 || (error.status && error.status >= 500)) {
        throw new IdentityVerificationError(503, 'auth_unavailable');
      }
      if (error.code === 'user_banned') throw new IdentityVerificationError(403, 'account_forbidden');
      const invalidCodes = ['bad_jwt', 'invalid_jwt', 'session_not_found', 'session_expired', 'user_not_found'];
      if (error.status === 401 || invalidCodes.includes(error.code || '')) {
        throw new IdentityVerificationError(401, 'credentials_invalid');
      }
      throw new IdentityVerificationError(503, 'auth_unavailable');
    }
    if (typeof data?.user?.id !== 'string' || !UUID.test(data.user.id)) {
      throw new IdentityVerificationError(503, 'auth_invalid_response');
    }
    return { id: data.user.id };
  } catch (error) {
    if (error instanceof IdentityVerificationError) throw error;
    // Never retain provider payloads, tokens, or configuration in errors/logs.
    throw new IdentityVerificationError(503, 'auth_unavailable');
  }
}
