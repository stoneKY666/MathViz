/**
 * post-processor.ts - HTML 后处理器
 *
 * 对生成的交互式 HTML 执行后处理流水线：
 *   1. LaTeX 分隔符转换：将 $...$ 转为 \(...\)，$$...$$ 转为 \[...\]
 *   2. KaTeX 注入：如果 HTML 未包含 KaTeX，自动注入 KaTeX CSS 和 JS CDN 链接
 *   3. 保护 <script> 和 <style> 标签内的内容不被分隔符转换影响
 * 确保生成的 HTML 能正确渲染数学公式。
 *
 * @exports postProcessInteractiveHtml - 执行 HTML 后处理的主函数
 */

export function postProcessInteractiveHtml(html: string): string {
  let processed = convertLatexDelimiters(html);
  if (!processed.toLowerCase().includes('katex')) {
    processed = injectKatex(processed);
  }
  return processed;
}

function convertLatexDelimiters(html: string): string {
  const scriptBlocks: string[] = [];
  let processed = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, (match) => {
    scriptBlocks.push(match);
    return `__SCRIPT_BLOCK_${scriptBlocks.length - 1}__`;
  });
  processed = processed.replace(/\$\$([^$]+)\$\$/g, '\\[$1\\]');
  processed = processed.replace(/\$([^$\n]+?)\$/g, '\\($1\\)');
  for (let i = 0; i < scriptBlocks.length; i++) {
    processed = processed.replace(`__SCRIPT_BLOCK_${i}__`, scriptBlocks[i]);
  }
  return processed;
}

function injectKatex(html: string): string {
  const katexInjection = `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<script>
document.addEventListener("DOMContentLoaded", function() {
  const options = {
    delimiters: [
      {left: '\\\\[', right: '\\\\]', display: true},
      {left: '\\\\(', right: '\\\\)', display: false},
      {left: '$$', right: '$$', display: true},
      {left: '$', right: '$', display: false}
    ],
    throwOnError: false,
    strict: false,
    trust: true
  };
  renderMathInElement(document.body, options);
  const observer = new MutationObserver(() => renderMathInElement(document.body, options));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
});
</script>`;

  const headCloseIdx = html.indexOf('</head>');
  if (headCloseIdx !== -1) {
    return `${html.substring(0, headCloseIdx)}${katexInjection}\n</head>${html.substring(headCloseIdx + 7)}`;
  }
  const bodyCloseIdx = html.indexOf('</body>');
  if (bodyCloseIdx !== -1) {
    return `${html.substring(0, bodyCloseIdx)}${katexInjection}\n</body>${html.substring(bodyCloseIdx + 7)}`;
  }
  return `${html}${katexInjection}`;
}
