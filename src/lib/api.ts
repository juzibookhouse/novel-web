import { PUBLIC_SUPABASE_URL } from "$env/static/public"

export function getAuthToken() {
  const authorizationKey = PUBLIC_SUPABASE_URL.split('https://')[1].split('.')[0];
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(`sb-${authorizationKey}-auth-token`);
}

/**
 * 封装 fetch 方法，提供统一的请求处理逻辑
 * @param url 请求地址
 * @param options 请求配置
 * @returns Promise<Response>
 */
export async function sendRequest(url: string, options?: RequestInit) {
  // 从 localStorage 获取 Supabase 密钥

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();

    return {response,data};
  } catch (error) {
    console.error('Request error:', error);
    return {error};
  }
}
