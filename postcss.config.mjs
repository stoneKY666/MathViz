/**
 * 文件名称：postcss.config.mjs
 * 文件作用：PostCSS 配置文件，定义 CSS 后处理插件
 * 实现方式：启用 @tailwindcss/postcss 插件以支持 Tailwind CSS 编译
 */

const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
