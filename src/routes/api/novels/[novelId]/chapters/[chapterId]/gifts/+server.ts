import { json } from '@sveltejs/kit';
import { getNovelChapterGifts, supabase } from '$lib/supabaseClient';
import { getAuthUser } from '$lib/server/auth.js';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import type { Gift } from '$lib/types/gift.js';

export async function GET({ params, request }) {
  try {
    const { novelId, chapterId } = params;

    const { data:giftsData, error:giftsError } = await supabase
      .from('gifts')
      .select(`
        *
      `)
      .order('updated_at', { ascending: false });
    
    const gifts:Gift[] = [];

    // Process gifts according to requirements
    if (giftsData) {
      // 1. For each gift in giftsData, append type "must" to gifts
      giftsData.forEach(gift => {
        if (gift.type === 'must') {
          gifts.push(gift);
        }
      });
      
      // 2. Randomly pick two gifts with type "random"
      const randomGifts = giftsData.filter(gift => gift.type === 'random');
      if (randomGifts.length > 0) {
        const shuffled = [...randomGifts].sort(() => 0.5 - Math.random());
        // const selectedRandomGifts = shuffled.slice(0, 2);
        shuffled.forEach(gift => {
          gifts.push(gift);
        });
      }
      
      giftsData.forEach(gift => {
        if (gift.type === 'negative') {
          gifts.push(gift);
        }
      });
    }

    const {gifts:chapterGifts, error:chapterGiftsError} = await getNovelChapterGifts({ novel_id:novelId, chapter_id:chapterId });
    
    if (giftsError) {
      console.error('Error fetching gifts:', giftsError);
    }
    
    if (chapterGiftsError) {
      console.error('Error fetching chapter gifts:', chapterGiftsError);
    }

    return json({ chapterGifts, gifts });
  } catch (err) {
    console.error('Comments API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ request, params, locals }) {
  try {
    const { chapterId, novelId } = params;
    const {user_id} = await getAuthUser(request);
    const {gift_id, stripe_client_secret, payment_method} = await request.json();
    
    if (!user_id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: novel, error: novelError } = await supabase.from('novels').select('*').eq('id', novelId).single();
    
    if (novelError || !novel) {
      return json({ error: `Novel ${novelId} not found` }, { status: 404 });
    }

    const { data: chapter, error: chapterError } = await supabase.from('chapters').select('*').eq('id', chapterId).single();
    
    if (chapterError || !chapter) {
      return json({ error: `Chapter ${chapterId} not found` }, { status: 404 });
    }

    const {data: chapterGift, error: chapterGiftError} = await supabase.from('chapter_gifts').select('*').eq('chapter_id', chapterId).eq('stripe_client_secret', stripe_client_secret).eq('user_id',user_id).single();
    if (!chapterGift) {
      
      
      if (!gift_id) {
        return json({ error: 'Gift id is required' }, { status: 400 });
      }

      const { data: gift, error: giftError } = await supabase.from('gifts').select('*').eq('id', gift_id).single();
      
      if (giftError || !gift) {
        return json({ error: `Gift ${gift_id} not found` }, { status: 404 });
      }


      const {error} = await supabase
      .from('chapter_gifts')
      .insert({
        novel_id: novelId,
        chapter_id: chapterId,
        gift_id: gift_id,
        user_id: user_id,
        stripe_client_secret: stripe_client_secret,
        payment_status: 'pending',
        payment_method
      });
      if (error) {
        console.error('Error creating chapter gift:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
      }
    } else {
      const updateOption: any = {
        gift_id,
        payment_method,
        payment_status: 'pending',
        paid_at: null,
        updated_at: new Date()
      }
      const stripe = new Stripe(STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.retrieve(stripe_client_secret.split('_secret_')[0]);
      console.log(paymentIntent);
      if (paymentIntent.status === 'succeeded') {
        updateOption.payment_status = 'paid';
        updateOption.paid_at = new Date();
      }

      const {error} = await supabase
      .from('chapter_gifts')
      .update(updateOption)
      .eq('id', chapterGift.id)
      if (error) {
        console.error('Error updating chapter gift:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
      }

      return json({ msg: 'Send Gift successfully'}, { status: 201 });

    }

    return json({ msg: 'Send Gift successfully'}, { status: 201 });
  } catch (err) {
    console.error('Comments API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}