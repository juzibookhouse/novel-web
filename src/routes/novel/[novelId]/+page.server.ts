import { FREE_OPTIONS_MAP, getSortedChapters, type Chapter, type Tag } from "$lib/novel";
import { getNovel, getUserProfile } from "$lib/supabaseClient";
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { novelId: string } }) {
  
  const {data:novel,error:novelError} = await getNovel(params.novelId);
  const {data:userProfile, error:profileError} = await getUserProfile(novel.user_id);

  novel.tags = novel.novel_tags.map(({tags}:{tags:Tag})=>tags);

  novel.chapters = getSortedChapters(novel.chapters);

  novel.comments = [];
  novel.chapters = novel.chapters.map((c:Chapter)=>{
    if (c.chapter_comments?.length) {
      novel.comments.push(...c.chapter_comments);
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