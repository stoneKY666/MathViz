/**
 * i18n/index.ts - i18n 模块统一入口
 *
 * 汇总导出国际化相关的类型、配置和工具函数，包括 Locale 类型定义、
 * 受支持语言列表、服务端翻译函数 translate 和客户端翻译函数 getClientTranslation。
 *
 * @exports Locale - 语言代码类型
 * @exports defaultLocale - 默认语言代码
 * @exports LocaleEntry - 语言条目类型
 * @exports supportedLocales - 受支持的语言列表
 * @exports translate - 服务端翻译函数（指定语言）
 * @exports getClientTranslation - 客户端翻译函数（使用当前语言）
 */

import i18n from './config';

export { type Locale, defaultLocale } from './types';
export { type LocaleEntry, supportedLocales } from './locales';
export type TranslationKey = string;

export function translate(locale: string, key: string): string {
  return i18n.t(key, { lng: locale });
}

export function getClientTranslation(key: string): string {
  return i18n.t(key);
}
