
import { createClient, type User } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public"
import type { Chapter, NewNovel } from "./novel";
import { getMemberShipEndDate } from "./membership";

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getCategories = async () => {
  return await supabase
    .from("categories")
    .select("*")
    .order("name");
}

export const getTags = async () => {
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
      ),
      categories (
        id,name
      ),
      novel_tags (
        tags (
          id,name
        )
      )
    `)
    .eq('id', novelId)
    .single();
}

async function uploadCover(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `novel-covers/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('covers')
    .upload(filePath, file, {
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('covers')
    .getPublicUrl(filePath);

  return publicUrl;
}


export const upsertNovel = async (user:User, newNovel:NewNovel) => {
  let cover_url = newNovel.cover_url;
  if (newNovel.cover_file) {
    cover_url = await uploadCover(newNovel.cover_file);
  }
  let novelId = newNovel.id;
  if (!novelId) {
    // Insert new novel
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .insert([{
        title: newNovel.title,
        description: newNovel.description,
        status: newNovel.status,
        is_free: newNovel.is_free,
        category_id: newNovel.category_id,
        cover_url,
        user_id: user.id
      }])
      .select()
      .single();

    if (novelError) throw novelError;
    novelId = novel.id;
  } else {
    // Update existing novel
    const { error: updateError } = await supabase
      .from('novels')
      .update({
        title: newNovel.title,
        description: newNovel.description,
        category_id: newNovel.category_id,
        status: newNovel.status,
        is_free: newNovel.is_free,
        cover_url,
      })
      .eq('id', novelId);

    if (updateError) throw updateError;
  }

  // Delete existing tags
  if (novelId) {
    await supabase
      .from('novel_tags')
      .delete()
      .eq('novel_id', novelId);
  }

  // Insert new tags
  if (newNovel.tags.length > 0) {
    const tagLinks = newNovel.tags.map(tagId => ({
      novel_id: novelId,
      tag_id: tagId
    }));

    const { error: tagError } = await supabase
      .from('novel_tags')
      .insert(tagLinks);

    if (tagError) throw tagError;
  }
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


export const upsertMembership = async({user, selectedPlan,clientSecret}) => {
  if (user?.membership) {
    // update existing subscription
    return await supabase
      .from('user_memberships')
      .update({ 
        status: 'pending', 
        end_date: getMemberShipEndDate(selectedPlan.duration)}).
      eq('id', user.membership.id);
  } else {
    return await supabase
      .from('user_memberships')
      .insert([{
        stripe_client_secret: clientSecret,
        user_id: user?.id,
        plan_id: selectedPlan.id,
        status: 'pending',
        end_date: getMemberShipEndDate(selectedPlan.duration)
      }]);
      
    
  }
}