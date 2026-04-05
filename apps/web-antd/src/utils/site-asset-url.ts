/**
 * 静态图片域名前缀，对齐 site_ui `utils/common.ts` 的 `getcurrenturl()`。
 *
 * site_ui 在 `vite.config.ts` 里 `define: { S3: JSON.stringify(process.env.S3 + '/') }`，
 * `getcurrenturl()` 为：`S3 === 'undefined/' ? 'https://assets.xin/' : S3`，
 * 列表里用 `getcurrenturl() + record.icon` 拼接。
 *
 * 本项目用 `VITE_GLOB_SITE_S3`（建议带尾 `/`，也可只写域名会自动补全）。
 */
export function getSiteAssetBaseUrl(): string {
  const raw = import.meta.env.VITE_GLOB_SITE_S3;
  const s = raw === undefined || raw === null ? '' : String(raw).trim();
  if (s === '' || s === 'undefined/' || s === 'undefined') {
    return 'https://assets.xin/';
  }
  return s.endsWith('/') ? s : `${s}/`;
}

/** 将接口返回的相对 path 拼成完整图片 URL（已是 http(s) 则原样返回） */
export function resolveSiteAssetUrl(relativePath: string): string {
  if (!relativePath) {
    return '';
  }
  const p = String(relativePath).trim();
  if (/^https?:\/\//i.test(p)) {
    return p;
  }
  const base = getSiteAssetBaseUrl();
  const pathNoLeading = p.replace(/^\/+/, '');
  return `${base}${pathNoLeading}`;
}
