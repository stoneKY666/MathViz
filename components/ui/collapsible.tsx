/**
 * ui/collapsible.tsx - 折叠面板组件
 *
 * 基于 Radix UI Collapsible 原语封装的可折叠内容区域组件。
 * 支持展开/收起切换，提供 Collapsible、CollapsibleTrigger、CollapsibleContent
 * 三个组合组件，用于实现可折叠的设置面板、FAQ 等场景。
 */
'use client';

import { Collapsible as CollapsiblePrimitive } from 'radix-ui';

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
