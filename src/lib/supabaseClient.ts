
import { createClient, type User } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public"
import type { Chapter } from "./novel";

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getCategories = async () => {
  return await supabase
    .from("categories")
    .select("*")
    .order("name");
}

export const getTags = async() => {
  return await supabase.from("tags").select("*");
}

interface SearchNovelsParams {
  search?: string,
  category?: string,
  status?: string,
  start?: number,
  end?: number
}

export const getNovels = async ({ search, category, status, start, end }: SearchNovelsParams) => {
  let query = supabase.from("novels").select(
    `
      id,
      title,
      description,
      cover_url,
      status,
      categories (
        id,name
      ),
      novel_tags (
        tags!inner (
          id,
          name
        )
      )
    `,
    { count: "exact" },
  );

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (category) {
    query = query.eq("categories.name", category);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (start && end) {
    query = query.range(start, end);
  }

  return await query.order("created_at", { ascending: false });
}

export const getAuthorNovels = async (user: User) => {
  return await supabase
    .from('novels')
    .select(`
          id,
          title,
          description,
          status,
          user_id,
          is_free,
          created_at,
          category_id,
          cover_url,
          chapters (
            id,
            title,
            content,
            is_free,
            chapter_order,
            created_at
          ),
          novel_tags (
            tags (
              id,
              name
            )
          )
        `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });
}

export const getNovel = async (novelId: string) => {
  return await supabase
    .from('novels')
    .select(`
      *,
      chapters (
        id,
        title,
        created_at,
        chapter_order
      )
    `)
    .eq('id', novelId)
    .single();
}

export const getChapter = async (chapterId: string) => {
  return await supabase
    .from('chapters')
    .select(`
    id,
    title,
    content,
    is_free,
    updated_at,
    novels (
      id,
      title,
      is_free,
      user_id
    )
  `)
    .eq('id', chapterId)
    .single();
}

export const getChapterSilbings = async (novelId: string) => {
  return await supabase
    .from('chapters')
    .select('id, chapter_order')
    .eq('novel_id', novelId)
    .order('chapter_order');
}

export const upsertChapter = async (newChapter: Chapter) => {
  if (newChapter.id) {
    // Update existing chapter
    return await supabase
      .from('chapters')
      .update({
        title: newChapter.title,
        content: newChapter.content,
        is_free: newChapter.is_free
      })
      .eq('id', newChapter.id);

  } else {
    // Create new chapter
    return await supabase
      .from('chapters')
      .insert([{
        title: newChapter.title,
        content: newChapter.content,
        is_free: newChapter.is_free,
        novel_id: newChapter.novel_id,
        chapter_order: newChapter.chapter_order
      }])
      .select();
  }
}