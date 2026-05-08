import { getAuthUser } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { logError } from '$lib/errorLogger';
import { WEBSITE_NAME } from '$lib/constants';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET(event: RequestEvent) {
  try {
    const user = await getAuthUser(event.request);

    if (!user) {
        return json({ error: 'User not authenticated' }, { status: 401 });
    }

    return json({currentUser: user});
  } catch (error) {
    console.error('GET /api/user:', error);
    await logError(error, { request: event.request }, `${WEBSITE_NAME} - 获取用户信息失败`);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
