import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { getAuthUser } from '$lib/server/auth.js';

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
      return json({ error: 'Failed to delete novel_tags' }, { status: 500 });
    }
    
    const {error: tagError} = await supabase.from('tags').delete().eq('id', tagId);
    if (tagError) {
      console.error('Error deleting tags:', tagError);
      return json({ error: 'Failed to delete tags' }, { status: 500 });
    }

    return json({ msg: 'Tag deleted successfully' });
  } catch (err) {
    console.error('Delete Tag API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}