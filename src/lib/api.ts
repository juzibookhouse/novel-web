import { PUBLIC_SUPABASE_URL } from "$env/static/public"

export class RequestError extends Error {
  status: number | null;
  code: string;
  constructor(status: number | null, code: string) {
    super(code);
    this.status = status;
    this.code = code;
    this.name = 'RequestError';
  }
}

export function getAuthToken() {
  const authorizationKey = PUBLIC_SUPABASE_URL.split('https://')[1].split('.')[0];
  if (typeof localStorage === 'undefined') return null;
  try {
    const storedSession = localStorage.getItem(`sb-${authorizationKey}-auth-token`);
    if (!storedSession) return null;
    const session = JSON.parse(storedSession);
    return typeof session.access_token === 'string' && session.access_token.trim()
      ? JSON.stringify({ access_token: session.access_token, ...(session.user?.id ? { user: { id: session.user.id } } : {}) }) : null;
  } catch {
    return null;
  }
}

/**
 * 封装 fetch 方法，提供统一的请求处理逻辑
 * @param url 请求地址
 * @param options 请求配置
 * @returns Promise<Response>
 */
export async function sendRequest(url: string, options?: RequestInit) {
  // 从 localStorage 获取 Supabase 密钥

  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!headers.has('Authorization')) {
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const mergedOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const code = typeof body?.code === 'string' ? body.code : 'request_failed';
      return { response, status: response.status, error: new RequestError(response.status, code) };
    }
    const data = await response.json();

    return { response, data, status: response.status };
  } catch {
    return { status: null, error: new RequestError(null, 'network_or_response_error') };
  }
}
