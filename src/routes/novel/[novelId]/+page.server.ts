import { getSortedChapters } from "$lib/novel";
import { getNovel } from "$lib/supabaseClient";
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { novelId: string } }) {
  
  const {data:novel,error:novelError} = await getNovel(params.novelId);

  novel.tags = novel.novel_tags.map(({tags})=>tags);

  novel.chapters = getSortedChapters(novel.chapters);

  if (novelError) {
    throw error(404, 'Novel not found');
  }

  return {
    novel
  };
}