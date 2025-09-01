import { supabase } from '$lib/supabaseClient';
import { json } from '@sveltejs/kit';

export async function GET({ }) {
  try {
    const { data: novels, error } = await supabase
      .from('novels')
      .select(`
        *,
        chapters (
          *
        )
      `)
      .order('updated_at', { ascending: false });
    
    return json({ novels });
  } catch (error) {
    return json({ error: 'Failed to fetch novels' }, { status: 500 });
  }
}