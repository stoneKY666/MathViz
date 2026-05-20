/**
 * 文件名称：run-exp.js
 * 文件作用：MathViz 实验运行器（单次调用模式），批量生成 50 个概念的交互式可视化
 * 实现方式：采用单次 LLM 调用（而非两阶段），为每个概念生成完整 HTML 页面；
 *          支持 M0/M1/M2 分批运行，包含 HTML 提取、验证、重试和增量保存机制
 */

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

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL;
const MODEL = 'mimo-v2.5-pro';
const RESULTS_DIR = path.join(__dirname, '..', 'results');

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
  timeout: 300000,
});

const CONCEPTS_50 = [
  { name: '简谐运动', subject: '物理' },
  { name: '抛体运动', subject: '物理' },
  { name: '电场线', subject: '物理' },
  { name: '电磁感应', subject: '物理' },
  { name: '光的干涉', subject: '物理' },
  { name: '万有引力', subject: '物理' },
  { name: '驻波', subject: '物理' },
  { name: '多普勒效应', subject: '物理' },
  { name: '热传导', subject: '物理' },
  { name: '角动量守恒', subject: '物理' },
  { name: '二次函数图像', subject: '数学' },
  { name: '三角函数', subject: '数学' },
  { name: '极坐标', subject: '数学' },
  { name: '傅里叶级数', subject: '数学' },
  { name: '矩阵变换', subject: '数学' },
  { name: '泰勒展开', subject: '数学' },
  { name: '梯度场', subject: '数学' },
  { name: '分形', subject: '数学' },
  { name: '向量场', subject: '数学' },
  { name: '拓扑变换', subject: '数学' },
  { name: '正态分布', subject: '统计' },
  { name: '中心极限定理', subject: '统计' },
  { name: '贝叶斯定理', subject: '统计' },
  { name: '马尔可夫链', subject: '统计' },
  { name: '泊松分布', subject: '统计' },
  { name: '假设检验', subject: '统计' },
  { name: '回归分析', subject: '统计' },
  { name: '蒙特卡洛模拟', subject: '统计' },
  { name: '协方差矩阵', subject: '统计' },
  { name: '置信区间', subject: '统计' },
  { name: '冒泡排序', subject: '计算机' },
  { name: '二叉树遍历', subject: '计算机' },
  { name: 'Dijkstra算法', subject: '计算机' },
  { name: '哈夫曼编码', subject: '计算机' },
  { name: '快速排序', subject: '计算机' },
  { name: '动态规划', subject: '计算机' },
  { name: '递归', subject: '计算机' },
  { name: '图的广度优先搜索', subject: '计算机' },
  { name: '堆排序', subject: '计算机' },
  { name: 'KMP字符串匹配', subject: '计算机' },
  { name: '化学平衡', subject: '化学' },
  { name: '分子运动', subject: '化学' },
  { name: '酸碱滴定曲线', subject: '化学' },
  { name: '分子轨道理论', subject: '化学' },
  { name: '电化学电池', subject: '化学' },
  { name: '化学反应速率', subject: '化学' },
  { name: '晶体结构', subject: '化学' },
  { name: '气体扩散', subject: '化学' },
  { name: '电子云', subject: '化学' },
  { name: '相图', subject: '化学' },
];

// Combined prompt: single call generates both model + HTML
function buildSystemPrompt() {
  return [
    '# Interactive Learning Page Generator',
    '',
    'You are an expert in scientific education and web development.',
    'Create a complete self-contained HTML5 interactive animation page.',
    '',
    'Requirements:',
    '- Full HTML with <!DOCTYPE html>, html/head/body tags',
    '- Use Tailwind CSS via CDN',
    '- Pure JavaScript (no frameworks)',
    '- At least one clear animation using requestAnimationFrame or @keyframes',
    '- Interactive controls (play/pause/reset sliders or buttons)',
    '- Scientifically accurate visualization',
    '- Clean state/update/render architecture',
    '- No eval() or new Function()',
    '',
    'Output ONLY the raw HTML code. No markdown, no explanation, no code blocks.',
  ].join('\n');
}

