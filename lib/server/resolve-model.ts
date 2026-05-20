/**
 * @file resolve-model.ts
 * @description 服务端模型解析与实例化
 *
 * 根据客户端请求参数（模型字符串、API 密钥、基础 URL）解析并创建 LLM 模型实例。
 * 解析优先级：客户端参数 > 服务端环境变量 > 提供商默认值。
 * 在生产环境下对所有 base URL 执行 SSRF 安全校验。
 *
 * @exports ResolvedModel - 解析后的模型信息接口（包含模型实例、密钥、URL 等）
 * @exports resolveModel - 从参数对象解析模型的核心函数
 * @exports resolveModelFromHeaders - 从 NextRequest 请求头中解析模型的便捷函数
 */

import type { NextRequest } from 'next/server';
import { getModel, parseModelString, type ModelWithInfo } from '@/lib/ai/providers';
import { resolveApiKey, resolveBaseUrl } from '@/lib/server/provider-config';
import { validateUrlForSSRF } from '@/lib/server/ssrf-guard';

export interface ResolvedModel extends ModelWithInfo {
  modelString: string;
  apiKey: string;
  baseUrl?: string;
}

export function resolveModel(params: {
  modelString?: string;
  apiKey?: string;
  baseUrl?: string;
  providerType?: string;
  requiresApiKey?: boolean;
}): ResolvedModel {
  const modelString = params.modelString || process.env.DEFAULT_MODEL || 'openai:gpt-4o-mini';
  const { providerId, modelId } = parseModelString(modelString);

  // Resolve base URL: explicit > provider default
  const explicitBaseUrl = params.baseUrl?.trim() || undefined;
  const defaultBaseUrl = resolveBaseUrl(providerId, params.baseUrl);
  const effectiveBaseUrl = explicitBaseUrl || defaultBaseUrl;

  // SSRF protection: check ALL base URLs in production (not just client-provided ones)
  if (effectiveBaseUrl && process.env.NODE_ENV === 'production') {
    const ssrfError = validateUrlForSSRF(effectiveBaseUrl);
    if (ssrfError) throw new Error(ssrfError);
  }

  // Use client API key if provided, otherwise try server-side env
  const clientApiKey = params.apiKey?.trim() || '';
  const apiKey = explicitBaseUrl
    ? clientApiKey || ''
    : resolveApiKey(providerId, clientApiKey);

  const baseUrl = effectiveBaseUrl;

  const { model, modelInfo } = getModel({
    providerId,
    modelId,
    apiKey,
    baseUrl,
    providerType: params.providerType as 'openai' | 'anthropic' | 'google' | undefined,
    requiresApiKey: params.requiresApiKey,
  });

  return { model, modelInfo, modelString, apiKey, baseUrl };
}

export function resolveModelFromHeaders(req: NextRequest): ResolvedModel {
  return resolveModel({
    modelString: req.headers.get('x-model') || undefined,
    apiKey: req.headers.get('x-api-key') || undefined,
    baseUrl: req.headers.get('x-base-url') || undefined,
    providerType: req.headers.get('x-provider-type') || undefined,
    requiresApiKey: req.headers.get('x-requires-api-key') === 'true' ? true : undefined,
  });
}
