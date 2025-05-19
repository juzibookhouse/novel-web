/**
 * 获取用户当前的IP地址
 * @returns Promise<string> 返回用户的IP地址
 * @throws Error 如果获取IP地址失败
 */
export const getUserIp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    throw new Error('Failed to fetch IP address');
  }
};