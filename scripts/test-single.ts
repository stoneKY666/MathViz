/**
 * 文件名称：test-single.ts
 * 文件作用：单概念端到端测试脚本，验证完整的交互式页面生成流水线
 * 实现方式：加载环境变量后，调用 generateInteractivePage 生成"简谐运动"页面，
 *          输出 HTML 长度、警告和诊断信息，结果保存至 results/test_single.json
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

console.log('[ENV CHECK]');
console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
console.log('DEFAULT_MODEL:', process.env.DEFAULT_MODEL);

async function main() {
  console.log('\n[IMPORT] Loading interactive module...');

  const interactive = await import('../lib/interactive');
  const generateInteractivePage = interactive.generateInteractivePage;
  const callLlmWithModelConfig = interactive.callLlmWithModelConfig;
  const buildPrompt = interactive.buildPrompt;
  const parseJsonResponse = interactive.parseJsonResponse;

  console.log('[IMPORT] Done.');

  const modelConfig = {
    providerId: 'openai',
    model: 'mimo-v2.5-pro',
    apiKey: process.env.OPENAI_API_KEY!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    requiresApiKey: true,
  };

  const deps = {
    aiCall: (system: string, user: string) => callLlmWithModelConfig(modelConfig, system, user),
    buildPrompt,
    parseJsonResponse,
    logger: {
      info: (msg: string) => console.log('[INFO]', msg),
      warn: (msg: string) => console.warn('[WARN]', msg),
      error: (msg: string) => console.error('[ERROR]', msg),
    },
  };

  const input = {
    conceptName: '简谐运动',
    subject: '物理',
  };

  console.log('\n[RUN] Generating interactive page for 简谐运动...');
  const startTime = Date.now();

  try {
    const result = await generateInteractivePage(input, deps);
    const elapsed = (Date.now() - startTime) / 1000;

    console.log(`\n[DONE] Completed in ${elapsed.toFixed(1)}s`);
    console.log('HTML length:', result.html.length);
    console.log('Warnings:', result.warnings);
    console.log('Diagnostics:', JSON.stringify(result.diagnostics));

    // Save result
    const resultsDir = path.resolve(__dirname, '..', 'results');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    fs.writeFileSync(
      path.join(resultsDir, 'test_single.json'),
      JSON.stringify(result, null, 2)
    );
    console.log('[SAVED] results/test_single.json');
  } catch (err) {
    const elapsed = (Date.now() - startTime) / 1000;
    console.error(`\n[ERROR] Failed after ${elapsed.toFixed(1)}s:`, err);
  }
}

main();
