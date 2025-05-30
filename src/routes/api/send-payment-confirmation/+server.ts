import { json } from '@sveltejs/kit';
import { sendPaymentConfirmationEmail } from '$lib/email';

export async function POST({ request }) {
  try {
    const { user, plan, amount } = await request.json();
    await sendPaymentConfirmationEmail(user, plan, amount);
    return json({ success: true });
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return json({ error: 'Failed to send payment confirmation' }, { status: 500 });
  }
}