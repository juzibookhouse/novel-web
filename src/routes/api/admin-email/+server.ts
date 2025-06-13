import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL } from '$env/static/private';
import { WEBSITE_NAME } from '$lib/constants';

const resend = new Resend(RESEND_API_KEY);

type EmailType = 'new_user' | 'new_author' | 'new_contact_form' | 'new_subscription';

interface EmailData {
  type: EmailType;
  username?: string;
  email?: string;
  role?: string;
  message?: string;
  subject?: string;
}

export async function POST({ request }) {
  try {
    const { type, ...data } = await request.json() as EmailData;

    if (!ADMIN_EMAIL) {
      return json({ error: 'Admin email not configured' }, { status: 500 });
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'new_user':
        subject = `${WEBSITE_NAME} - 新用户注册通知`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #B91C1C; text-align: center;">${WEBSITE_NAME}</h1>
            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
              <h2>新用户注册通知</h2>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin: 0;">用户信息：</h3>
                <p>用户名: ${data.username}</p>
                <p>邮箱: ${data.email}</p>
                <p>角色: ${data.role}</p>
              </div>
              <p>请登录管理后台查看详情。</p>
            </div>
          </div>
        `;
        break;

      case 'new_author':
        subject = `${WEBSITE_NAME} - 新作者申请通知`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #B91C1C; text-align: center;">${WEBSITE_NAME}</h1>
            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
              <h2>新作者申请</h2>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin: 0;">申请人信息：</h3>
                <p>用户名: ${data.username}</p>
                <p>邮箱: ${data.email}</p>
              </div>
              <p>请登录管理后台审核申请。</p>
            </div>
          </div>
        `;
        break;

      case 'new_contact_form':
        subject = data.subject || `${WEBSITE_NAME} - 新的联系表单提交`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #B91C1C; text-align: center;">${WEBSITE_NAME}</h1>
            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
              <h2>新的联系表单</h2>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p>${data.message}</p>
              </div>
              <p>请及时回复处理。</p>
            </div>
          </div>
        `;
        break;

      case 'new_subscription':
        subject = `${WEBSITE_NAME} - 新订阅通知`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #B91C1C; text-align: center;">${WEBSITE_NAME}</h1>
            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
              <h2>新订阅</h2>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p>邮箱: ${data.email}</p>
              </div>
              <p>该用户已订阅网站更新。</p>
            </div>
          </div>
        `;
        break;

      default:
        return json({ error: 'Invalid email type' }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject,
      html
    });

    if (error) {
      console.error('Error sending admin email:', error);
      return json({ error: 'Failed to send email' }, { status: 500 });
    }

    return json({ success: true });
  } catch (err) {
    console.error('Admin email API error:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}