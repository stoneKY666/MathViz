/**
 * utils.ts - 通用工具函数库
 *
 * 提供 CSS 类名合并功能，将 clsx 的条件类名拼接与 tailwind-merge 的
 * Tailwind CSS 冲突解决能力结合，确保生成的类名无冲突。
 *
 * @exports cn - 合并并去重 CSS 类名的工具函数
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
