import { browser } from '$app/environment';
import { env } from '$env/dynamic/private';

// SvelteKit prevents client imports of $lib/server and private environment modules.
if (browser || typeof window !== 'undefined') throw new Error('admin_authorization_server_only');

export class AdminAuthorizationError extends Error {
  status = 403;
  code = 'admin_access_denied';
  constructor() {
    // Identical failures never disclose configuration or administrator IDs.
    super('admin_access_denied');
    this.name = 'AdminAuthorizationError';
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Authorization only, NOT identity verification.
 * Call with the ID returned by server-side Supabase Auth token verification.
 * Never pass request params/body, a cached profile ID, email, or role.
 * Private configuration: ADMIN_AUTH_USER_IDS = comma-separated Auth UUIDs.
 */
export function assertServerAdmin(verifiedAuthUserId: string): void {
  if (typeof verifiedAuthUserId !== 'string' || !UUID.test(verifiedAuthUserId)) {
    throw new AdminAuthorizationError();
  }
  const configured = env.ADMIN_AUTH_USER_IDS;
  if (typeof configured !== 'string' || !configured.trim()) throw new AdminAuthorizationError();
  const ids = configured.split(',').map((value) => value.trim());
  // One malformed entry invalidates the entire list; never accept a partial list.
  if (ids.some((id) => !UUID.test(id))) throw new AdminAuthorizationError();
  if (!ids.some((id) => id.toLowerCase() === verifiedAuthUserId.toLowerCase())) {
    throw new AdminAuthorizationError();
  }
}
