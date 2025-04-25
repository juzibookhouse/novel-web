import { writable, type Writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Create a writable store for the user
export const user: Writable<User | null> = writable(null);

export const setUser = (newUser: User | null) => {
  user.set(newUser);
}

export const getUserData = async (userId: string) => {
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (profileError) {
    throw profileError;
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: membershipData, error: membershipError } = await supabase
    .from('user_memberships')
    .select('*')
    .eq('user_id', userId)
    .gte('end_date', today)
    .lte('start_date', today);

  if (membershipError) {
    throw membershipError;
  }

  return {
    ...profileData,
    membership: membershipData
  };
}

// Initialize the store with the current session user
supabase.auth.getSession().then(async({ data }) => {
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