import { FREE_OPTIONS_MAP, getSortedChapters, type Chapter, type Tag } from "$lib/novel";
import { getNovel, getNovelChapterGifts, getUserProfile, supabase } from "$lib/supabaseClient";
import type { Comment } from "$lib/types/comment";
import type { Gift } from "$lib/types/gift";
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { novelId: string } }) {
  
  const {data:novel,error:novelError} = await getNovel(params.novelId);
  console.log('Fetched novel:', novel);
  const {data:userProfile, error:profileError} = await getUserProfile(novel.user_id);

  const {gifts, error:giftsError} = await getNovelChapterGifts({ novel_id: params.novelId });

  if (giftsError) {
    console.error('Error fetching gifts:', giftsError);
  } else if (gifts) {
    novel.gifts = gifts;
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

  novel.comments.sort((a:Comment,b:Comment)=>{
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  novel.author = userProfile;

  if (novelError) {
    throw error(404, 'Novel not found');
  }

  return {
    novel
  };
}