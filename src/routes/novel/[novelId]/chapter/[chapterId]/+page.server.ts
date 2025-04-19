import { supabase } from "$lib/supabaseClient";
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { novelId: string; chapterId: string } }) {
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select(`
      *,
      novels (
        id,
        title
      )
    `)
    .eq('id', params.chapterId)
    .single();

  if (chapterError) {
    throw error(404, 'Chapter not found');
  }

  // Get previous and next chapters
  const { data: siblings } = await supabase
    .from('chapters')
    .select('id, chapter_order')
    .eq('novel_id', params.novelId)
    .order('chapter_order');

  if (!siblings) {
    throw error(404, 'Chapters not found');
  }
  const currentIndex = siblings?.findIndex(c => c.id === params.chapterId) ?? -1;
  const prevChapter = currentIndex > 0 ? siblings?.[currentIndex - 1] : null;
  const nextChapter = currentIndex < siblings?.length - 1 ? siblings?.[currentIndex + 1] : null;

  return {
    chapter,
    prevChapterId: prevChapter?.id,
    nextChapterId: nextChapter?.id,
    novelId: params.novelId
  };
}