/**
 * api/interactive/validate/route.ts - HTML 质量校验 API
 *
 * POST /api/interactive/validate — 独立的质量校验端点。
 * 接收 HTML 字符串，运行 quality-guard 检查（结构完整性、安全性、有效性），
 * 返回校验结果：valid（是否通过）、errors（致命错误列表）、warnings（警告列表）。
 * 用于调试或单独测试校验逻辑。
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInteractiveHtml } from '@/lib/interactive';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { html?: string };
  if (!body.html?.trim()) {
    return NextResponse.json(
      { success: false, error: 'MISSING_REQUIRED_FIELD', details: 'html is required' },
      { status: 400 },
    );
  }
  return NextResponse.json({
    success: true,
    data: validateInteractiveHtml(body.html),
  });
}
