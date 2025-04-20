import { supabase } from "$lib/supabaseClient";
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const email = formData.get('email') as string;

    if (!title || !content || !email) {
      return fail(400, { error: '请填写所有必填字段' });
    }

    const { error } = await supabase
      .from('contact_forms')
      .insert([{ title, content, email }]);

    if (error) {
      return fail(500, { error: '提交失败，请稍后重试' });
    }

    return { success: true };
  }
} satisfies Actions;