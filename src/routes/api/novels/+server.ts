import { getAuthUser } from '$lib/server/auth.js';
import { supabase } from '$lib/supabaseClient';
import { json } from '@sveltejs/kit';

export async function GET({ request }) {
  try {
    const {user_id} = await getAuthUser(request);
    if (!user_id) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }
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