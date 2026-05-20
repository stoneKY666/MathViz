/**
 * @file provider-config.ts
 * @description 服务端 LLM 提供商配置管理
 *
 * 从环境变量中读取各 LLM 提供商的 API 密钥、基础 URL 和模型列表，
 * 支持 11 个内置提供商（OpenAI、Anthropic、Google、DeepSeek 等）。
 * 环境变量命名规则：{PREFIX}_API_KEY、{PREFIX}_BASE_URL、{PREFIX}_MODELS。
 * 使用单例模式缓存配置，避免重复解析环境变量。
 *
 * @exports getServerProviders - 获取所有已配置的服务端提供商信息（不含 API 密钥）
 * @exports resolveApiKey - 解析 API 密钥（客户端优先，回退到服务端环境变量）
 * @exports resolveBaseUrl - 解析基础 URL（客户端 > 服务端 > 提供商默认值）
 * @exports getServerDefaultModel - 获取 DEFAULT_MODEL 环境变量
 */

import { createLogger } from '@/lib/logger';
import { PROVIDERS } from '@/lib/ai/providers';

const log = createLogger('ServerProviderConfig');

interface ServerProviderEntry {
  apiKey: string;
  baseUrl?: string;
  models?: string[];
}

interface ServerConfig {
  providers: Record<string, ServerProviderEntry>;
}

const LLM_ENV_MAP: Record<string, string> = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  DEEPSEEK: 'deepseek',
  QWEN: 'qwen',
  KIMI: 'kimi',
  MINIMAX: 'minimax',
  GLM: 'glm',
  SILICONFLOW: 'siliconflow',
  DOUBAO: 'doubao',
  GROK: 'grok',
};

function parseModels(raw?: string): string[] | undefined {
  if (!raw) return undefined;
  const models = raw
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return models.length > 0 ? models : undefined;
}

function loadEnvSection(
  envMap: Record<string, string>,
): Record<string, ServerProviderEntry> {
  const result: Record<string, ServerProviderEntry> = {};

  for (const [prefix, providerId] of Object.entries(envMap)) {
    const envApiKey = process.env[`${prefix}_API_KEY`] || undefined;
    const envBaseUrl = process.env[`${prefix}_BASE_URL`] || undefined;
    const envModels = parseModels(process.env[`${prefix}_MODELS`]);

    if (!envApiKey) continue;

    result[providerId] = {
      apiKey: envApiKey || '',
      baseUrl: envBaseUrl,
      models: envModels,
    };
  }

  return result;
}

let _config: ServerConfig | null = null;

function buildConfig(): ServerConfig {
  const cfg: ServerConfig = {
    providers: loadEnvSection(LLM_ENV_MAP),
  };

  const count = Object.keys(cfg.providers).length;
  if (count > 0) {
    log.info(`[ServerProviderConfig] Loaded ${count} LLM providers from env`);
  }
  return cfg;
}

function getConfig(): ServerConfig {
  if (_config) return _config;
  _config = buildConfig();
  return _config;
}

export function getServerProviders(): Record<string, { models?: string[]; baseUrl?: string }> {
  const cfg = getConfig();
  const result: Record<string, { models?: string[]; baseUrl?: string }> = {};
  for (const [id, entry] of Object.entries(cfg.providers)) {
    result[id] = {};
    if (entry.models && entry.models.length > 0) result[id].models = entry.models;
    if (entry.baseUrl) result[id].baseUrl = entry.baseUrl;
  }
  return result;
}

export function resolveApiKey(providerId: string, clientKey?: string): string {
  if (clientKey) return clientKey;
  return getConfig().providers[providerId]?.apiKey || '';
}

export function resolveBaseUrl(providerId: string, clientBaseUrl?: string): string | undefined {
  if (clientBaseUrl) return clientBaseUrl;
  // Fallback to server config first, then to PROVIDERS registry
  const serverConfig = getConfig().providers[providerId];
  if (serverConfig?.baseUrl) return serverConfig.baseUrl;
  // Fallback to PROVIDERS registry for providers without server-side config
  return PROVIDERS[providerId as keyof typeof PROVIDERS]?.defaultBaseUrl;
}

export function getServerDefaultModel(): string | undefined {
  const model = process.env.DEFAULT_MODEL?.trim();
  return model || undefined;
}
