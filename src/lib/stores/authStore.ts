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
  email?: string;
  ip?: string;
  draft_file_path?: string;
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

  const {data:{currentUser, error}, response} = await sendRequest('/api/user');

  if (error) {
    throw error;
  }

  user.set(currentUser);
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

import { browser } from '$app/environment';
import { sendRequest } from "$lib/api";

// // Subscribe to auth changes
// const PATHS_TO_REDIRECT = ["/user/signup", "author/signup"];

// if (browser) {
//   supabase.auth.onAuthStateChange(async (event, session) => {
//     if (session) {
//       setUser(session.user);
//       if (PATHS_TO_REDIRECT.includes(window.location.pathname)) {
//         window.location.href = "/";
//       }
//     } else {
//       setUser(null);
//     }
//   });
// }