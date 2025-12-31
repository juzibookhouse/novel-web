import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { getAuthUser } from '$lib/server/auth.js';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const { novelId } = params;
    const {user_id} =  await getAuthUser(request);
    if (!user_id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {error: ReadingError } = await supabase.from('reading_records').delete().eq('novel_id', novelId);

    if (ReadingError) {
      console.error('Error deleting reading records:', ReadingError);
      return json({ error: 'Failed to delete reading records' }, { status: 500 });
    }

    const { error: chaptersError } = await supabase.from('chapters').delete().eq('novel_id', novelId);

    if (chaptersError) {
      console.error('Error deleting chapters:', chaptersError);
      return json({ error: 'Failed to delete chapters' }, { status: 500 });
    }

  // Then delete the novel itself
    const {error: novelError} = await supabase.from('novels').delete().eq('id', novelId);
    if (novelError) {
      console.error('Error deleting novel:', novelError);
      return json({ error: 'Failed to delete novel' }, { status: 500 });
    }

    return json({ msg: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Comments API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};