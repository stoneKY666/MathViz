/**
 * 文件名称：run-experiments.ts
 * 文件作用：MathViz 实验主控脚本，运行 M0-M3 全部实验批次并输出汇总报告
 * 实现方式：直接导入库函数（无需 HTTP 服务器），实现四种配置（A/B/C/D）
 *          与两种消融实验（无科学模型、无自动修复），对比不同流水线策略的效果；
 *          支持 --block 和 --dry-run 参数，结果增量写入 results/ 目录
 *
 * 用法：npx tsx scripts/run-experiments.ts [--block M0|M1|M2|M3|all] [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Load .env.local ──────────────────────────────────────────────────────────
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

import {
  generateInteractivePage,
  buildScientificModel,
  generateHtmlFromModel,
  validateInteractiveHtml,
  postProcessInteractiveHtml,
  buildPrompt,
  parseJsonResponse,
  callLlmWithModelConfig,
  type GenerateInteractivePageInput,
  type InteractiveAgentDependencies,
  type ModelConfig,
  type ScientificModel,
} from '../lib/interactive';
import { extractHtmlDocument } from '../lib/interactive/html-extractor';

// ─── Constants ─────────────────────────────────────────────────────────────────

const RESULTS_DIR = path.resolve(__dirname, '..', '..', '..', 'results');
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

// 50 test concepts: 5 categories × 10 each
const CONCEPTS_50: { name: string; subject: string }[] = [
  // Physics (10)
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
  // Math (10)
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
  // Statistics (10)
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
  // Computer Science (10)
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
  // Chemistry (10)
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

// 10 representative concepts for multi-model (Block 4)
const CONCEPTS_10 = [
  CONCEPTS_50[0],  // 简谐运动
  CONCEPTS_50[2],  // 电场线
  CONCEPTS_50[10], // 二次函数图像
  CONCEPTS_50[13], // 傅里叶级数
  CONCEPTS_50[20], // 正态分布
  CONCEPTS_50[23], // 马尔可夫链
  CONCEPTS_50[30], // 冒泡排序
  CONCEPTS_50[32], // Dijkstra算法
  CONCEPTS_50[40], // 化学平衡
  CONCEPTS_50[41], // 分子运动
];

// 5 sanity concepts
const CONCEPTS_5 = [
  CONCEPTS_50[0],  // 简谐运动
  CONCEPTS_50[10], // 二次函数图像
  CONCEPTS_50[20], // 正态分布
  CONCEPTS_50[30], // 冒泡排序
  CONCEPTS_50[40], // 化学平衡
];

// ─── Model configs ─────────────────────────────────────────────────────────────

function getModelConfig(provider: string = 'openai', model: string = ''): ModelConfig {
  const providerUpper = provider.toUpperCase();
  const apiKey = process.env[`${providerUpper}_API_KEY`] || process.env.OPENAI_API_KEY || '';
  const baseUrl = process.env[`${providerUpper}_BASE_URL`] || process.env.OPENAI_BASE_URL || '';

  // Default model from env
  if (!model) {
    const defaultModel = process.env.DEFAULT_MODEL || 'openai:gpt-4o';
    const parts = defaultModel.split(':');
    model = parts.length > 1 ? parts[1] : parts[0];
  }

  return {
    providerId: provider,
    model,
    apiKey,
    baseUrl,
    requiresApiKey: true,
  };
}

function resolveModelFromString(modelString: string): ModelConfig {
  const [provider, ...rest] = modelString.split(':');
  const model = rest.join(':');
  return getModelConfig(provider || 'openai', model);
}

// ─── Dependency factory ────────────────────────────────────────────────────────

function createDeps(
  modelConfig: ModelConfig,
  options: {
    skipScientificModel?: boolean;
    skipRepair?: boolean;
    maxRepair?: number;
  } = {},
): InteractiveAgentDependencies {
  let callCount = 0;

  return {
    aiCall: async (systemPrompt: string, userPrompt: string): Promise<string> => {
      callCount++;
      console.log(`    [LLM call #${callCount}] ${systemPrompt.substring(0, 40)}...`);
      return callLlmWithModelConfig(modelConfig, systemPrompt, userPrompt);
    },
    buildPrompt: (promptId, variables) => {
      if (options.skipScientificModel && promptId === 'interactive-scientific-model') {
        return null;
      }
      if (options.skipRepair && promptId === 'interactive-html-repair') {
        return null;
      }
      return buildPrompt(promptId, variables);
    },
    parseJsonResponse,
    postProcessHtml: postProcessInteractiveHtml,
  };
}

// ─── Experiment implementations ─────────────────────────────────────────────────

interface ExperimentResult {
  concept: string;
  subject: string;
  config: string;
  success: boolean;
  llmCalls: number;
  firstPassSuccess: boolean;
  finalSuccess: boolean;
  errors: string[];
  warnings: string[];
  scientificModel?: ScientificModel;
  timestamp: string;
  elapsedMs: number;
}

/**
 * Config A: Direct generation (no scientific model, no guard, no repair)
 */
