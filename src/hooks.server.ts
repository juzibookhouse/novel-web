import { redirect, type Handle } from "@sveltejs/kit";
import { createServerClient } from "@supabase/ssr";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => {
          event.cookies.set(key, value, options);
        },
        remove: (key, options) => {
          event.cookies.delete(key, options);
        },
      },
    },
  );

  // Get the session using the server client
  const {
    data: { session },
    error,
  } = await event.locals.supabase.auth.getSession();

  // Add session and user to event locals
  event.locals.session = session;
  event.locals.user = session?.user || null;

  // Protected routes
  const protectedRoutes = ["/admin", "/author/dashboard", "/user/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    event.url.pathname.startsWith(route),
  );

  // Redirect if not authenticated
  if (isProtectedRoute && !event.locals.user) {
    throw redirect(303, "/user/login");
  }

  return await resolve(event);
};
