import { sendEmail } from './email';
import { WEBSITE_NAME } from './constants';
import { HOST_URL } from '$env/static/private';

export interface ErrorContext {
  request?: Request;
  userId?: string;
  planId?: string;
  additionalInfo?: Record<string, any>;
}

export async function logError(
  error: unknown,
  context: ErrorContext = {},
  customSubject?: string
): Promise<void> {
  try {
    const subject = customSubject || `${WEBSITE_NAME} - 错误日志通知`;

    let requestData = 'N/A';
    if (context.request) {
      try {
        requestData = String(await context.request.json());
      } catch (e) {
        requestData = 'Could not parse request body';
      }
    }

    const errorHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #B91C1C; text-align: center;">${WEBSITE_NAME} - 系统错误</h1>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca;">
          <h2 style="color: #991b1b;">错误详情</h2>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #fecaca;">
            <h3 style="margin: 0; color: #991b1b;">基本信息：</h3>
            <p><strong>时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
            ${context.userId ? `<p><strong>用户ID：</strong>${context.userId}</p>` : ''}
            ${context.planId ? `<p><strong>计划ID：</strong>${context.planId}</p>` : ''}

            <h3 style="margin: 20px 0 10px 0; color: #991b1b;">请求数据：</h3>
            <pre style="background-color: #f9fafb; padding: 10px; overflow-x: auto; font-size: 12px; max-height: 200px;">${requestData}</pre>

            <h3 style="margin: 20px 0 10px 0; color: #991b1b;">错误信息：</h3>
            <p style="color: #dc2626;">${error instanceof Error ? error.message : String(error)}</p>

            <h3 style="margin: 20px 0 10px 0; color: #991b1b;">错误堆栈：</h3>
            <pre style="background-color: #f9fafb; padding: 10px; overflow-x: auto; font-size: 12px; max-height: 400px;">${error instanceof Error ? error.stack : 'No stack trace available'}</pre>

            ${context.additionalInfo ? `
              <h3 style="margin: 20px 0 10px 0; color: #991b1b;">附加信息：</h3>
              <pre style="background-color: #f9fafb; padding: 10px; overflow-x: auto; font-size: 12px;">${JSON.stringify(context.additionalInfo, null, 2)}</pre>
            ` : ''}
          </div>
          <p style="color: #991b1b; font-weight: bold;">请及时查看并处理此问题。</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${HOST_URL}"
               style="background-color: #B91C1C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              登录管理后台
            </a>
          </div>
        </div>
      </div>
    `;

    await sendEmail('weisen.li@hotmail.com', subject, errorHtml);
  } catch (emailError) {
    console.error('Failed to send error log email:', emailError);
  }
}
