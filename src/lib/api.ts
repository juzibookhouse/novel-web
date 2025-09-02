/**
 * 封装 fetch 方法，提供统一的请求处理逻辑
 * @param url 请求地址
 * @param options 请求配置
 * @returns Promise<Response>
 */
export async function sendRequest(url: string, options?: RequestInit): Promise<Response> {
  // 从 localStorage 获取 Supabase 密钥
  const supabaseKey = typeof window !== 'undefined' ? localStorage.getItem('supabaseKey') : null;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(supabaseKey ? { 'Authorization': `Bearer ${supabaseKey}` } : {}),
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

    return response;
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
}
