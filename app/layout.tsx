/**
 * layout.tsx - 根布局组件
 *
 * 应用的顶层布局，所有页面共享此布局结构。
 * 负责：
 *   1. 设置全局 Metadata（标题、描述、图标）
 *   2. 引入全局样式（globals.css）
 *   3. 提供 I18nProvider 实现国际化上下文
 *   4. 挂载 ServerProvidersInit 在客户端初始化服务端配置的 AI 提供商
 *   5. 定义页面根 HTML 结构（渐变背景、最小高度等）
 */

import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/hooks/use-i18n';
import { ServerProvidersInit } from '@/components/server-providers-init';

export const metadata: Metadata = {
  title: 'MathViz - 数学学习AI动画助手',
  description: '输入数学概念即可生成交互式动画网页，让抽象的数学知识变得生动直观。',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/40">
        <I18nProvider>
          <ServerProvidersInit />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
