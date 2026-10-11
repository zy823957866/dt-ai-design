/**
 * 生成唯一 ID
 * 格式：前缀_时间戳(16进制)+随机数(16进制)
 */
export function generateId(prefix = 'layer'): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${timestamp}${random}`;
}