async function runConfigA(
  concept: { name: string; subject: string },
  modelConfig: ModelConfig,
): Promise<ExperimentResult> {
  const start = Date.now();
  let callCount = 0;

  try {
    const input: GenerateInteractivePageInput = {
      conceptName: concept.name,
      subject: concept.subject,
      language: 'zh-CN',
    };

    // Directly call LLM to generate HTML — skip everything
    const defaultDesignIdea = `Create an interactive animation for "${concept.name}" about ${concept.subject}.`;
    const prompts = buildPrompt('interactive-html', {
      conceptName: concept.name,
      subject: concept.subject,
      conceptOverview: `An interactive animated learning page about "${concept.name}".`,
      keyPoints: '',
      scientificConstraints: 'No specific scientific constraints available.',
      designIdea: defaultDesignIdea,
      language: 'zh-CN',
    });

    if (!prompts) throw new Error('Prompt build failed');

    callCount++;
    const response = await callLlmWithModelConfig(modelConfig, prompts.system, prompts.user);
    const html = extractHtmlDocument(response);

    if (!html) {
      return {
        concept: concept.name, subject: concept.subject, config: 'A',
        success: false, llmCalls: callCount, firstPassSuccess: false,
        finalSuccess: false, errors: ['HTML extraction failed'],
        warnings: [], timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
      };
    }

    const processed = postProcessInteractiveHtml(html);
    const diagnostics = validateInteractiveHtml(processed);

    return {
      concept: concept.name, subject: concept.subject, config: 'A',
      success: diagnostics.valid, llmCalls: callCount,
      firstPassSuccess: diagnostics.valid, finalSuccess: diagnostics.valid,
      errors: diagnostics.errors, warnings: diagnostics.warnings,
      timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  } catch (error) {
    return {
      concept: concept.name, subject: concept.subject, config: 'A',
      success: false, llmCalls: callCount, firstPassSuccess: false,
      finalSuccess: false, errors: [String(error)],
      warnings: [], timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  }
}

/**
 * Config B: Structured prompt + quality guard (no repair)
 */
async function runConfigB(
  concept: { name: string; subject: string },
  modelConfig: ModelConfig,
): Promise<ExperimentResult> {
  const start = Date.now();
  let callCount = 0;

  try {
    const defaultDesignIdea = `Create an interactive animation for "${concept.name}" about ${concept.subject}.`;

    // Step 1: Scientific model
    const modelPrompts = buildPrompt('interactive-scientific-model', {
      subject: concept.subject,
      conceptName: concept.name,
      conceptOverview: `An interactive animated learning page about "${concept.name}".`,
      keyPoints: '',
      designIdea: defaultDesignIdea,
    });

    let scientificModel: ScientificModel | undefined;
    if (modelPrompts) {
      try {
        callCount++;
        const modelResponse = await callLlmWithModelConfig(modelConfig, modelPrompts.system, modelPrompts.user);
        scientificModel = parseJsonResponse<ScientificModel>(modelResponse) || undefined;
      } catch {
        // Continue without scientific model
      }
    }

    // Step 2: Generate HTML
    const toSciConstraints = (m?: ScientificModel): string => {
      if (!m) return 'No specific scientific constraints available.';
      const lines: string[] = [];
      if (m.core_formulas?.length) lines.push(`Core Formulas: ${m.core_formulas.join('; ')}`);
      if (m.mechanism?.length) lines.push(`Mechanisms: ${m.mechanism.join('; ')}`);
      if (m.constraints?.length) lines.push(`Must Obey: ${m.constraints.join('; ')}`);
      if (m.forbidden_errors?.length) lines.push(`Forbidden Errors: ${m.forbidden_errors.join('; ')}`);
      return lines.join('\n') || 'No specific scientific constraints available.';
    };

    const htmlPrompts = buildPrompt('interactive-html', {
      conceptName: concept.name,
      subject: concept.subject,
      conceptOverview: `An interactive animated learning page about "${concept.name}".`,
      keyPoints: '',
      scientificConstraints: toSciConstraints(scientificModel),
      designIdea: defaultDesignIdea,
      language: 'zh-CN',
    });

    if (!htmlPrompts) throw new Error('HTML prompt build failed');

    callCount++;
    const htmlResponse = await callLlmWithModelConfig(modelConfig, htmlPrompts.system, htmlPrompts.user);
    const rawHtml = extractHtmlDocument(htmlResponse);

    if (!rawHtml) {
      return {
        concept: concept.name, subject: concept.subject, config: 'B',
        success: false, llmCalls: callCount, firstPassSuccess: false,
        finalSuccess: false, errors: ['HTML extraction failed'],
        warnings: [], scientificModel, timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
      };
    }

    const processed = postProcessInteractiveHtml(rawHtml);
    const diagnostics = validateInteractiveHtml(processed);

    return {
      concept: concept.name, subject: concept.subject, config: 'B',
      success: diagnostics.valid, llmCalls: callCount,
      firstPassSuccess: diagnostics.valid, finalSuccess: diagnostics.valid,
      errors: diagnostics.errors, warnings: diagnostics.warnings,
      scientificModel, timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  } catch (error) {
    return {
      concept: concept.name, subject: concept.subject, config: 'B',
      success: false, llmCalls: callCount, firstPassSuccess: false,
      finalSuccess: false, errors: [String(error)],
      warnings: [], timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  }
}

/**
 * Config C: Simple retry (no scientific model, no guard feedback, retry up to maxRetries)
 */
async function runConfigC(
  concept: { name: string; subject: string },
  modelConfig: ModelConfig,
  maxRetries: number = 3,
): Promise<ExperimentResult> {
  const start = Date.now();
  let callCount = 0;
  let firstPassSuccess = false;

  try {
    const defaultDesignIdea = `Create an interactive animation for "${concept.name}" about ${concept.subject}.`;
    let lastErrors: string[] = [];
    let lastWarnings: string[] = [];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const prompts = buildPrompt('interactive-html', {
        conceptName: concept.name,
        subject: concept.subject,
        conceptOverview: `An interactive animated learning page about "${concept.name}".`,
        keyPoints: '',
        scientificConstraints: 'No specific scientific constraints available.',
        designIdea: defaultDesignIdea,
        language: 'zh-CN',
      });

      if (!prompts) throw new Error('Prompt build failed');

      callCount++;
      const response = await callLlmWithModelConfig(modelConfig, prompts.system, prompts.user);
      const html = extractHtmlDocument(response);

      if (!html) {
        lastErrors = ['HTML extraction failed'];
        continue;
      }

      const processed = postProcessInteractiveHtml(html);
      const diagnostics = validateInteractiveHtml(processed);

      if (attempt === 0) firstPassSuccess = diagnostics.valid;

      if (diagnostics.valid) {
        return {
          concept: concept.name, subject: concept.subject, config: `C(${maxRetries})`,
          success: true, llmCalls: callCount, firstPassSuccess,
          finalSuccess: true, errors: [], warnings: diagnostics.warnings,
          timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
        };
      }

      lastErrors = diagnostics.errors;
      lastWarnings = diagnostics.warnings;
    }

    return {
      concept: concept.name, subject: concept.subject, config: `C(${maxRetries})`,
      success: false, llmCalls: callCount, firstPassSuccess,
      finalSuccess: false, errors: lastErrors, warnings: lastWarnings,
      timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  } catch (error) {
    return {
      concept: concept.name, subject: concept.subject, config: `C(${maxRetries})`,
      success: false, llmCalls: callCount, firstPassSuccess,
      finalSuccess: false, errors: [String(error)], warnings: [],
      timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  }
}

/**
 * Config D: Full four-stage pipeline (scientific model + HTML + quality guard + auto repair)
 * Uses the core generateInteractivePage function directly.
 */
async function runConfigD(
  concept: { name: string; subject: string },
  modelConfig: ModelConfig,
): Promise<ExperimentResult> {
  const start = Date.now();
  let callCount = 0;

  try {
    const input: GenerateInteractivePageInput = {
      conceptName: concept.name,
      subject: concept.subject,
      language: 'zh-CN',
    };

    const deps: InteractiveAgentDependencies = {
      aiCall: async (systemPrompt: string, userPrompt: string) => {
        callCount++;
        console.log(`    [LLM call #${callCount}] ${systemPrompt.substring(0, 40)}...`);
        return callLlmWithModelConfig(modelConfig, systemPrompt, userPrompt);
      },
      buildPrompt: (id, vars) => buildPrompt(id, vars),
      parseJsonResponse,
      postProcessHtml: postProcessInteractiveHtml,
    };

    const result = await generateInteractivePage(input, deps);

    // We need to figure out if the first attempt passed (before repair)
    // Since generateInteractivePage handles repair internally, we check warnings for repair clues
    const hadRepair = result.warnings.some(w => w.includes('auto-repair'));
    const firstPassSuccess = !hadRepair && result.diagnostics.valid;

    return {
      concept: concept.name, subject: concept.subject, config: 'D',
      success: result.diagnostics.valid, llmCalls: callCount,
      firstPassSuccess, finalSuccess: result.diagnostics.valid,
      errors: result.diagnostics.errors, warnings: result.warnings,
      scientificModel: result.scientificModel,
      timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  } catch (error) {
    return {
      concept: concept.name, subject: concept.subject, config: 'D',
      success: false, llmCalls: callCount, firstPassSuccess: false,
      finalSuccess: false, errors: [String(error)], warnings: [],
      timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  }
}

/**
 * Ablation: No scientific model (skip stage 1, keep guard + repair)
 */
async function runAblationNoModel(
  concept: { name: string; subject: string },
  modelConfig: ModelConfig,
): Promise<ExperimentResult> {
  const start = Date.now();
  let callCount = 0;

  try {
    const input: GenerateInteractivePageInput = {
      conceptName: concept.name,
      subject: concept.subject,
      language: 'zh-CN',
    };

    const deps: InteractiveAgentDependencies = {
      aiCall: async (systemPrompt: string, userPrompt: string) => {
        callCount++;
        console.log(`    [LLM call #${callCount}] ${systemPrompt.substring(0, 40)}...`);
        return callLlmWithModelConfig(modelConfig, systemPrompt, userPrompt);
      },
      buildPrompt: (id, vars) => {
        // Skip scientific model — return null to bypass
        if (id === 'interactive-scientific-model') return null;
        return buildPrompt(id, vars);
      },
      parseJsonResponse,
      postProcessHtml: postProcessInteractiveHtml,
    };

    const result = await generateInteractivePage(input, deps);
    const hadRepair = result.warnings.some(w => w.includes('auto-repair'));
    const firstPassSuccess = !hadRepair && result.diagnostics.valid;

    return {
      concept: concept.name, subject: concept.subject, config: 'ablation_no_model',
      success: result.diagnostics.valid, llmCalls: callCount,
      firstPassSuccess, finalSuccess: result.diagnostics.valid,
      errors: result.diagnostics.errors, warnings: result.warnings,
      scientificModel: result.scientificModel,
      timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  } catch (error) {
    return {
      concept: concept.name, subject: concept.subject, config: 'ablation_no_model',
      success: false, llmCalls: callCount, firstPassSuccess: false,
      finalSuccess: false, errors: [String(error)], warnings: [],
      timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  }
}

/**
 * Ablation: No repair (keep scientific model + guard, but skip repair)
 */
async function runAblationNoRepair(
  concept: { name: string; subject: string },
  modelConfig: ModelConfig,
): Promise<ExperimentResult> {
  const start = Date.now();
  let callCount = 0;

  try {
    const input: GenerateInteractivePageInput = {
      conceptName: concept.name,
      subject: concept.subject,
      language: 'zh-CN',
    };

    // Step 1: Scientific model
    let scientificModel: ScientificModel | undefined;
    const modelPrompts = buildPrompt('interactive-scientific-model', {
      subject: concept.subject,
      conceptName: concept.name,
      conceptOverview: `An interactive animated learning page about "${concept.name}".`,
      keyPoints: '',
      designIdea: `Create an interactive animation for "${concept.name}" about ${concept.subject}.`,
    });

    if (modelPrompts) {
      try {
        callCount++;
        const modelResponse = await callLlmWithModelConfig(modelConfig, modelPrompts.system, modelPrompts.user);
        scientificModel = parseJsonResponse<ScientificModel>(modelResponse) || undefined;
      } catch { /* continue */ }
    }

    // Step 2: Generate HTML
    const toSciConstraints = (m?: ScientificModel): string => {
      if (!m) return 'No specific scientific constraints available.';
      const lines: string[] = [];
      if (m.core_formulas?.length) lines.push(`Core Formulas: ${m.core_formulas.join('; ')}`);
      if (m.mechanism?.length) lines.push(`Mechanisms: ${m.mechanism.join('; ')}`);
      if (m.constraints?.length) lines.push(`Must Obey: ${m.constraints.join('; ')}`);
      if (m.forbidden_errors?.length) lines.push(`Forbidden Errors: ${m.forbidden_errors.join('; ')}`);
      return lines.join('\n') || 'No specific scientific constraints available.';
    };

    const htmlPrompts = buildPrompt('interactive-html', {
      conceptName: concept.name,
      subject: concept.subject,
      conceptOverview: `An interactive animated learning page about "${concept.name}".`,
      keyPoints: '',
      scientificConstraints: toSciConstraints(scientificModel),
      designIdea: `Create an interactive animation for "${concept.name}" about ${concept.subject}.`,
      language: 'zh-CN',
    });

    if (!htmlPrompts) throw new Error('HTML prompt build failed');

    callCount++;
    const htmlResponse = await callLlmWithModelConfig(modelConfig, htmlPrompts.system, htmlPrompts.user);
    const rawHtml = extractHtmlDocument(htmlResponse);

    if (!rawHtml) {
      return {
        concept: concept.name, subject: concept.subject, config: 'ablation_no_repair',
        success: false, llmCalls: callCount, firstPassSuccess: false,
        finalSuccess: false, errors: ['HTML extraction failed'],
        warnings: [], scientificModel, timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
      };
    }

    const processed = postProcessInteractiveHtml(rawHtml);
    const diagnostics = validateInteractiveHtml(processed);

    return {
      concept: concept.name, subject: concept.subject, config: 'ablation_no_repair',
      success: diagnostics.valid, llmCalls: callCount,
      firstPassSuccess: diagnostics.valid, finalSuccess: diagnostics.valid,
      errors: diagnostics.errors, warnings: diagnostics.warnings,
      scientificModel, timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  } catch (error) {
    return {
      concept: concept.name, subject: concept.subject, config: 'ablation_no_repair',
      success: false, llmCalls: callCount, firstPassSuccess: false,
      finalSuccess: false, errors: [String(error)], warnings: [],
      timestamp: new Date().toISOString(), elapsedMs: Date.now() - start,
    };
  }
}

// ─── Summary helpers ───────────────────────────────────────────────────────────

function summarizeResults(results: ExperimentResult[], label: string) {
  const total = results.length;
  const firstPassSuccesses = results.filter(r => r.firstPassSuccess).length;
  const finalSuccesses = results.filter(r => r.finalSuccess).length;
  const totalCalls = results.reduce((sum, r) => sum + r.llmCalls, 0);
  const avgCalls = total > 0 ? (totalCalls / total).toFixed(2) : '0';

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${label} Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total concepts tested:  ${total}`);
  console.log(`  First-pass success:     ${firstPassSuccesses}/${total} (${(100 * firstPassSuccesses / total).toFixed(1)}%)`);
  console.log(`  Final success:          ${finalSuccesses}/${total} (${(100 * finalSuccesses / total).toFixed(1)}%)`);
  console.log(`  Total LLM calls:        ${totalCalls}`);
  console.log(`  Avg LLM calls/concept:  ${avgCalls}`);
  console.log(`  Avg elapsed time:       ${(results.reduce((s, r) => s + r.elapsedMs, 0) / total / 1000).toFixed(1)}s`);
  console.log(`${'='.repeat(60)}\n`);

  return { total, firstPassSuccesses, finalSuccesses, totalCalls, avgCalls };
}

// ─── Main orchestrator ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const blockArg = args.find(a => a.startsWith('--block='))?.split('=')[1]
    || args[args.indexOf('--block') + 1]
    || 'all';
  const dryRun = args.includes('--dry-run');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MathViz Experiment Runner');
  console.log(`  Block: ${blockArg}  |  Dry-run: ${dryRun}`);
  console.log(`  API Key: ${process.env.OPENAI_API_KEY ? '✓ configured' : '✗ MISSING'}`);
  console.log(`  Base URL: ${process.env.OPENAI_BASE_URL || '(default)'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set. Check .env.local.');
    process.exit(1);
  }

  const defaultModel = process.env.DEFAULT_MODEL || 'openai:gpt-4o';
  const modelConfig = resolveModelFromString(defaultModel);
  console.log(`Using model: ${modelConfig.providerId}:${modelConfig.model}\n`);

  const allResults: ExperimentResult[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // ─── M0: Sanity Check ──────────────────────────────────────────────
  if (blockArg === 'all' || blockArg === 'M0') {
    console.log('🔬 M0: Sanity Check (5 concepts, Config D)');
    if (dryRun) {
      console.log('  [DRY RUN] Would test:', CONCEPTS_5.map(c => c.name).join(', '));
    } else {
      const results: ExperimentResult[] = [];
      for (const concept of CONCEPTS_5) {
        console.log(`  Testing: ${concept.name} (${concept.subject})...`);
        const result = await runConfigD(concept, modelConfig);
        results.push(result);
        console.log(`    → ${result.success ? '✅ PASS' : '❌ FAIL'} (${result.llmCalls} calls, ${(result.elapsedMs / 1000).toFixed(1)}s)`);
        if (!result.success) {
          console.log(`    Errors: ${result.errors.join('; ')}`);
        }
      }
      summarizeResults(results, 'M0: Sanity Check');
      allResults.push(...results);
      fs.writeFileSync(
        path.join(RESULTS_DIR, `M0_sanity_${timestamp}.json`),
        JSON.stringify(results, null, 2),
      );
    }
  }

  // ─── M1: Baseline Config A/B/C/D ──────────────────────────────────
  if (blockArg === 'all' || blockArg === 'M1') {
    console.log('📊 M1: Baseline Experiments (50 concepts × 4 configs)');

    if (dryRun) {
      console.log('  [DRY RUN] Would test Config A/B/C/D on 50 concepts');
    } else {
      // Config A
      console.log('\n  ── Config A: Direct generation (no model/guard/repair) ──');
      const resultsA: ExperimentResult[] = [];
      for (let i = 0; i < CONCEPTS_50.length; i++) {
        const concept = CONCEPTS_50[i];
        console.log(`  [${i + 1}/50] ${concept.name} (${concept.subject})...`);
        const result = await runConfigA(concept, modelConfig);
        resultsA.push(result);
        console.log(`    → ${result.success ? '✅' : '❌'} (${result.llmCalls} calls)`);
      }
      const summaryA = summarizeResults(resultsA, 'M1: Config A (Direct)');
      fs.writeFileSync(
        path.join(RESULTS_DIR, `M1_config_A_${timestamp}.json`),
        JSON.stringify({ summary: summaryA, results: resultsA }, null, 2),
      );
      allResults.push(...resultsA);

      // Config B
      console.log('\n  ── Config B: Structured prompt + guard ──');
      const resultsB: ExperimentResult[] = [];
      for (let i = 0; i < CONCEPTS_50.length; i++) {
        const concept = CONCEPTS_50[i];
        console.log(`  [${i + 1}/50] ${concept.name} (${concept.subject})...`);
        const result = await runConfigB(concept, modelConfig);
        resultsB.push(result);
        console.log(`    → ${result.success ? '✅' : '❌'} (${result.llmCalls} calls)`);
      }
      const summaryB = summarizeResults(resultsB, 'M1: Config B (Prompt+Guard)');
      fs.writeFileSync(
        path.join(RESULTS_DIR, `M1_config_B_${timestamp}.json`),
        JSON.stringify({ summary: summaryB, results: resultsB }, null, 2),
      );
      allResults.push(...resultsB);

      // Config C
      console.log('\n  ── Config C: Simple retry (≤3) ──');
      const resultsC: ExperimentResult[] = [];
      for (let i = 0; i < CONCEPTS_50.length; i++) {
        const concept = CONCEPTS_50[i];
        console.log(`  [${i + 1}/50] ${concept.name} (${concept.subject})...`);
        const result = await runConfigC(concept, modelConfig, 3);
        resultsC.push(result);
        console.log(`    → ${result.success ? '✅' : '❌'} (${result.llmCalls} calls)`);
      }
      const summaryC = summarizeResults(resultsC, 'M1: Config C (Simple Retry ≤3)');
      fs.writeFileSync(
        path.join(RESULTS_DIR, `M1_config_C_${timestamp}.json`),
        JSON.stringify({ summary: summaryC, results: resultsC }, null, 2),
      );
      allResults.push(...resultsC);

      // Config D
      console.log('\n  ── Config D: Full pipeline ──');
      const resultsD: ExperimentResult[] = [];
      for (let i = 0; i < CONCEPTS_50.length; i++) {
        const concept = CONCEPTS_50[i];
        console.log(`  [${i + 1}/50] ${concept.name} (${concept.subject})...`);
        const result = await runConfigD(concept, modelConfig);
        resultsD.push(result);
        console.log(`    → ${result.success ? '✅' : '❌'} (${result.llmCalls} calls)`);
      }
      const summaryD = summarizeResults(resultsD, 'M1: Config D (Full Pipeline)');
      fs.writeFileSync(
        path.join(RESULTS_DIR, `M1_config_D_${timestamp}.json`),
        JSON.stringify({ summary: summaryD, results: resultsD }, null, 2),
      );
      allResults.push(...resultsD);
    }
  }

  // ─── M2: Ablation ─────────────────────────────────────────────────
  if (blockArg === 'all' || blockArg === 'M2') {
    console.log('🔬 M2: Ablation Experiments (50 concepts × 2 variants)');

    if (dryRun) {
      console.log('  [DRY RUN] Would test ablation variants on 50 concepts');
    } else {
      // No scientific model
      console.log('\n  ── Ablation: No scientific model ──');
      const resultsNoModel: ExperimentResult[] = [];
      for (let i = 0; i < CONCEPTS_50.length; i++) {
        const concept = CONCEPTS_50[i];
        console.log(`  [${i + 1}/50] ${concept.name} (${concept.subject})...`);
        const result = await runAblationNoModel(concept, modelConfig);
        resultsNoModel.push(result);
        console.log(`    → ${result.success ? '✅' : '❌'} (${result.llmCalls} calls)`);
      }
      const summaryNoModel = summarizeResults(resultsNoModel, 'M2: Ablation — No Scientific Model');
      fs.writeFileSync(
        path.join(RESULTS_DIR, `M2_ablation_no_model_${timestamp}.json`),
        JSON.stringify({ summary: summaryNoModel, results: resultsNoModel }, null, 2),
      );
      allResults.push(...resultsNoModel);

      // No repair
      console.log('\n  ── Ablation: No auto-repair ──');
      const resultsNoRepair: ExperimentResult[] = [];
      for (let i = 0; i < CONCEPTS_50.length; i++) {
        const concept = CONCEPTS_50[i];
        console.log(`  [${i + 1}/50] ${concept.name} (${concept.subject})...`);
        const result = await runAblationNoRepair(concept, modelConfig);
        resultsNoRepair.push(result);
        console.log(`    → ${result.success ? '✅' : '❌'} (${result.llmCalls} calls)`);
      }
      const summaryNoRepair = summarizeResults(resultsNoRepair, 'M2: Ablation — No Auto-Repair');
      fs.writeFileSync(
        path.join(RESULTS_DIR, `M2_ablation_no_repair_${timestamp}.json`),
        JSON.stringify({ summary: summaryNoRepair, results: resultsNoRepair }, null, 2),
      );
      allResults.push(...resultsNoRepair);
    }
  }

  // ─── M3: Config C+ (extended retry ≤5) ─────────────────────────────
  if (blockArg === 'all' || blockArg === 'M3') {
    console.log('📊 M3: Extended Retry Strategy (50 concepts, ≤5 retries)');

    if (dryRun) {
      console.log('  [DRY RUN] Would test Config C+(≤5) on 50 concepts');
    } else {
      const resultsCPlus: ExperimentResult[] = [];
      for (let i = 0; i < CONCEPTS_50.length; i++) {
        const concept = CONCEPTS_50[i];
        console.log(`  [${i + 1}/50] ${concept.name} (${concept.subject})...`);
        const result = await runConfigC(concept, modelConfig, 5);
        resultsCPlus.push(result);
        console.log(`    → ${result.success ? '✅' : '❌'} (${result.llmCalls} calls)`);
      }
      const summaryCPlus = summarizeResults(resultsCPlus, 'M3: Config C+ (Simple Retry ≤5)');
      fs.writeFileSync(
        path.join(RESULTS_DIR, `M3_config_C_plus_${timestamp}.json`),
        JSON.stringify({ summary: summaryCPlus, results: resultsCPlus }, null, 2),
      );
      allResults.push(...resultsCPlus);
    }
  }

  // ─── Final Summary ─────────────────────────────────────────────────
  if (allResults.length > 0) {
    const byConfig: Record<string, ExperimentResult[]> = {};
    for (const r of allResults) {
      if (!byConfig[r.config]) byConfig[r.config] = [];
      byConfig[r.config].push(r);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📋 FULL EXPERIMENT SUMMARY');
    console.log('═'.repeat(60));
    for (const [config, results] of Object.entries(byConfig)) {
      const total = results.length;
      const fp = results.filter(r => r.firstPassSuccess).length;
      const fn = results.filter(r => r.finalSuccess).length;
      const calls = results.reduce((s, r) => s + r.llmCalls, 0);
      console.log(`  Config ${config.padEnd(25)} │ 1st-pass: ${(100 * fp / total).toFixed(1).padStart(5)}% │ Final: ${(100 * fn / total).toFixed(1).padStart(5)}% │ Calls: ${calls.toString().padStart(4)} │ N=${total}`);
    }
    console.log('═'.repeat(60));

    // Save combined summary
    fs.writeFileSync(
      path.join(RESULTS_DIR, `FULL_summary_${timestamp}.json`),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        model: `${modelConfig.providerId}:${modelConfig.model}`,
        byConfig: Object.fromEntries(
          Object.entries(byConfig).map(([k, v]) => [k, {
            total: v.length,
            firstPass: v.filter(r => r.firstPassSuccess).length,
            finalPass: v.filter(r => r.finalSuccess).length,
            totalCalls: v.reduce((s, r) => s + r.llmCalls, 0),
          }]),
        ),
      }, null, 2),
    );
  }

  console.log(`\n✅ All results saved to: ${RESULTS_DIR}`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
