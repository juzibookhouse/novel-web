import { getChapter, getChapterSilbings, supabase } from "$lib/supabaseClient";
import { error } from '@sveltejs/kit';

export async function load({ params, locals }: { params: { novelId: string; chapterId: string }, locals: App.Locals }) {
  const {data:chapter, error:chapterError} = await getChapter(params.chapterId);

  if (chapterError) {
    throw error(404, 'Chapter not found');
  }

  // normalize content: replace inline style attribute values with empty string and convert newlines to <br/>
  chapter.content = chapter.content
    .replace(/\sstyle\s*=\s*(["'])[\s\S]*?\1/gi, '');

  // Check if user is the author of the novel
  if (locals.user?.id) {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', locals.user.id)
      .single();

    if (userProfile?.role === 'author' && chapter.novels.user_id !== locals.user.id) {
      throw error(403, 'Authors can only read their own novels');
    }
  }

  // Get previous and next chapters
  const { data: siblings } = await getChapterSilbings(params.novelId);

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