function buildUserPrompt(concept) {
  return [
    'Create an interactive animated learning page for:',
    '',
    'Concept: ' + concept.name,
    'Subject: ' + concept.subject,
    '',
    'The page should visually demonstrate the key principles of ' + concept.name + ',',
    'allowing users to interact with parameters and see real-time changes.',
    'Use Chinese text for all UI labels.',
    'Output ONLY the HTML code starting with <!DOCTYPE html>.',
  ].join('\n');
}

// HTML extraction
function extractHtml(text) {
  // Strip markdown code blocks
  var cleaned = text.replace(/^```(?:html)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '');

  var match = cleaned.match(/<!DOCTYPE[\s\S]*?<\/html>/i);
  if (match) return match[0];

  match = cleaned.match(/<html[\s\S]*?<\/html>/i);
  if (match) return match[0];

  match = text.match(/<!DOCTYPE[\s\S]*?<\/html>/i);
  if (match) return match[0];

  match = text.match(/<html[\s\S]*?<\/html>/i);
  if (match) return match[0];

  var body = cleaned.match(/<body[\s\S]*?<\/body>/i);
  if (body) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Interactive</title><script src="https://cdn.tailwindcss.com"></script></head>' + body[0] + '</html>';
  }

  return null;
}

// Validation
function validateHtml(html) {
  var errors = [];
  var warnings = [];

  if (!html.match(/<!doctype html>/i)) errors.push('Missing DOCTYPE');
  if (!html.includes('<canvas') && !html.includes('<svg')) warnings.push('No canvas/SVG');
  if (!html.includes('requestAnimationFrame') && !html.includes('setInterval') && !html.includes('setTimeout') && !html.includes('@keyframes')) warnings.push('No animation');
  if (!html.includes('addEventListener') && !html.includes('onclick') && !html.includes('oninput')) warnings.push('No controls');
  if (html.includes('eval(') || html.includes('new Function(')) errors.push('Security issue');

  return { passed: errors.length === 0, errors: errors, warnings: warnings };
}

// Call LLM with retries
function callLlm(system, user, retries) {
  retries = retries || 2;
  return new Promise(function(resolve, reject) {
    var attempt = 0;
    function tryOnce() {
      attempt++;
      console.log('    [API] Call attempt ' + attempt + '...');
      client.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 16000,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }).then(function(response) {
        var content = response.choices[0].message.content;
        var finishReason = response.choices[0].finish_reason;
        var usage = response.usage;
        console.log('    [API] finish_reason=' + finishReason + ' tokens=' + (usage ? usage.completion_tokens : '?') + ' content_len=' + (content ? content.length : 0));

        if (!content || content.trim().length === 0) {
          console.error('    [API] Empty response!');
          if (attempt <= retries) {
            console.log('    [API] Retrying in 10s...');
            setTimeout(tryOnce, 10000);
          } else {
            reject(new Error('Empty response after ' + (retries+1) + ' attempts'));
          }
          return;
        }
        resolve(content);
      }).catch(function(err) {
        console.error('    [API] Error: ' + err.message);
        if (attempt <= retries) {
          var delay = attempt * 10000;
          console.log('    [API] Retrying in ' + (delay/1000) + 's...');
          setTimeout(tryOnce, delay);
        } else {
          reject(err);
        }
      });
    }
    tryOnce();
  });
}

// Generate single concept
function generateOne(concept, index, total) {
  var tag = '[' + (index + 1) + '/' + total + '] ' + concept.name;
  console.log(tag + ' — Starting...');
  var startTime = Date.now();

  return callLlm(buildSystemPrompt(), buildUserPrompt(concept))
    .then(function(response) {
      var html = extractHtml(response);
      if (!html) {
        console.error(tag + ' — HTML extraction failed. Response length: ' + response.length);
        console.error(tag + ' — First 200 chars: ' + response.substring(0, 200));
        return { concept: concept, status: 'error', error: 'HTML extraction failed', duration: (Date.now() - startTime) / 1000 };
      }

      var validation = validateHtml(html);
      var duration = (Date.now() - startTime) / 1000;

      console.log(tag + ' — OK in ' + duration.toFixed(1) + 's | HTML: ' + html.length + ' chars | Pass: ' + validation.passed);
      if (validation.warnings.length > 0) {
        console.log(tag + ' — Warnings: ' + validation.warnings.join('; '));
      }

      return {
        concept: concept,
        status: validation.passed ? 'success' : 'partial',
        htmlLength: html.length,
        validation: validation,
        duration: duration,
      };
    })
    .catch(function(err) {
      var duration = (Date.now() - startTime) / 1000;
      console.error(tag + ' — FAILED in ' + duration.toFixed(1) + 's: ' + err.message);
      return { concept: concept, status: 'error', error: err.message, duration: duration };
    });
}

// Run block sequentially
function runBlock(concepts, blockName) {
  console.log('\n' + '='.repeat(60));
  console.log('Block: ' + blockName + ' | ' + concepts.length + ' concepts');
  console.log('='.repeat(60) + '\n');

  var results = [];
  var chain = Promise.resolve();

  for (var i = 0; i < concepts.length; i++) {
    (function(idx) {
      chain = chain.then(function() {
        return generateOne(concepts[idx], idx, concepts.length);
      }).then(function(result) {
        results.push(result);
        // Save incrementally
        var outputFile = path.join(RESULTS_DIR, blockName + '.json');
        fs.writeFileSync(outputFile, JSON.stringify({
          block: blockName,
          timestamp: new Date().toISOString(),
          model: MODEL,
          total: concepts.length,
          completed: results.length,
          successCount: results.filter(function(r) { return r.status === 'success'; }).length,
          partialCount: results.filter(function(r) { return r.status === 'partial'; }).length,
          errorCount: results.filter(function(r) { return r.status === 'error'; }).length,
          results: results,
        }, null, 2));
        console.log('  [Saved ' + blockName + '.json — ' + results.length + '/' + concepts.length + ']');
      });
    })(i);
  }

  return chain.then(function() { return results; });
}

// Main
function main() {
  var block = process.argv[2] || 'M0';

  console.log('MathViz Experiment Runner');
  console.log('Block: ' + block + ' | Model: ' + MODEL + ' | API: ' + BASE_URL);
  console.log('');

  var concepts;
  switch (block) {
    case 'M0': concepts = CONCEPTS_50.slice(0, 5); break;
    case 'M1': concepts = CONCEPTS_50; break;
    case 'M2': concepts = CONCEPTS_50.slice(0, 20); break;
    default:
      if (block.indexOf('M0-') === 0) {
        concepts = [CONCEPTS_50[parseInt(block.split('-')[1]) || 0]];
      } else {
        concepts = CONCEPTS_50.slice(0, 5);
      }
  }

  return runBlock(concepts, block).then(function(results) {
    var success = results.filter(function(r) { return r.status === 'success'; }).length;
    var partial = results.filter(function(r) { return r.status === 'partial'; }).length;
    var errors = results.filter(function(r) { return r.status === 'error'; }).length;
    var avgDuration = results.reduce(function(a, r) { return a + r.duration; }, 0) / results.length;

    console.log('\n' + '='.repeat(60));
    console.log('Summary: ' + block);
    console.log('Total: ' + results.length + ' | Success: ' + success + ' | Partial: ' + partial + ' | Error: ' + errors);
    console.log('Avg Duration: ' + avgDuration.toFixed(1) + 's');
    console.log('='.repeat(60) + '\n');
  });
}

main().catch(function(err) {
  console.error('FATAL:', err);
  process.exit(1);
});
