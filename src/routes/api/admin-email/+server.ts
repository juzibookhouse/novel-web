import { json } from '@sveltejs/kit';
import { sendAdminEmail } from '$lib/email';
import { logError } from '$lib/errorLogger';
import { WEBSITE_NAME } from '$lib/constants';

export async function POST({ request }) {
  try {
    const { type, ...data } = await request.json();

    await sendAdminEmail(type, data);

    return json({ success: true });
  } catch (err) {
    console.error('POST /api/admin-email:', err);
    await logError(err, { request }, `${WEBSITE_NAME} - 发送管理员邮件失败`);
    const status = (err as any)?.status || 500;
    return json({ error: (err as any)?.message || 'Internal server error' }, { status });
  }
}