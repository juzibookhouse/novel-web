import { getSortedChapters } from '$lib/novel.js';
import { getAuthUser } from '$lib/server/auth.js';
import { getCategories, getTags, supabase } from '$lib/supabaseClient';
import { json } from '@sveltejs/kit';

export async function GET({ request }: { request: Request }) {
  try {
    const {user_id, isAdmin} = await getAuthUser(request);
    if (!user_id) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const per_page = 3;
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    let query = supabase
      .from('novels')
      .select(`
        *,
        chapters (
          id,
          title,
          content,
          is_free,
          published,
          chapter_order
        ),
        novel_tags (
          tags (
            id,
            name
          )
        )
      `, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (!isAdmin) {
      query = query.eq('user_id', user_id);
    }

    const { data, error, count } = await query;
    
    if (error) {
      console.error(error);
      return json({ error: 'Failed to fetch novels' }, { status: 500 });
    }
    
    const novels = (data || []).map(novel => ({
      ...novel,
      tags: novel.novel_tags?.map((nc: { tags: any; }) => nc.tags),
      chapters: getSortedChapters(novel.chapters)
    }));

    const {data: categoriesData, error: categoriesError} = await getCategories();
    if (categoriesError) {
      console.error(categoriesError);
    }

    const {data: tagsData, error: tagsError} = await getTags();
    if (tagsError) {
      console.error(tagsError);
    }

    return json({ novels, categories: categoriesData || [], tags: tagsData || [], totalCount: count || 0, page, per_page });
  } catch (error) {
    return json({ error: 'Failed to fetch novels' }, { status: 500 });
  }
}