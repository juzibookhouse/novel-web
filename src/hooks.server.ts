// src/hooks.server.ts
import { redirect, type Handle } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const handle: Handle = async ({ event, resolve }) => {
  // Get the session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Add session to event locals
  event.locals.session = session;
  event.locals.user = session?.user || null;
  
  // Protected routes
  const protectedRoutes = ['/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );
  
  // Redirect if not authenticated
  if (isProtectedRoute && !event.locals.user) {
    throw redirect(303, '/login');
  }
  
  return await resolve(event);
};