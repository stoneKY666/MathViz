/**
 * service.ts - 交互式可视化生成管线核心服务
 *
 * 编排多阶段生成流水线，将概念名称转换为完整的交互式 HTML 页面。
 * 处理流程：
 *   1. 输入规范化 — normalizeInput 补全默认值，inferConceptCategory 通过正则推断
 *      概念类别（physics/math/chemistry/cs/data/general），defaultDesignIdea 根据
 *      类别生成差异化的可视化策略
 *   2. 科学建模 — buildScientificModel 调用 LLM 生成结构化 JSON 约束
 *      （core_formulas、mechanism、constraints、forbidden_errors）
 *   3. HTML 生成 — generateHtmlFromModel 基于科学约束调用 LLM 生成完整 HTML
 *   4. 后处理 — 通过 deps.postProcessHtml 执行 LaTeX 转换和 KaTeX 注入
 *   5. 质量校验 — validateInteractiveHtml 检查结构完整性、安全性
 *   6. 自动修复 — 最多 MAX_REPAIR_ATTEMPTS（1次）修复尝试，将错误诊断反馈给 LLM
 * 采用依赖注入模式（InteractiveAgentDependencies），核心逻辑可脱离真实 LLM 调用进行测试。
 *
 * @exports buildScientificModel - 构建科学模型约束
 * @exports generateHtmlFromModel - 基于科学模型生成 HTML
 * @exports generateInteractivePage - 完整生成管线入口（编排上述所有步骤）
 */

import { extractHtmlDocument } from './html-extractor';
import { validateInteractiveHtml } from './quality-guard';
import type {
  GenerateInteractivePageInput,
  GenerateInteractivePageResult,
  InteractiveAgentDependencies,
  ScientificModel,
} from './types';
import { InteractiveAgentError } from './types';

const MAX_REPAIR_ATTEMPTS = 1;

function formatKeyPoints(keyPoints: string[] | undefined): string {
  return (keyPoints || []).map((point, index) => `${index + 1}. ${point}`).join('\n');
}

function inferConceptCategory(conceptName: string, conceptOverview: string, subject: string): string {
  const text = `${conceptName} ${conceptOverview} ${subject}`.toLowerCase();
  if (/(力|运动|振动|波|电|磁|光|energy|force|motion|wave|field|velocity|acceleration|physics)/.test(text)) {
    return 'physics';
  }
  if (/(函数|几何|概率|导数|积分|矩阵|数列|equation|function|geometry|probability|calculus|math)/.test(text)) {
    return 'math';
  }
  if (/(化学|反应|分子|原子|键|chemistry|molecule|reaction|atom|bond)/.test(text)) {
    return 'chemistry';
  }
  if (/(算法|排序|图|递归|automata|algorithm|graph|recursion|complexity|computer science)/.test(text)) {
    return 'computer-science';
  }
  if (/(数据|统计|回归|分布|dataset|statistics|regression|distribution|data)/.test(text)) {
    return 'data';
  }
  return 'general';
}

function defaultDesignIdea(conceptName: string, conceptOverview: string, subject: string): string {
  const category = inferConceptCategory(conceptName, conceptOverview, subject);
  const categoryStrategy: Record<string, string> = {
    physics:
      'Use motion trails, vectors, and time controls to show causal dynamics with parameter sliders (e.g., force/mass/friction).',
    math:
      'Use graph-based animation with draggable points and live formula/value linkage to show parameter effects.',
    chemistry:
      'Use particle-level animation with state transitions and concentration/temperature controls.',
    'computer-science':
      'Use step-by-step state transitions with play/pause/step controls and highlighted algorithm states.',
    data: 'Use animated charts with filtering controls and comparative overlays to explain trends.',
    general:
      'Use a visualization-first animated scene with clear causal feedback and interactive controls.',
  };
  return `Create a high-clarity animation page for "${conceptName}". ${categoryStrategy[category]} Keep state/update/render separation, use requestAnimationFrame loop, and include play/pause/reset plus at least one parameter slider.`;
}

function normalizeInput(input: GenerateInteractivePageInput): Required<GenerateInteractivePageInput> {
  const conceptName = input.conceptName.trim();
  const conceptOverview =
    input.conceptOverview?.trim() ||
    `An interactive animated learning page about "${conceptName}" with clear visual explanations and direct manipulation.`;
  const designIdea = input.designIdea?.trim() || defaultDesignIdea(conceptName, conceptOverview, input.subject || '');
  const language = input.language || 'zh-CN';

  return {
    title: input.title || conceptName,
    conceptName,
    conceptOverview,
    designIdea,
    subject: input.subject || '',
    keyPoints: input.keyPoints || [],
    language,
  };
}

function toScientificConstraints(model?: ScientificModel): string {
  if (!model) return 'No specific scientific constraints available.';
  const lines: string[] = [];
  if (model.core_formulas?.length) lines.push(`Core Formulas: ${model.core_formulas.join('; ')}`);
  if (model.mechanism?.length) lines.push(`Mechanisms: ${model.mechanism.join('; ')}`);
  if (model.constraints?.length) lines.push(`Must Obey: ${model.constraints.join('; ')}`);
  if (model.forbidden_errors?.length) lines.push(`Forbidden Errors: ${model.forbidden_errors.join('; ')}`);
  return lines.join('\n');
}

