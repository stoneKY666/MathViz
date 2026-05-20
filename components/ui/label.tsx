/**
 * ui/label.tsx - 标签组件
 *
 * 基于 Radix UI Label 原语封装的表单标签组件。
 * 自动关联对应的表单控件（通过 htmlFor 或嵌套），提升无障碍访问性。
 * 使用 class-variance-authority 实现变体样式。
 */
'use client';

import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
