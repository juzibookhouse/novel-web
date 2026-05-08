import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { getAuthUser } from '$lib/server/auth.js';
import { logError } from '$lib/errorLogger';
import { WEBSITE_NAME } from '$lib/constants';

export async function DELETE({ params, request }) {
  try {
    const { commentId } = params;
    const {user_id} =  await getAuthUser(request);
    if (!user_id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {data: comment, error: commentError} = await supabase.from('chapter_comments').select(`
      id
      `).eq('id', commentId).eq('user_id',user_id).single();
    
    
    if (commentError) {
      console.error('Error fetching comment:', commentError);
      await logError(commentError, { request }, `${WEBSITE_NAME} - 获取评论失败`);
      return json({ error: 'Failed to fetch comment' }, { status: 500 });
    }

    if (comment?.id !== commentId) {
      console.error('Comment not found:', commentId);
      return json({ error: 'Comment not found' }, { status: 404 });
    }

    const {error} = await supabase.from('chapter_comments').delete().eq('id', commentId).eq('user_id',user_id);
    
    if (error) {
      console.error('Error deleting comment:', error);
      await logError(error, { request }, `${WEBSITE_NAME} - 删除评论失败`);
      return json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return json({ msg: 'Comment deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/novels/[novelId]/chapters/[chapterId]/comments/[commentId]:', err);
    await logError(err, { request }, `${WEBSITE_NAME} - 删除评论失败`);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}