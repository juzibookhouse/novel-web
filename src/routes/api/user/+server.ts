import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET(event: RequestEvent) {
    // 从会话或请求中获取当前用户信息
    const user = event.locals.user;

    if (!user) {
        return json({ error: 'User not authenticated' }, { status: 401 });
    }

    return json(user);
}
