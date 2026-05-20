/**
 * 文件名称：vitest.config.ts
 * 文件作用：Vitest 测试框架配置文件
 * 实现方式：指定 Node 测试环境，包含 tests/ 目录下所有 .test.ts 文件
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
