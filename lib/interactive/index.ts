/**
 * interactive/index.ts - 交互式可视化生成管线统一入口
 *
 * 汇总导出 lib/interactive/ 模块的所有公共 API，包括：
 *   - HTML 提取（extractHtmlDocument）
 *   - 后处理（postProcessInteractiveHtml）
 *   - 质量校验（validateInteractiveHtml）
 *   - 生成管线（buildScientificModel、generateHtmlFromModel、generateInteractivePage）
 *   - Prompt 构建（buildPrompt）
 *   - JSON 解析（parseJsonResponse）
 *   - LLM 调用（callLlmWithModelConfig）
 *   - 所相关类型定义
 */

export { extractHtmlDocument } from './html-extractor';
export { postProcessInteractiveHtml } from './post-processor';
export { validateInteractiveHtml } from './quality-guard';
export { buildScientificModel, generateHtmlFromModel, generateInteractivePage } from './service';
export { buildPrompt } from './prompt-builder';
export { parseJsonResponse } from './json';
export { callLlmWithModelConfig } from './llm';
export type {
  GenerateInteractivePageInput,
  GenerateInteractivePageResult,
  InteractiveAgentDependencies,
  InteractiveLanguage,
  InteractiveValidationResult,
  ModelConfig,
  ScientificModel,
} from './types';
export { InteractiveAgentError } from './types';
