/**
 * i18n/config.ts - i18next 国际化配置
 *
 * 初始化 i18next 实例，集成 react-i18next 和动态资源加载后端。
 * 通过 resourcesToBackend 按需加载语言包 JSON 文件，避免打包时全量引入。
 * 默认语言为 zh-CN，回退语言也为 zh-CN。
 *
 * @exports i18n - 已初始化的 i18next 实例
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { supportedLocales } from './locales';
import { defaultLocale } from './types';

i18n
  .use(initReactI18next)
  .use(resourcesToBackend((language: string) => import(`./locales/${language}.json`)))
  .init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: supportedLocales.map((l) => l.code),
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
