import { supabase } from "$lib/supabaseClient";

export async function load() {
  const { data: ongoingNovels } = await supabase
    .from("novels")
    .select()
    .eq('status', 'ongoing')
    .limit(6)
    .order('created_at', { ascending: false });

  const { data: finishedNovels } = await supabase
    .from("novels")
    .select()
    .eq('status', 'finished')
    .limit(6)
    .order('created_at', { ascending: false });

  return {
    ongoingNovels: ongoingNovels ?? [],
    finishedNovels: finishedNovels ?? [],
  };
}