export async function buildScientificModel(
  input: GenerateInteractivePageInput,
  deps: InteractiveAgentDependencies,
): Promise<ScientificModel | undefined> {
  const prompts = deps.buildPrompt('interactive-scientific-model', {
    subject: input.subject || '',
    conceptName: input.conceptName,
    conceptOverview: input.conceptOverview,
    keyPoints: formatKeyPoints(input.keyPoints),
    designIdea: input.designIdea,
  });
  if (!prompts) throw new InteractiveAgentError('PROMPT_BUILD_FAILED', 'Failed to build model prompt.');

  const response = await deps.aiCall(prompts.system, prompts.user);
  const parsed = deps.parseJsonResponse<ScientificModel>(response);
  if (!parsed || !parsed.core_formulas) {
    deps.logger?.warn?.('Scientific model parsing failed, continue with prompt-only constraints');
    return undefined;
  }
  return parsed;
}

export async function generateHtmlFromModel(
  input: GenerateInteractivePageInput,
  scientificModel: ScientificModel | undefined,
  deps: InteractiveAgentDependencies,
): Promise<string> {
  const prompts = deps.buildPrompt('interactive-html', {
    conceptName: input.conceptName,
    subject: input.subject || '',
    conceptOverview: input.conceptOverview,
    keyPoints: formatKeyPoints(input.keyPoints),
    scientificConstraints: toScientificConstraints(scientificModel),
    designIdea: input.designIdea,
    language: input.language || 'zh-CN',
  });
  if (!prompts) throw new InteractiveAgentError('PROMPT_BUILD_FAILED', 'Failed to build html prompt.');

  const response = await deps.aiCall(prompts.system, prompts.user);
  const rawHtml = extractHtmlDocument(response);
  if (!rawHtml) {
    throw new InteractiveAgentError('HTML_EXTRACTION_FAILED', 'Failed to extract HTML from response.');
  }
  return rawHtml;
}

async function repairHtmlWithDiagnostics(
  input: Required<GenerateInteractivePageInput>,
  scientificModel: ScientificModel | undefined,
  html: string,
  errors: string[],
  warnings: string[],
  deps: InteractiveAgentDependencies,
): Promise<string | undefined> {
  const prompts = deps.buildPrompt('interactive-html-repair', {
    conceptName: input.conceptName,
    language: input.language,
    designIdea: input.designIdea,
    scientificConstraints: toScientificConstraints(scientificModel),
    errors: errors.join('\n') || 'None',
    warnings: warnings.join('\n') || 'None',
    originalHtml: html,
  });
  if (!prompts) return undefined;
  const repairedResponse = await deps.aiCall(prompts.system, prompts.user);
  return extractHtmlDocument(repairedResponse) || undefined;
}

export async function generateInteractivePage(
  input: GenerateInteractivePageInput,
  deps: InteractiveAgentDependencies,
): Promise<GenerateInteractivePageResult> {
  if (!input.conceptName?.trim()) {
    throw new InteractiveAgentError('MISSING_REQUIRED_FIELD', 'conceptName is required.');
  }

  const normalized = normalizeInput(input);
  let scientificModel: ScientificModel | undefined;
  const warnings: string[] = [];

  try {
    scientificModel = await buildScientificModel(normalized, deps);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(`Scientific modeling failed: ${message}`);
    deps.logger?.warn?.(`Scientific modeling failed: ${message}`);
  }

  const rawHtml = await generateHtmlFromModel(normalized, scientificModel, deps);
  let candidateHtml = rawHtml;
  let processedHtml = deps.postProcessHtml(candidateHtml);
  let diagnostics = validateInteractiveHtml(processedHtml);
  warnings.push(...diagnostics.warnings);

  let attempts = 0;
  while (!diagnostics.valid && attempts < MAX_REPAIR_ATTEMPTS) {
    attempts += 1;
    warnings.push(`Quality guard failed. Running auto-repair attempt ${attempts}/${MAX_REPAIR_ATTEMPTS}.`);
    const repaired = await repairHtmlWithDiagnostics(
      normalized,
      scientificModel,
      candidateHtml,
      diagnostics.errors,
      diagnostics.warnings,
      deps,
    );
    if (!repaired) break;
    candidateHtml = repaired;
    processedHtml = deps.postProcessHtml(candidateHtml);
    diagnostics = validateInteractiveHtml(processedHtml);
    warnings.push(...diagnostics.warnings.map((w) => `[repair-${attempts}] ${w}`));
  }

  if (!diagnostics.valid) {
    throw new InteractiveAgentError(
      'QUALITY_GUARD_FAILED',
      'Generated HTML did not pass quality guard after auto-repair.',
      diagnostics.errors,
    );
  }

  return {
    html: processedHtml,
    scientificModel,
    warnings,
    diagnostics,
  };
}
