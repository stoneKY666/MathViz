/**
 * 文件名称：next.config.ts
 * 文件作用：Next.js 应用配置文件
 * 实现方式：配置 Turbopack 根目录、standalone 输出模式，以及服务端 AI 模型的默认环境变量
 */

import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  output: 'standalone',
  // Server-side AI configuration — set via environment variables or .env.local
  env: {
    OPENAI_MODELS: 'gpt-5.2,gpt-5,gpt-4o,gpt-4o-mini',
    DEFAULT_MODEL: 'openai:gpt-5.2',
  },
};

export default nextConfig;
