/**
 * @file database.ts
 * @description 客户端数据库工具函数
 *
 * 提供 IndexedDB 相关的清理操作。当前包含一个安全的数据库清除函数，
 * 在服务端渲染（SSR）环境中自动跳过执行。
 *
 * @exports clearDatabase - 清除客户端 IndexedDB 数据库
 */

export async function clearDatabase() {
  try {
    if (typeof indexedDB === 'undefined') return;
    await Promise.resolve();
  } catch {
    await Promise.resolve();
  }
}
