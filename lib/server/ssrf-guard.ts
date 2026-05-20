/**
 * @file ssrf-guard.ts
 * @description SSRF（服务端请求伪造）防护工具
 *
 * 提供 URL 安全校验函数，阻止对内网和本地地址的请求，防止 SSRF 攻击。
 * 检测范围包括：localhost、127.0.0.1、::1、0.0.0.0、10.x.x.x、172.16-31.x.x、
 * 192.168.x.x、169.254.x.x（链路本地）、.local 域名、IPv6 本地地址（fd/fe80 前缀）。
 * 仅允许 HTTP/HTTPS 协议。
 *
 * @exports validateUrlForSSRF - 校验 URL 是否安全，返回错误消息或 null（安全）
 */

function isPrivate172(hostname: string): boolean {
  if (!hostname.startsWith('172.')) return false;
  const second = parseInt(hostname.split('.')[1], 10);
  return second >= 16 && second <= 31;
}

export function validateUrlForSSRF(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL';
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return 'Only HTTP(S) URLs are allowed';
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('169.254.') ||
    isPrivate172(hostname) ||
    hostname.endsWith('.local') ||
    hostname.startsWith('fd') ||
    hostname.startsWith('fe80')
  ) {
    return 'Local/private network URLs are not allowed';
  }

  return null;
}
