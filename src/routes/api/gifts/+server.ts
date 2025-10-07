import { getSortedChapters } from '$lib/novel.js';
import { getAuthUser } from '$lib/server/auth.js';
import { supabase } from '$lib/supabaseClient';
import { json } from '@sveltejs/kit';

export async function GET({ request }) {
  try {
    const {user_id, isAdmin} = await getAuthUser(request);
    if (!user_id) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data:gifts, error } = await supabase
      .from('gifts')
      .select(`
        *
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error(error);
      return json({ error: 'Failed to fetch gifts' }, { status: 500 });
    }
    
    return json({ gifts });
  } catch (error) {
    return json({ error: 'Failed to fetch novels' }, { status: 500 });
  }
}