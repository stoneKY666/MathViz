/**
 * server-providers-init.tsx - 服务端提供商配置初始化组件
 *
 * 客户端组件，在应用挂载时自动从 /api/server-providers 获取服务端配置的
 * AI 提供商信息（.env.local 中设置的 API Key、模型白名单、Base URL 等），
 * 并合并到本地 Zustand 设置存储中。
 * 确保用户首次打开应用时即可使用服务端预配置的模型。
 *
 * @exports ServerProvidersInit - 服务端配置初始化组件
 */
'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/settings';

export function ServerProvidersInit() {
  const fetchServerProviders = useSettingsStore((state) => state.fetchServerProviders);

  useEffect(() => {
    fetchServerProviders();
  }, [fetchServerProviders]);

  return null;
}
