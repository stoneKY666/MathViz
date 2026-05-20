/**
 * html-extractor.ts - HTML 文档提取器
 *
 * 从 LLM 响应文本中提取完整的 HTML 文档。
 * 处理多种边界情况：
 *   1. 直接查找 <!DOCTYPE html> 或 <html> 标签作为起始位置
 *   2. 从末尾反向搜索 </html> 作为结束位置
 *   3. 处理 markdown 代码块包裹（```html ... ```）
 *   4. 处理响应截断时的不完整 HTML
 * 返回提取到的完整 HTML 字符串，或 null（未找到有效 HTML）。
 *
 * @exports extractHtmlDocument - 从 LLM 响应中提取 HTML 文档
 */

export function extractHtmlDocument(response: string): string | null {
  // First, try to find the HTML content directly
  const doctypeStart = response.indexOf('<!DOCTYPE html>');
  const htmlTagStart = response.indexOf('<html');
  const start = doctypeStart !== -1 ? doctypeStart : htmlTagStart;

  if (start !== -1) {
    // Find the closing </html> tag, searching backwards from the end
    const htmlEnd = response.lastIndexOf('</html>');
    if (htmlEnd !== -1) {
      return response.substring(start, htmlEnd + 7);
    }
    // If we found the start but not the end, try searching for the end more broadly
    // This handles cases where the response might be truncated or incomplete
    const end = response.indexOf('</html>', start);
    if (end !== -1) {
      return response.substring(start, end + 7);
    }
    // If no closing tag found but we have a start, the response might be truncated
    // Try to return what we have (strip any markdown code block markers)
    const content = response.substring(start).trim();
    if (content.startsWith('<!DOCTYPE') || content.startsWith('<html')) {
      return content;
    }
  }

  // Try to extract from markdown code blocks
  // Handle both ```html and ``` (without language specifier)
  // The regex handles optional language specifier and captures everything between
  const codeBlockMatch = response.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const content = codeBlockMatch[1].trim();
    // Check if the extracted content contains HTML
    if (content.includes('<!DOCTYPE') || content.includes('<html')) {
      // Extract HTML from the code block content
      const innerDoctypeStart = content.indexOf('<!DOCTYPE html>');
      const innerHtmlTagStart = content.indexOf('<html');
      const innerStart = innerDoctypeStart !== -1 ? innerDoctypeStart : innerHtmlTagStart;
      if (innerStart !== -1) {
        const innerHtmlEnd = content.lastIndexOf('</html>');
        if (innerHtmlEnd !== -1) {
          return content.substring(innerStart, innerHtmlEnd + 7);
        }
        // No closing tag found, return what we have
        return content.substring(innerStart);
      }
      // If the code block content is the HTML itself
      return content;
    }
  }

  // Handle cases where HTML is embedded in other text
  const trimmed = response.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    // Find the end of HTML document
    const htmlEnd = trimmed.lastIndexOf('</html>');
    if (htmlEnd !== -1) {
      return trimmed.substring(0, htmlEnd + 7);
    }
    // Return what we have even without closing tag
    return trimmed;
  }

  // Last resort: search for <html anywhere in the response
  const htmlMatch = response.match(/<html[\s>][\s\S]*?<\/html>/i);
  if (htmlMatch) {
    return htmlMatch[0];
  }

  // Final attempt: find any <html> tag and try to extract what follows
  const anyHtmlMatch = response.match(/<html[^>]*>[\s\S]*$/i);
  if (anyHtmlMatch) {
    return anyHtmlMatch[0];
  }

  return null;
}
