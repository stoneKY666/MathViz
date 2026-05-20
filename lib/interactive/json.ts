/**
 * json.ts - JSON 响应解析器
 *
 * 从 LLM 响应中提取并解析 JSON 数据。
 * 处理多种边界情况：
 *   1. 直接尝试 JSON.parse 整个响应
 *   2. 查找第一个 '{' 和最后一个 '}' 之间的内容进行解析
 *   3. 处理 markdown 代码块包裹的 JSON
 * 返回解析后的泛型对象，或 null（解析失败）。
 *
 * @exports parseJsonResponse - 从 LLM 响应中解析 JSON 的泛型函数
 */

export function parseJsonResponse<T>(response: string): T | null {
  const trimmed = response.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    try {
      return JSON.parse(trimmed.slice(first, last + 1)) as T;
    } catch {
      return null;
    }
  }
}
