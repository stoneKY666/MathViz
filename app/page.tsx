/**
 * page.tsx - 根路由页面
 *
 * 应用首页，访问 "/" 时自动重定向到 "/interactive-agent"。
 * 使用 Next.js 的 redirect 进行服务端重定向，无需客户端 JS。
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/interactive-agent');
}
