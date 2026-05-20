/**
 * i18n/locales.ts - 受支持的语言注册表
 *
 * 定义项目支持的所有语言及其显示信息。每个语言条目包含语言代码（如 zh-CN）、
 * 下拉菜单显示名称（如"简体中文"）和切换按钮缩写（如"CN"）。
 * 新增语言需在此文件中添加条目，并创建对应的 JSON 翻译文件。
 *
 * @exports LocaleEntry - 语言条目类型定义
 * @exports supportedLocales - 受支持的语言列表（只读数组）
 */

export type LocaleEntry = {
  code: string;
  /** Native name shown in dropdown, e.g. '简体中文' */
  label: string;
  /** Short label shown on the toggle button, e.g. 'CN' */
  shortLabel: string;
};

/**
 * Supported locales registry.
 *
 * To add a new language:
 *   1. Create `lib/i18n/locales/<code>.json` (copy an existing file as template)
 *   2. Add an entry here
 */
export const supportedLocales = [
  { code: 'zh-CN', label: '简体中文', shortLabel: 'CN' },
  { code: 'en-US', label: 'English', shortLabel: 'EN' },
] as const satisfies readonly LocaleEntry[];
