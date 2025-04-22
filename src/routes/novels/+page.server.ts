import { supabase } from "$lib/supabaseClient";

export async function load({ url }: { url: URL }) {
  const page = Number(url.searchParams.get('page')) || 1;
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';
  const status = url.searchParams.get('status') || '';
  const pageSize = 12;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from('novels')
    .select(`
      *,
      novel_categories!inner (
        categories!inner (
          id,
          name
        )
      )
    `, { count: 'exact' });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  if (category) {
    query = query.eq('novel_categories.categories.name', category);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: novels, count, error } = await query
    .range(start, end)
    .order('created_at', { ascending: false });

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  // Clean up the novels data to remove the nested structure
  const cleanedNovels = novels?.map(novel => ({
    ...novel,
    categories: novel.novel_categories.map((nc: any) => nc.categories)
  })) || [];

  return {
    novels: cleanedNovels,
    totalPages: Math.ceil((count || 0) / pageSize),
    currentPage: page,
    categories: categories || [],
    search,
    selectedCategory: category,
    selectedStatus: status
  };
}