import { writable, type Writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Create a writable store for the user
export const user: Writable<User | null> = writable(null);

const getUserData = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    return null;
  }

  return data;
}

// Initialize the store with the current session user
supabase.auth.getSession().then(async({ data }) => {
  if (data.session?.user) {
    const profileData = await getUserData(data.session.user.id);
    
    if (profileData) {
      data.session.user.role = profileData.role;
    }

    user.set(data.session.user);
  } else {
    user.set(null);
  }
});
  
  // Subscribe to auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    const profileData = await getUserData(session.user.id);
    if (profileData) {
      session.user.role = profileData.role;
    }
    user.set(session.user);
  } else {
    user.set(null);
  }
});