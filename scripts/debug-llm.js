/**
 * 文件名称：debug-llm.js
 * 文件作用：调试 LLM 的 HTML 生成能力，验证 API 连通性和输出质量
 * 实现方式：使用 OpenAI SDK 发送两组测试请求（简单 HTML 和完整实验提示词），
 *          检查返回内容是否包含 DOCTYPE、闭合标签等关键结构，保存完整响应供检查
 */

// Debug: check what the LLM actually returns for HTML generation
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
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

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  timeout: 300000,
});

async function testLlm() {
  console.log('Testing LLM HTML generation...');
  console.log('API Key:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
  console.log('Base URL:', process.env.OPENAI_BASE_URL);

  // Try simple prompt first
  console.log('\n--- Test 1: Simple HTML generation ---');
  try {
    const resp1 = await client.chat.completions.create({
      model: 'mimo-v2.5-pro',
      temperature: 0.2,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: 'Return only HTML. No explanation.' },
        { role: 'user', content: 'Create a simple HTML page with a red circle that bounces up and down. Include <!DOCTYPE html> and full document.' },
      ],
    });
    const content1 = resp1.choices[0].message.content;
    console.log('Response length:', content1?.length);
    console.log('First 300 chars:', content1?.substring(0, 300));
    console.log('Has DOCTYPE:', content1?.includes('DOCTYPE'));
    console.log('Has </html>:', content1?.includes('</html>'));

    // Check finish reason
    console.log('Finish reason:', resp1.choices[0].finish_reason);
    console.log('Usage:', JSON.stringify(resp1.usage));
  } catch (err) {
    console.error('Test 1 FAILED:', err.message);
  }

  // Test the actual HTML generation prompt
  console.log('\n--- Test 2: Actual experiment prompt ---');
  try {
    const resp2 = await client.chat.completions.create({
      model: 'mimo-v2.5-pro',
      temperature: 0.2,
      max_tokens: 16000,
      messages: [
        { role: 'system', content: '# Interactive Learning Page Generator\n\nCreate a complete self-contained HTML5 document for the concept.\n\nRequirements:\n- Full HTML with <!DOCTYPE html>, html/head/body\n- Tailwind CDN only\n- Pure JavaScript\n- At least one clear animation\n- Controls for play/pause/reset + parameter control\n- requestAnimationFrame preferred\n- state/update/render structure\n- no eval/new Function\n- formulas use \\(...\\) and \\[...\\]\n\nReturn HTML only.' },
        { role: 'user', content: 'Create an interactive learning page.\n\nConcept Name: 简谐运动\nSubject: 物理\nConcept Overview: An interactive animated learning page about "简谐运动" with clear visual explanations and direct manipulation.\nScientific Constraints:\nCore formulas: x(t) = A*cos(ωt + φ); v(t) = -Aω*sin(ωt + φ)\nLanguage: zh-CN' },
      ],
    });
    const content2 = resp2.choices[0].message.content;
    console.log('Response length:', content2?.length);
    console.log('First 500 chars:', content2?.substring(0, 500));
    console.log('Finish reason:', resp2.choices[0].finish_reason);
    console.log('Usage:', JSON.stringify(resp2.usage));
    console.log('Has DOCTYPE:', content2?.includes('DOCTYPE'));
    console.log('Has </html>:', content2?.includes('</html>'));

    // Save full response for inspection
    fs.writeFileSync(path.join(__dirname, '..', 'results', 'debug_response.txt'), content2 || '(empty)');
    console.log('Saved full response to results/debug_response.txt');
  } catch (err) {
    console.error('Test 2 FAILED:', err.message);
  }
}

testLlm().catch(console.error);
