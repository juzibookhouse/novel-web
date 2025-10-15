import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { getAuthUser } from '$lib/server/auth.js';

export async function GET({ params }) {
  try {
    const { chapterId } = params;

    return json({ chapterId });
  } catch (err) {
    console.error('Comments API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ request, params, locals }) {
  try {
    const { chapterId, novelId } = params;
    const {user_id} = await getAuthUser(request);
    const {gift_id, stripe_client_secret} = await request.json();
    
    if (!user_id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!gift_id) {
      return json({ error: 'Gift id is required' }, { status: 400 });
    }

    const { data: gift, error: giftError } = await supabase.from('gifts').select('*').eq('id', gift_id).single();
    
    if (giftError || !gift) {
      return json({ error: `Gift ${gift_id} not found` }, { status: 404 });
    }

    const { data: novel, error: novelError } = await supabase.from('novels').select('*').eq('id', novelId).single();
    
    if (novelError || !novel) {
      return json({ error: `Novel ${novelId} not found` }, { status: 404 });
    }

    const { data: chapter, error: chapterError } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
    
    if (chapterError || !chapter) {
      return json({ error: `Chapter ${chapterId} not found` }, { status: 404 });
    }

    const {data: chapterGift, error: chapterGiftError} = await supabase.from('chapter_gifts').select('*').eq('chapter_id', chapterId).eq('gift_id', gift_id).eq('stripe_client_secret', stripe_client_secret).eq('user_id',user_id).single();
    if (!chapterGift) {
      const {error} = await supabase
      .from('chapter_gifts')
      .insert({
        novel_id: novelId,
        chapter_id: chapterId,
        gift_id: gift_id,
        user_id: user_id,
        stripe_client_secret: stripe_client_secret,
        payment_status: 'pending'
      });
      if (error) {
        console.error('Error creating chapter gift:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
      }
    } else {
      const {error} = await supabase
      .from('chapter_gifts')
      .update({
        gift_id
      })
      .eq('id', chapterGift.id)
      if (error) {
        console.error('Error updating chapter gift:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    return json({ msg: 'Send Gift successfully'}, { status: 201 });
  } catch (err) {
    console.error('Comments API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}