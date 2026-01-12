import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL, HOST_URL } from '$env/static/private';
import { WEBSITE_NAME } from './constants';

const resend = new Resend(RESEND_API_KEY);

export async function sendPaymentConfirmationEmail(user: any, plan: any, amount: number|string) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: `${WEBSITE_NAME} - 会员订阅确认`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #B91C1C; text-align: center;">${WEBSITE_NAME}</h1>
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
            <h2>您好 ${user.profile?.user_name}，</h2>
            <p>感谢您订阅${WEBSITE_NAME}会员服务！</p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin: 0;">订阅详情：</h3>
              <p>会员计划：${plan.name}</p>
              <p>支付金额：${amount}</p>
              <p>有效期至：${new Date(user.membership?.end_date).toLocaleDateString('zh-CN')}</p>
            </div>
            <p>您现在可以畅享所有会员专属内容。</p>
            <p>如有任何问题，请随时联系我们。</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${HOST_URL}" 
                 style="background-color: #B91C1C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                开始阅读
              </a>
            </div>
          </div>
          <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
            此邮件由系统自动发送，请勿回复
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export type EmailType = 'new_user' | 'new_author' | 'new_contact_form' | 'new_subscription';

export interface EmailData {
  username?: string;
  email?: string;
  role?: string;
  message?: string;
  subject?: string;
}

export async function sendAdminEmail(type: EmailType, data: EmailData = {}) {
  try {
    if (!ADMIN_EMAIL) {
      const err = new Error('Admin email not configured');
      (err as any).status = 500;
      throw err;
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

      default: {
        const err = new Error('Invalid email type');
        (err as any).status = 400;
        throw err;
      }
    }

    const { data: sendData, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject,
      html
    });

    if (error) {
      console.error('Error sending admin email:', error);
      const err = new Error('Failed to send email');
      (err as any).status = 500;
      throw err;
    }

    return sendData;
  } catch (error) {
    console.error('sendAdminEmail error:', error);
    throw error;
  }
}