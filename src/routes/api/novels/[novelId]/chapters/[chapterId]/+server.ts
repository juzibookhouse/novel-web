import { getAuthUser } from '$lib/server/auth.js';
import { supabase } from '$lib/supabaseClient.js';
import { json } from '@sveltejs/kit';
import { logError } from '$lib/errorLogger';
import { WEBSITE_NAME } from '$lib/constants';

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
      await logError(chapterError, { request }, `${WEBSITE_NAME} - 获取章节失败`);
      return json({ error: 'Chapter not found' }, { status: 404 });
    }

    if (!chapter) {
      return json({ error: 'Chapter not found' }, { status: 404 });
    }

    return json({ chapter });
  } catch (error) {
    console.error('GET /api/novels/[novelId]/chapters/[chapterId]:', error);
    await logError(error, { request }, `${WEBSITE_NAME} - 获取章节失败`);
    return json({ error: 'Failed to fetch chapter' }, { status: 500 });
  }
}
