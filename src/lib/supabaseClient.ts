
import { createClient, type User } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public"
import type { Chapter, NewNovel } from "./novel";
import { getMemberShipEndDate } from "./membership";
import type { UserData } from "./stores/authStore";

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

export const getUserProfile = async (user_id: string) => {
  return await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user_id)
    .single();
}

export const updateUserProfile = async (user_id: string, updates: { email?: string, ip?: string }) => {
  return await supabase
    .from("user_profiles")
    .update(updates)
    .eq("user_id", user_id);
}

export const getNovels = async ({ search, category, status, start, end }: SearchNovelsParams) => {
  let query = supabase.from("novels").select(
    `
      id,
      title,
      description,
      cover_url,
      status,
      category_id,
      categories!inner (
        id,name
      ),
      chapters (
        title
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

  query = query.eq("published", true).eq("chapters.chapter_order", 1);

  const { data: novels, error, count } = await query.order("updated_at", { ascending: false });
  // Clean up the novels data to remove the nested structure
  const cleanedNovels =
    novels?.map((novel) => ({
      ...novel,
      tags: novel.novel_tags.map((nc: any) => nc.tags),
    })) || [];
  return { data: cleanedNovels, error, count };
}

export const getAuthorNovels = async (user: UserData) => {
  let query = supabase
    .from('novels')
    .select(`
          *,
          chapters (
            *
          ),
          novel_tags (
            tags (
              id,
              name
            )
          )
        `);
  if (user?.profile?.role === 'author') {
    query = query.eq('user_id', user?.id);
  }

  return await query.order('updated_at', { ascending: false });

}

export const getNovel = async (novelId: string) => {
  return await supabase
    .from('novels')
    .select(`
      *,
      chapters (
        id,
        title,
        content,
        published,
        is_free,
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


export const upsertNovel = async (user: User, newNovel: NewNovel) => {
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
        published: newNovel.published,
        category_id: newNovel.category_id,
        cover_url,
        user_id: user.id,
        pen_name: newNovel.pen_name || null,
        updated_at: new Date()
      }])
      .select()
      .single();

    if (novelError) throw novelError;
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
        published: newNovel.published,
        cover_url,
        pen_name: newNovel.pen_name || null,
        // updated_at: new Date()
      })
      .eq('id', novelId);

    if (updateError) throw updateError;

    //clear all chapter quotation
    await supabase
      .from('chapters')
      .update({
        quotation: null
      })
      .eq('novel_id',newNovel.id);

    const quotation = newNovel?.quotation?.trim();
    const quotation_chapter_id = newNovel?.quotation_chapter_id;
    if (quotation && quotation_chapter_id) {
      await supabase
      .from('chapters')
      .update({
        quotation
      })
      .eq('id',quotation_chapter_id);
    }
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
    novel_id,
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

export const getQuotationChapters = async () => {
  return await supabase
    .from('chapters')
    .select(`
      id, title, quotation, novel_id,
      novels (
        id, title
      )
    `)
    .neq('quotation', null)
    .eq('published', true)
    ;
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
        is_free: newChapter.is_free,
        quotation: newChapter.quotation,
        published: newChapter.published,
        updated_at: new Date()
      })
      .eq('id', newChapter.id);

  } else {
    await supabase.from('novels')
      .update({
        updated_at: new Date()
      })
      .eq('id', newChapter.novel_id);
    // Create new chapter
    return await supabase
      .from('chapters')
      .insert([{
        title: newChapter.title,
        content: newChapter.content,
        is_free: newChapter.is_free,
        quotation: newChapter.quotation,
        published: newChapter.published,
        novel_id: newChapter.novel_id,
        chapter_order: newChapter.chapter_order
      }])
      .select();
  }
}


export const upsertMembership = async ({ user, selectedPlan, clientSecret }) => {
  if (user?.membership) {
    // update existing subscription
    return await supabase
      .from('user_memberships')
      .update({
        status: 'pending',
        end_date: getMemberShipEndDate(selectedPlan.duration)
      }).
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

export const getContactForms = async () => {
  return await supabase
    .from('contact_forms')
    .select('*')
    .order('created_at');
}

export const checkUserNovel = async (user, novelId) => {
  // Check if novel is in bookshelf
  return await supabase
    .from("bookshelves")
    .select()
    .eq("user_id", user.id)
    .eq("novel_id", novelId)
    .single();
}

export const addUserNovel = async (user, novelId) => {
  await supabase.from("bookshelves").insert({
    user_id: user.id,
    novel_id: novelId,
  });
}

export const removeUserNovel = async (user, novelId) => {
  await supabase
    .from("bookshelves")
    .delete()
    .eq("user_id", user.id)
    .eq("novel_id", novelId);
}

export const getAdminNovels = async () => {
  // const {data, error} = await supabase
  //   .from("reading_records")
  //   .select(`
  //     reading_time.max(), novel_id, user_id,
  //     novels (
  //       id,title
  //     )
  //   `);
  // Load novels
  const { data: novelsData, error: novelsError } = await supabase.from(
    "novels",
  ).select(`
    id,
    title,
    status,
    created_at,
    reading_records (
      reading_time
    )
  `);
  let adminNovels = [];
  if (novelsData?.length > 0) {
    adminNovels = novelsData.map(novel => {
      return {
        ...novel,
        readingTime: novel.reading_records?.length > 0 ? novel.reading_records[0].reading_time : 0
      }
    });
  }
  return { data: adminNovels, error: novelsError };
}

export const fetchAdminAuthors = async () => {
  // Load authors from user_profiles
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      novels (
        id,
        reading_records (
          reading_time
        )
      ),
      published_website,
      published_pen_name,
      published_work_title,
      planned_work_description,
      draft_file_path
    `)
    .eq('role', 'author');

  if (error) {
    return {data, error};
  }

  let authors = [];
  if (data?.length > 0) {
    authors = data.map(({id,user_name,created_at,is_approved,novels,email,ip,published_website,published_pen_name,published_work_title,planned_work_description,draft_file_path}) => {
      return {
        id,
        user_name,
        created_at,
        is_approved,
        email,
        ip,
        published_website,
        published_pen_name,
        published_work_title,
        planned_work_description,
        draft_file_path,
        novelCount: novels?.length,
        novelReadingTime: novels.reduce((acc, novel)=>{
          if (novel.reading_records.length > 0) {
            return acc + novel.reading_records[0].reading_time;
          } else {
            return acc;
          }
        },0)
      }
    });
  }
  return {data:authors};
}

export const upsertChapterReadingRecords = async(chapter, readingTime, user) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const curDate = `${year}-${(month < 10 ? '0'+month : month)}`;
  console.log(curDate);
  
  const {data:readingRecord,error} = await supabase
    .from('reading_records')
    .select('*')
    .eq('novel_id',chapter.novels.id)
    .eq('user_id',user.id)
    .eq('date',curDate)
    .single();
  
  if (readingRecord) {
    await supabase
      .from('reading_records')
      .update({
        'reading_time': readingRecord.reading_time + readingTime
      })
      .eq('id', readingRecord.id)
  } else {
    await supabase.from("reading_records").insert({
      novel_id: chapter.novels.id,
      reading_time: readingTime,
      user_id: user.id,
      date: curDate
    });
  }
}