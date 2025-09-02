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

    let query = supabase
      .from('novels')
      .select(`
        *,
        chapters (
          *
        ),
        novel_tags (
          tags (
            id,
            name
          )
        )
      `)
      .order('updated_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error(error);
      return json({ error: 'Failed to fetch novels' }, { status: 500 });
    }
    
    const novels = (data || []).map(novel => ({
      ...novel,
      tags: novel.novel_tags?.map(nc => nc.tags),
      chapters: getSortedChapters(novel.chapters)
    }));
    
    return json({ novels });
  } catch (error) {
    return json({ error: 'Failed to fetch novels' }, { status: 500 });
  }
}