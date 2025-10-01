import { getAuthUser } from "$lib/server/auth";
import { supabase } from "$lib/supabaseClient";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
  try {
    const user = await getAuthUser(event.request);
    
    if (!user?.isAdmin) {
      return json({ error: 'User not authenticated' }, { status: 401 });
    }
    const { data: tagsData, error: tagsError } = await supabase
      .from("tags")
      .select(
        `
          *,
          user_profiles (
            user_name
          )
        `,
      )
      .order("name");

    if (tagsError) throw tagsError;

    const tags = tagsData.map(({ id, name, user_profiles }) => ({
      id,
      name,
      user_name: user_profiles ? user_profiles.user_name : "",
    }));

    return json({tags})
  } catch (error) {
    console.error(error);
    return json({error: ""},{status:500})
  }
};
