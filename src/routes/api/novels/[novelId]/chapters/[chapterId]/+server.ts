import { getAuthUser } from '$lib/server/auth.js';
import { supabase } from '$lib/supabaseClient.js';
import { json } from '@sveltejs/kit';

export async function GET({ params, request }: { params: { novelId: string; chapterId: string }; request: Request }) {
  try {
    const { user_id, isAdmin } = await getAuthUser(request);
    const { novelId, chapterId } = params;

    if (!novelId || !chapterId) {
      return json({ error: 'Missing novelId or chapterId' }, { status: 400 });
    }

    // Fetch chapter with related novel and comments
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select(`
        *,
        novel:novels (
          id,
          title,
          description,
          user_id,
          is_free,
          published,
          cover_url
        )
      `)
      .eq('id', chapterId)
      .eq('novel_id', novelId)
      .single();

    if (chapterError) {
      console.error(chapterError);
      return json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (!chapter) {
      return json({ error: 'Chapter not found' }, { status: 404 });
    }

    return json({ chapter });
  } catch (error) {
    console.error(error);
    return json({ error: 'Failed to fetch chapter' }, { status: 500 });
  }
}
