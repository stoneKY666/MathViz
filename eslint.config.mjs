/**
 * 文件名称：eslint.config.mjs
 * 文件作用：ESLint 配置文件，定义代码检查规则
 * 实现方式：使用 ESLint 扁平配置格式，集成 Next.js 核心 Web Vitals 和 TypeScript 规则集，
 *          忽略构建产物目录，关闭 no-img-element 规则
 */

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]);
