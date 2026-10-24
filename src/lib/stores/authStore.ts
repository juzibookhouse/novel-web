import { writable, type Writable } from "svelte/store";
import { supabase } from "$lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface UserMembership {
  plan_id: string;
  status: string;
  id: string;
  start_date: string;
  end_date: string;
  stripe_client_secret: string;
}

export interface UserData extends User {
  id: string;
  isAdmin: boolean;
  user_id: string;
  user_name: string;
  role: string;
  is_approved: boolean;
  created_at: string;
  email?: string;
  ip?: string;
  draft_file_path?: string;
  membership?: UserMembership;
  isMembership?: Boolean;
}

// Create a writable store for the user
export const user: Writable<UserData | null> = writable(null);

export interface AuthVerification {
  status: 'unverified' | 'verifying' | 'verified' | 'signed_out';
  reason?: string;
}
// Cached user data is display-only unless revalidated; servers authorize every request.
export const authVerification = writable<AuthVerification>({ status: 'unverified' });
let verification: AuthVerification = { status: 'unverified' };
function markVerification(value: AuthVerification) {
  verification = value;
  authVerification.set(value);
}
let generation = 0;
let activeUserId: string | null = null;
let inFlight: { userId: string; promise: Promise<void> } | null = null;

export const setUser = (newUser: User | null): Promise<void> => {
  if (!newUser) {
    generation++;
    inFlight = null;
    activeUserId = null;
    user.set(null);
    markVerification({ status: 'signed_out' });
    return Promise.resolve();
  }
  if (inFlight?.userId === newUser.id) return inFlight.promise;
  if (activeUserId && activeUserId !== newUser.id) {
    // Never display a previous account's cached roles after an account switch.
    user.set(null);
  }
  activeUserId = newUser.id;
  const attempt = ++generation;
  markVerification({ status: 'verifying' });
  const promise = (async () => {
    try {
      const { data, error, status } = await sendRequest('/api/user');
      if (attempt !== generation) return;
      if (status === 401 && error?.code === 'credentials_invalid') {
        user.set(null);
        markVerification({ status: 'signed_out', reason: 'credentials_invalid' });
      } else if (error || data?.currentUser?.user_id !== newUser.id) {
        markVerification({ status: 'unverified', reason: error?.code || 'invalid_user_response' });
      } else {
        user.set(data.currentUser);
        markVerification({ status: 'verified' });
      }
    } catch {
      if (attempt === generation) markVerification({ status: 'unverified', reason: 'network_error' });
    } finally {
      if (attempt === generation) inFlight = null;
    }
  })();
  inFlight = { userId: newUser.id, promise };
  return promise;
};

export const getUserSession = async () => {
  const startedAt = generation;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (startedAt !== generation) return;
    if (error) {
      markVerification({ status: 'unverified', reason: 'session_unavailable' });
      return;
    }
    if (data.session?.user) await setUser(data.session.user);
    else if (!activeUserId) await setUser(null);
    else markVerification({ status: 'unverified', reason: 'credentials_missing' });
  } catch {
    if (startedAt === generation) markVerification({ status: 'unverified', reason: 'session_unavailable' });
  }
};

import { browser } from '$app/environment';
import { sendRequest } from "$lib/api";

// Subscribe to auth changes
const PATHS_TO_REDIRECT = ["/user/signup", "author/signup"];

if (browser) {
  void getUserSession();
  // One attempt per online event; no timer, loop, or recursive retry.
  window.addEventListener('online', () => {
    if (verification.status === 'unverified') void getUserSession();
  });
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      if (event === 'TOKEN_REFRESHED') {
        // A rejection for an older token must not sign out the refreshed session.
        generation++;
        inFlight = null;
      }
      setUser(session.user);
      if (PATHS_TO_REDIRECT.includes(window.location.pathname)) {
        window.location.href = "/";
      }
    } else if (event === 'SIGNED_OUT') {
      setUser(null);
    } else {
      markVerification({ status: 'unverified', reason: 'credentials_missing' });
    }
  });
}
