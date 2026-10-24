import { verifyRequestIdentity, IdentityVerificationError } from "$lib/server/verifiedIdentity";
import { assertServerAdmin, AdminAuthorizationError } from "$lib/server/adminAuthorization";
import { supabase } from "$lib/supabaseClient";
import { logError } from "$lib/errorLogger";
import { WEBSITE_NAME } from "$lib/constants";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
  try {
    const user = await verifyRequestIdentity(event.request);
    assertServerAdmin(user.id);
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
    if (error instanceof IdentityVerificationError || error instanceof AdminAuthorizationError) {
      return json({ error: error.code, code: error.code }, { status: error.status });
    }
    console.error('GET /api/admin/tags:', error);
    await logError(error, { request: event.request }, `${WEBSITE_NAME} - 获取标签列表失败`);
    return json({error: ""},{status:500})
  }
};

export const POST: RequestHandler = async ({request}) => {
  try {
    const user = await verifyRequestIdentity(request);
    assertServerAdmin(user.id);

    const { name } = await request.json();
    if (!name) {
      return json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tags")
      .insert([{ name, user_id: user.id }])
      .select().single();

    if (error) throw error;

    return json({ tag: data }, { status: 201 });
  } catch (error) {
    if (error instanceof IdentityVerificationError || error instanceof AdminAuthorizationError) {
      return json({ error: error.code, code: error.code }, { status: error.status });
    }
    console.error('POST /api/admin/tags:', error);
    await logError(error, { request }, `${WEBSITE_NAME} - 创建标签失败`);
    return json({ error: "" }, { status: 500 });
  }
};
