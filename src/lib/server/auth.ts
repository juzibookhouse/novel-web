import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export class AuthenticationError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
    this.name = 'AuthenticationError';
  }
}

export function authenticationErrorResponse(error: unknown): Response | undefined {
  if (error instanceof AuthenticationError) {
    return Response.json({ error: error.code, code: error.code }, { status: error.status });
  }
}

function databaseFailure(error: { code?: string }, operation: string): never {
  if (error.code === '42501') throw new AuthenticationError(403, `${operation}_forbidden`);
  if (['PGRST100', '42P01', '42703'].includes(error.code || '')) {
    throw new AuthenticationError(500, `${operation}_query_failed`);
  }
  throw new AuthenticationError(503, `${operation}_unavailable`);
}

export async function getAuthUser(request: Request) {
  const header = request.headers.get('Authorization');
  if (!header) throw new AuthenticationError(401, 'credentials_missing');
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  if (!bearer) throw new AuthenticationError(401, 'credentials_invalid');
  let accessToken: unknown = bearer[1].trim();
  // Compatibility only: never trust the legacy session's user object.
  if (typeof accessToken === 'string' && accessToken.startsWith('{')) {
    try { accessToken = JSON.parse(accessToken).access_token; }
    catch { throw new AuthenticationError(401, 'credentials_invalid'); }
  }
  if (typeof accessToken !== 'string' || !accessToken.trim() || accessToken === 'null') {
    throw new AuthenticationError(401, 'credentials_invalid');
  }

  try {
    const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });
    let verified;
    try { verified = await supabase.auth.getUser(accessToken); }
    catch { throw new AuthenticationError(503, 'auth_unavailable'); }
    const { data, error: authError } = verified;
    if (authError) {
      if ((authError.status && authError.status >= 500) || authError.status === 429) {
        throw new AuthenticationError(503, 'auth_unavailable');
      }
      const invalidCodes = ['bad_jwt', 'invalid_jwt', 'session_not_found', 'session_expired', 'user_not_found'];
      if (authError.status === 401 || invalidCodes.includes(authError.code || '')) {
        throw new AuthenticationError(401, 'credentials_invalid');
      }
      if (authError.code === 'user_banned') throw new AuthenticationError(403, 'account_forbidden');
      // An upstream outage or unknown Auth error is not proof of logout.
      throw new AuthenticationError(503, 'auth_unavailable');
    }
    if (!data?.user?.id) throw new AuthenticationError(503, 'auth_invalid_response');
    const user = data.user;

    let profileResult;
    try {
      profileResult = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle();
    } catch { throw new AuthenticationError(503, 'profile_unavailable'); }
    const { data: profile, error: profileError } = profileResult;
    if (profileError) databaseFailure(profileError, 'profile');
    // A missing visible row can also mean RLS hid it, not an invalid token.
    if (!profile) throw new AuthenticationError(403, 'profile_missing_or_inaccessible');

    const now = new Date().toISOString();
    let membership;
    // Separate equality filters avoid raw OR syntax and enum-order assumptions.
    // A pending purchase must never hide already-active membership benefits.
    for (const status of ['active', 'pending']) {
      let membershipResult;
      try {
        membershipResult = await supabase
          .from('user_memberships')
          .select('id, plan_id, start_date, end_date, status, stripe_client_secret')
          .eq('user_id', user.id)
          .eq('status', status)
          .gte('end_date', now)
          .lte('start_date', now)
          .order('end_date', { ascending: false })
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle();
      } catch { throw new AuthenticationError(503, 'membership_unavailable'); }
      if (membershipResult.error) databaseFailure(membershipResult.error, 'membership');
      if (membershipResult.data) {
        membership = membershipResult.data;
        break;
      }
    }

    return {
      ...profile,
      id: user.id,
      user_id: user.id,
      // This role still depends on database role-write protection.
      isAdmin: profile.role === 'admin',
      membership: membership || undefined,
      isMembership: membership?.status === 'active' && membership.end_date > now
    };
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    // Never expose tokens, provider payloads, or connection details.
    throw new AuthenticationError(503, 'authentication_unavailable');
  }
}
