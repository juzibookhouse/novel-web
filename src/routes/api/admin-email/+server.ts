import { json } from '@sveltejs/kit';
import { sendAdminEmail } from '$lib/email';

export async function POST({ request }) {
  try {
    const { type, ...data } = await request.json();

    await sendAdminEmail(type, data);

    return json({ success: true });
  } catch (err) {
    console.error('Admin email API error:', err);
    const status = (err as any)?.status || 500;
    return json({ error: (err as any)?.message || 'Internal server error' }, { status });
  }
}