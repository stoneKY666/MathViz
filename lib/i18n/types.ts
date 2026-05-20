/**
 * i18n/types.ts - i18n 类型定义
 *
 * 定义国际化模块的核心类型。Locale 为从 supportedLocales 推导出的联合字面量类型，
 * 确保类型安全。defaultLocale 指定默认语言为简体中文。
 *
 * @exports Locale - 语言代码联合类型（如 'zh-CN' | 'en-US'）
 * @exports defaultLocale - 默认语言代码 'zh-CN'
 */

import { supportedLocales } from './locales';

export type Locale = (typeof supportedLocales)[number]['code'];

export const defaultLocale: Locale = 'zh-CN';
