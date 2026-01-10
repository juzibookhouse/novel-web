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