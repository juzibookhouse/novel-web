import { getSortedChapters, type Tag } from "$lib/novel";
import { getNovel, getUserProfile } from "$lib/supabaseClient";
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { novelId: string } }) {
  
  const {data:novel,error:novelError} = await getNovel(params.novelId);
  const {data:userProfile, error:profileError} = await getUserProfile(novel.user_id);

  novel.tags = novel.novel_tags.map(({tags}:{tags:Tag})=>tags);

  novel.chapters = getSortedChapters(novel.chapters);
  novel.author = userProfile;

  if (novelError) {
    throw error(404, 'Novel not found');
  }

  return {
    novel
  };
}