/**
 * interactive/types.ts - 交互式可视化生成管线类型定义
 *
 * 定义生成管线的核心类型接口：
 *   - InteractiveLanguage: 支持的语言代码（zh-CN、en-US）
 *   - ScientificModel: 科学建模阶段输出的结构化约束（公式、机制、约束、禁忌）
 *   - GenerateInteractivePageInput: 生成请求输入（概念名称、概述、学科、设计思路等）
 *   - GenerateInteractivePageResult: 生成结果（HTML、科学模型、警告、诊断信息）
 *   - InteractiveAgentDependencies: 依赖注入接口（AI 调用、Prompt 构建、JSON 解析等）
 *   - ModelConfig: 模型配置（提供商、API Key、Base URL 等）
 *   - InteractiveValidationResult: 校验结果（valid、errors、warnings）
 *   - InteractiveAgentError: 自定义错误类，携带错误代码和详情
 */

export type InteractiveLanguage = 'zh-CN' | 'en-US';

export interface ScientificModel {
  core_formulas: string[];
  mechanism: string[];
  constraints: string[];
  forbidden_errors: string[];
}

export interface GenerateInteractivePageInput {
  title?: string;
  conceptName: string;
  conceptOverview?: string;
  designIdea?: string;
  subject?: string;
  keyPoints?: string[];
  language?: InteractiveLanguage;
}

export interface InteractiveValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GenerateInteractivePageResult {
  html: string;
  scientificModel?: ScientificModel;
  warnings: string[];
  diagnostics: InteractiveValidationResult;
}

export interface BuildPromptResult {
  system: string;
  user: string;
}

export interface InteractiveAgentDependencies {
  aiCall: (systemPrompt: string, userPrompt: string) => Promise<string>;
  buildPrompt: (
    promptId: 'interactive-scientific-model' | 'interactive-html' | 'interactive-html-repair',
    variables: Record<string, unknown>,
  ) => BuildPromptResult | null | undefined;
  parseJsonResponse: <T>(response: string) => T | null;
  postProcessHtml: (html: string) => string;
  logger?: {
    info?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  };
}

export class InteractiveAgentError extends Error {
  constructor(
    readonly code:
      | 'MISSING_REQUIRED_FIELD'
      | 'PROMPT_BUILD_FAILED'
      | 'HTML_EXTRACTION_FAILED'
      | 'QUALITY_GUARD_FAILED'
      | 'MODEL_CONFIG_INVALID',
    message: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'InteractiveAgentError';
  }
}

export interface ModelConfig {
  providerId: string;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  requiresApiKey?: boolean;
  providerType?: 'openai' | 'anthropic' | 'google';
}
