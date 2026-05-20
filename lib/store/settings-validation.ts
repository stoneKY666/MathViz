/**
 * @file settings-validation.ts
 * @description 提供商与模型选择的校验工具函数
 *
 * 纯函数集合，用于在服务端配置变更后检测和修复过时的提供商/模型选择。
 * 当用户当前选择的提供商不再可用时，自动回退到备选列表中第一个可用的提供商；
 * 当选中的模型不在可用列表中时，回退到第一个可用模型。
 *
 * @exports ProviderCfgLike - 提供商配置的最小接口
 * @exports isProviderUsable - 判断提供商是否可用（有服务端配置或客户端密钥）
 * @exports validateProvider - 校验当前提供商选择，不可用时回退到备选
 * @exports validateModel - 校验当前模型选择，不可用时回退到第一个可用模型
 */

export type ProviderCfgLike = {
  isServerConfigured?: boolean;
  apiKey?: string;
};

/** Check whether a provider has a usable path (server config or client key). */
export function isProviderUsable(cfg: ProviderCfgLike | undefined): boolean {
  if (!cfg) return false;
  return !!cfg.isServerConfigured || !!cfg.apiKey;
}

/**
 * Validate current provider selection against updated config.
 * Returns the current ID if still usable, otherwise the first usable
 * provider from fallbackOrder, or defaultId if provided, or ''.
 */
export function validateProvider<T extends string>(
  currentId: T | '',
  configMap: Partial<Record<T, ProviderCfgLike>>,
  fallbackOrder: T[],
  defaultId?: T,
): T | '' {
  if (!currentId) return currentId;
  if (isProviderUsable(configMap[currentId])) return currentId;

  for (const id of fallbackOrder) {
    if (isProviderUsable(configMap[id])) return id;
  }
  return defaultId ?? '';
}

/**
 * Validate current model selection against available models list.
 * Falls back to first available model, or '' if list is empty.
 */
export function validateModel(
  currentModelId: string,
  availableModels: Array<{ id: string }>,
): string {
  if (!currentModelId) return currentModelId;
  if (availableModels.some((m) => m.id === currentModelId)) return currentModelId;
  return availableModels[0]?.id ?? '';
}
