/**
 * api/interactive/post-process/route.ts - HTML 后处理 API
 *
 * POST /api/interactive/post-process — 独立的 HTML 后处理端点。
 * 接收原始 HTML，执行后处理流水线（LaTeX 分隔符转换、KaTeX CSS/JS 注入），
 * 同时运行质量校验并返回诊断信息（valid、errors、warnings）。
 * 用于调试或单独测试后处理逻辑。
 */

import { NextRequest, NextResponse } from 'next/server';
import { postProcessInteractiveHtml, validateInteractiveHtml } from '@/lib/interactive';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { html?: string };
  if (!body.html?.trim()) {
    return NextResponse.json(
      { success: false, error: 'MISSING_REQUIRED_FIELD', details: 'html is required' },
      { status: 400 },
    );
  }
  const html = postProcessInteractiveHtml(body.html);
  return NextResponse.json({
    success: true,
    data: {
      html,
      diagnostics: validateInteractiveHtml(html),
    },
  });
}
