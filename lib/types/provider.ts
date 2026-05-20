/**
 * @file provider.ts
 * @description AI 提供商（Provider）核心类型定义
 *
 * 定义了 LLM 提供商系统的完整类型体系，包括：
 * - 提供商标识：11 个内置提供商 + 自定义提供商（custom- 前缀）
 * - API 类型：openai / anthropic / google 三种协议类型
 * - 思维能力：ThinkingCapability 描述模型的推理控制能力（可开关、可调预算）
 * - 思维配置：ThinkingConfig 用于 LLM 调用时的统一思维参数
 * - 模型信息：ModelInfo 包含模型 ID、名称、上下文窗口、能力标记
 * - 提供商配置：ProviderConfig 描述完整的提供商元数据
 * - 模型配置：ModelConfig 用于实际 API 调用时的模型参数
 *
 * @exports BuiltInProviderId - 内置提供商 ID 联合类型
 * @exports ProviderId - 提供商 ID 类型（内置 + 自定义）
 * @exports ProviderType - 提供商 API 协议类型
 * @exports ThinkingCapability - 模型思维能力描述接口
 * @exports ThinkingConfig - 思维配置接口
 * @exports ModelInfo - 模型信息接口
 * @exports ProviderConfig - 提供商配置接口
 * @exports ModelConfig - 模型调用配置接口
 */

/**
 * 内置提供商 ID
 */
export type BuiltInProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'qwen'
  | 'kimi'
  | 'minimax'
  | 'glm'
  | 'siliconflow'
  | 'doubao'
  | 'grok';

/**
 * 提供商 ID（内置或自定义）
 * 自定义提供商使用 "custom-" 前缀的字符串字面量
 */
export type ProviderId = BuiltInProviderId | `custom-${string}`;

/**
 * 提供商 API 协议类型
 */
export type ProviderType = 'openai' | 'anthropic' | 'google';

/**
 * 模型的思维/推理 API 控制能力描述
 * 不支持思维能力的模型无需包含此字段
 */
export interface ThinkingCapability {
  /** 思维功能是否可通过 API 完全关闭？ */
  toggleable: boolean;
  /** 思维预算/努力强度是否可调？ */
  budgetAdjustable: boolean;
  /** 默认是否启用思维（未传配置时）？ */
  defaultEnabled: boolean;
}

/**
 * LLM 调用的统一思维配置
 * 适配器会将此配置映射为各提供商特定的 providerOptions
 */
export interface ThinkingConfig {
  /**
   * 是否启用思维
   * - true: 启用（使用模型默认或指定预算）
   * - false: 关闭（适配器对不可关闭的模型做尽力处理）
   * - undefined: 使用模型默认行为
   */
  enabled?: boolean;
  /**
   * 预算提示（token 数），仅在 enabled=true 或 undefined 时生效
   * 适配器会映射到各提供商支持的最接近值
   */
  budgetTokens?: number;
}

/**
 * 模型信息
 */
export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  outputWindow?: number;
  capabilities?: {
    streaming?: boolean;
    tools?: boolean;
    vision?: boolean;
    thinking?: ThinkingCapability;
  };
}

/**
 * 提供商配置
 */
export interface ProviderConfig {
  id: ProviderId;
  name: string;
  type: ProviderType;
  defaultBaseUrl?: string;
  requiresApiKey: boolean;
  icon?: string;
  models: ModelInfo[];
}

/**
 * API 调用时的模型配置
 */
export interface ModelConfig {
  providerId: ProviderId;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
  proxy?: string; // 可选：HTTP 代理 URL
  providerType?: ProviderType; // 可选：自定义提供商的服务端协议类型
  requiresApiKey?: boolean; // 可选：自定义提供商是否需要 API 密钥
}
