import { writable, type Writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Create a writable store for the user
export const user: Writable<User | null> = writable(null);

// Initialize the store with the current session user
supabase.auth.getSession().then(({ data }) => {
  user.set(data.session?.user || null);
});

// Subscribe to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    user.set(session.user);
  } else {
    user.set(null);
  }
});