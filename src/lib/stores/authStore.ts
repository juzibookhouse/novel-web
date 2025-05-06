import { writable, type Writable } from "svelte/store";
import { supabase } from "$lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

interface UserMembership {
  plan_id: string;
  status: string;
  id: string;
  start_date: string;
  end_date: string;
  stripe_client_secret: string;
}

export interface UserData extends User {
  profile?: UserProfile;
  membership?: UserMembership;
  isMembership?: Boolean;
}

// Create a writable store for the user
export const user: Writable<UserData | null> = writable(null);

export const setUser = async (newUser: User | null) => {
  if (!newUser) {
    user.set(null);
    return;
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", newUser.id)
    .single();

  if (error) {
    throw error;
  }

  // Fetch active membership
  const now = new Date().toISOString();
  const { data: membership, error: membershipError } = await supabase
    .from("user_memberships")
    .select("id, plan_id, start_date, end_date, status, stripe_client_secret")
    .eq("user_id", newUser.id)
    .or("status.eq.active,status.eq.pending)")
    .gte("end_date", now)
    .lte("start_date", now)
    .limit(1)
    .single();

  if (membershipError && membershipError.code !== "PGRST116") {
    // Ignore "no rows returned" error
    throw membershipError;
  }

  // Combine user and profile data
  const userData: UserData = {
    ...newUser,
    profile,
    membership: membership || undefined,
    isMembership:
      membership?.status == "active" &&
      membership?.end_date > new Date().toISOString(),
  };
  user.set(userData);
};

export const getUserSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session?.user) {
    setUser(data.session.user);
  } else {
    setUser(null);
  }
};

getUserSession();

// Subscribe to auth changes
const PATHS_TO_REDIRECT = ["/user/login", "/user/signup", "author/signup"];
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    setUser(session.user);
    if (PATHS_TO_REDIRECT.includes(window.location.pathname)) {
      window.location.href = "/";
    }
  } else {
    setUser(null);
  }
});
