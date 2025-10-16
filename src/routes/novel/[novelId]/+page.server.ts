import { FREE_OPTIONS_MAP, getSortedChapters, type Chapter, type Tag } from "$lib/novel";
import { getNovel, getUserProfile, supabase } from "$lib/supabaseClient";
import type { Gift } from "$lib/types/gift";
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { novelId: string } }) {
  
  const {data:novel,error:novelError} = await getNovel(params.novelId);
  const {data:userProfile, error:profileError} = await getUserProfile(novel.user_id);

  const {data:gifts, error:giftsError} = await supabase
  .from('chapter_gifts')
  .select(`
    gift_id,
    gifts (
      title,
      image
    )
  `)
  .eq('novel_id', params.novelId);

  if (giftsError) {
    console.error('Failed to fetch gifts:', giftsError);
  }

  if (gifts?.length) {
    novel.gifts = gifts.map((g:any) => ({
      id: g.gift_id,
      title: g.gifts?.title || '',
      image: g.gifts?.image || ''
    }));
  }

  novel.tags = novel.novel_tags.map(({tags}:{tags:Tag})=>tags);

  delete novel.novel_tags;

  novel.chapters = getSortedChapters(novel.chapters);

  novel.comments = [];
  novel.chapters = novel.chapters.map((c:Chapter)=>{
    if (c.chapter_comments?.length) {
      c.chapter_comments.forEach((cc) => {
        novel.comments.push({
          ...cc,
          chapter_title: c.title
        })
      });
    }
    c.is_free = FREE_OPTIONS_MAP[c.is_free || novel.is_free]
    return c;
  });
  novel.author = userProfile;

  if (novelError) {
    throw error(404, 'Novel not found');
  }

  return {
    novel
  };
}