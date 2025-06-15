import { FREE_OPTIONS_MAP, getSortedChapters, type Chapter, type Tag } from "$lib/novel";
import { getNovel, getUserProfile } from "$lib/supabaseClient";
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { novelId: string } }) {
  
  const {data:novel,error:novelError} = await getNovel(params.novelId);
  const {data:userProfile, error:profileError} = await getUserProfile(novel.user_id);

  novel.tags = novel.novel_tags.map(({tags}:{tags:Tag})=>tags);

  novel.chapters = getSortedChapters(novel.chapters);
  novel.chapters = novel.chapters.map((c:Chapter)=>{
    c.is_free = FREE_OPTIONS_MAP[novel.is_free || c.is_free]
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