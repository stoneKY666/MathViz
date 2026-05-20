/**
 * @file settings.ts
 * @description 设置相关类型定义
 *
 * 定义了应用设置系统的数据结构，包括：
 * - 设置分区（SettingsSection）：general / providers / agents
 * - 提供商设置（ProviderSettings）：统一的提供商配置结构，内置和自定义提供商共用，
 *   包含 API 密钥、基础 URL、模型列表、服务端配置标记等
 * - 提供商配置存储（ProvidersConfig）：以 providerId 为键的配置映射
 * - 编辑中的模型（EditingModel）：用于 UI 中模型编辑表单的临时状态
 *
 * @exports SettingsSection - 设置页面分区类型
 * @exports ProviderSettings - 提供商设置接口
 * @exports ProvidersConfig - 提供商配置映射类型
 * @exports EditingModel - 模型编辑状态接口
 */

import type { ProviderId, ModelInfo, ProviderType } from '@/lib/types/provider';

export type SettingsSection =
  | 'general'
  | 'providers'
  | 'agents';

/**
 * 统一的提供商配置，以 JSON 格式存储
 * 内置和自定义提供商使用相同的结构
 */
export interface ProviderSettings {
  // 配置项
  apiKey: string;
  baseUrl: string;
  models: ModelInfo[]; // 所有模型（用户可编辑/删除）

  // 元数据（内置和自定义提供商通用）
  name: string;
  type: ProviderType;
  defaultBaseUrl?: string;
  icon?: string;
  requiresApiKey: boolean;
  isBuiltIn: boolean; // true 为内置提供商，false 为自定义

  // 服务端配置（由 fetchServerProviders 设置）
  isServerConfigured?: boolean; // 服务端是否有此提供商的 API 密钥
  serverModels?: string[]; // 服务端限定的模型列表（如有）
  serverBaseUrl?: string; // 服务端提供的基础 URL 覆盖
}

/**
 * 提供商配置存储格式
 * 键：providerId，值：ProviderSettings
 */
export type ProvidersConfig = Record<ProviderId, ProviderSettings>;

export interface EditingModel {
  providerId: ProviderId;
  modelIndex: number | null; // null 表示新增模型
  model: ModelInfo;
}
