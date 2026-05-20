/**
 * ui/avatar-display.tsx - 头像展示组件
 *
 * 高级头像展示组件，支持图片、图标和文字回退三种模式。
 * 根据 src 和 fallback 属性自动选择显示方式，
 * 支持自定义大小和样式类名。
 */
'use client';

import { cn } from '@/lib/utils';

interface AvatarDisplayProps {
  readonly src: string;
  readonly alt?: string;
  readonly className?: string;
}

export function AvatarDisplay({ src, alt, className }: AvatarDisplayProps) {
  const isUrl = src.startsWith('http') || src.startsWith('data:') || src.startsWith('/');

  if (isUrl) {
    return (
      <img src={src} alt={alt || ''} className={cn('w-full h-full object-cover', className)} />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt || ''}
      className={cn('flex items-center justify-center w-full h-full select-none', className)}
    >
      {src}
    </span>
  );
}
