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
