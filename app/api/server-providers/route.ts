/**
 * api/server-providers/route.ts - 服务端提供商配置 API
 *
 * GET /api/server-providers — 返回服务端（.env.local）配置的 AI 提供商信息。
 * 读取环境变量中配置的提供商列表、模型白名单、Base URL 和默认模型，
 * 供客户端初始化时合并到本地配置中。
 * 实现：通过 provider-config 模块读取环境变量，统一返回 JSON 响应。
 */

import {
  getServerProviders,
  getServerDefaultModel,
} from '@/lib/server/provider-config';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { createLogger } from '@/lib/logger';

const log = createLogger('ServerProviders');

export async function GET() {
  try {
    return apiSuccess({
      providers: getServerProviders(),
      defaultModel: getServerDefaultModel(),
    });
  } catch (error) {
    log.error('Error fetching server providers:', error);
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}
