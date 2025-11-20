import { supabase } from "$lib/supabaseClient";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAuthUser } from "$lib/server/auth";

export const GET: RequestHandler = async ({ url, request }) => {
  const month = url.searchParams.get("month");
  const filter = url.searchParams.get("filter");

  if (!month || !filter) {
    return json({ error: "Missing required parameters: month and filter" }, { status: 400 });
  }

  const {isAdmin} = await getAuthUser(request);
  if (!isAdmin) {
    return json({ error: 'User not authenticated' }, { status: 401 });
  }

  try {
    const startDate = new Date(month + "-01");
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    let query = supabase
      .from('reading_records')
      .select(`
        id,
        reading_time,
        user_profiles (
          id,
          user_name
        ),
        novels (
          id,
          title,
          user_id,
          user_profiles (
            id,
            user_name
          )
        )
      `)
      .eq('date', month);

    const { data, error } = await query;

    if (error) throw error;

    // 根据选择的过滤方式处理数据
    const aggregatedData = new Map();

    data.forEach((record: any) => {
      let key, displayName;
      
      if (filter === 'user') {
        key = record.user_profiles.id;
        displayName = record.user_profiles.user_name;
      } else if (filter === 'novel') {
        key = record.novels.id;
        displayName = record.novels.title;
      } else if (filter === 'author') {
        key = record.novels.user_id;
        displayName = record.novels.user_profiles.pen_name || record.novels.user_profiles.user_name;
      }
      
      if (!aggregatedData.has(key)) {
        aggregatedData.set(key, {
          name: displayName,
          totalTime: 0,
        });
      }

      const entry = aggregatedData.get(key);
      entry.totalTime += record.reading_time;
    });

    const result = Array.from(aggregatedData.values())
      .sort((a, b) => b.totalTime - a.totalTime);

    return json(result);
  } catch (e: any) {
    return json({ error: e.message }, { status: 500 });
  }
};