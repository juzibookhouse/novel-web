import { writable, type Writable } from "svelte/store";
import { supabase } from "$lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

interface UserData extends User {
  profile?: UserProfile;
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

  // Combine user and profile data
  const userData: UserData = {
    ...newUser,
    profile,
  };
  user.set(userData);
};

// Initialize the store with the current session user
supabase.auth.getSession().then(async ({ data }) => {
  if (data.session?.user) {
    setUser(data.session.user);
  } else {
    setUser(null);
  }
});

// Subscribe to auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    setUser(session.user);
  } else {
    setUser(null);
  }
});
