/**
 * interactive-agent/layout.tsx - 交互式代理页面布局
 *
 * 为 /interactive-agent 路由提供独立的 Metadata 配置。
 * 布局结构简单，直接透传子组件（children），不添加额外包裹元素。
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'zju_math_helper',
  description: 'zju_math_helper interactive animation generator',
};

export default function InteractiveAgentLayout({ children }: { children: ReactNode }) {
  return children;
}
