import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { getAuthUser } from '$lib/server/auth.js';
import { logError } from '$lib/errorLogger';
import { WEBSITE_NAME } from '$lib/constants';

export async function DELETE({ params, request }) {
  try {
    const { tagId } = params;
    const {isAdmin} =  await getAuthUser(request);
    if (!isAdmin) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {error: novelTagError} = await supabase.from('novel_tags').delete().eq('tag_id', tagId);
    if (novelTagError) {
      console.error('Error deleting novel_tags:', novelTagError);
      await logError(novelTagError, { request }, `${WEBSITE_NAME} - 删除小说标签关联失败`);
      return json({ error: 'Failed to delete novel_tags' }, { status: 500 });
    }
    
    const {error: tagError} = await supabase.from('tags').delete().eq('id', tagId);
    if (tagError) {
      console.error('Error deleting tags:', tagError);
      await logError(tagError, { request }, `${WEBSITE_NAME} - 删除标签失败`);
      return json({ error: 'Failed to delete tags' }, { status: 500 });
    }

    return json({ msg: 'Tag deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/tags/[tagId]:', err);
    await logError(err, { request }, `${WEBSITE_NAME} - 删除标签失败`);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}