// src/lib/stores/authStore.ts
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export const user = writable<User | null>(null);
export const isLoading = writable<boolean>(true);

export async function initAuth() {
  isLoading.set(true);
  
  // Check for active session
  const { data } = await supabase.auth.getSession();
  
  if (data?.session) {
    user.set(data.session.user);
  }
  
  // Setup auth listener
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (session) {
        user.set(session.user);
      } else {
        user.set(null);
      }
      isLoading.set(false);
    }
  );
  
  return authListener;
}