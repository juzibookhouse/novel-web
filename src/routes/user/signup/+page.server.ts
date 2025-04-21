import { supabase } from "$lib/supabaseClient";
import { redirect } from "@sveltejs/kit";

export async function load({ url }: { url: URL }) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    throw redirect(303, '/');
  }

  return {};
}