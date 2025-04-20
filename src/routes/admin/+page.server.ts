import { redirect } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient";

export async function load({ locals }: { locals: { session: any } }) {
  return {};
  const session = locals.session;

  if (!session?.user) {
    throw redirect(303, "/user/login");
  }

  const {
    data: { role },
  } = await supabase.auth.getUser();

  if (role !== "admin") {
    throw redirect(303, "/");
  }

  return {};
}
