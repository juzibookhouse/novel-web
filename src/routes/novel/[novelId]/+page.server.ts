import { supabase } from "$lib/supabaseClient";
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { novelId: string } }) {
  const { data: novel, error: novelError } = await supabase
    .from('novels')
    .select(`
      *,
      chapters (
        id,
        title,
        created_at,
        chapter_order
      )
    `)
    .eq('id', params.novelId)
    .single();

  if (novelError) {
    throw error(404, 'Novel not found');
  }

  return {
    novel
  };
}