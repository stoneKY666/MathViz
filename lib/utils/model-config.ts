/**
 * @file model-config.ts
 * @description 客户端模型配置获取工具
 *
 * 从 Zustand 设置 store 中读取当前选中的模型配置，并在 store 中缺少 API 密钥时
 * 自动回退到 localStorage 直接读取，确保客户端 API 调用始终能获取到完整配置。
 * 解析优先级：Zustand store > localStorage > 提供商默认值。
 *
 * @exports getCurrentModelConfig - 获取当前模型的完整配置（providerId、modelId、apiKey、baseUrl 等）
 */

import { useSettingsStore } from '@/lib/store/settings';
import { getProvider, type ProviderId } from '@/lib/ai/providers';

export function getCurrentModelConfig() {
  // Get the latest state from Zustand store
  const state = useSettingsStore.getState();
  const { providerId, modelId, providersConfig } = state;

  const modelString = `${providerId}:${modelId}`;
  let providerConfig = providersConfig[providerId];

  // Get built-in provider defaults for fallback
  const builtInProvider = getProvider(providerId as ProviderId);
  const defaultBaseUrl = builtInProvider?.defaultBaseUrl || '';

  // Check localStorage availability
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    const localStorageKey = 'settings-storage';

    // If provider config is missing in store or apiKey is empty, try to read from localStorage directly
    const needsLocalStorageFallback = !providerConfig || !providerConfig.apiKey;

    if (needsLocalStorageFallback) {
      try {
        const stored = localStorage.getItem(localStorageKey);

        if (stored) {
          const parsed = JSON.parse(stored);

          const storedProviderConfig = parsed?.state?.providersConfig?.[providerId];

          if (storedProviderConfig) {
            // Merge stored config with current store config
            // Use store values ONLY if they are non-empty strings
            // Otherwise use stored values (from localStorage)
            providerConfig = {
              ...providerConfig,
              ...storedProviderConfig,
              apiKey: (providerConfig?.apiKey && providerConfig.apiKey.trim())
                ? providerConfig.apiKey
                : (storedProviderConfig.apiKey || ''),
              baseUrl: (providerConfig?.baseUrl && providerConfig.baseUrl.trim())
                ? providerConfig.baseUrl
                : (storedProviderConfig?.baseUrl || defaultBaseUrl),
            };
          }
        }
      } catch {
        // localStorage unavailable or malformed — fall through with store values
      }
    }
  }

  return {
    providerId,
    modelId,
    modelString,
    apiKey: providerConfig?.apiKey || '',
    baseUrl: providerConfig?.baseUrl || defaultBaseUrl,
    providerType: providerConfig?.type,
    requiresApiKey: providerConfig?.requiresApiKey,
    isServerConfigured: providerConfig?.isServerConfigured,
  };
}
