/**
 * 与 site_ui `utils/checkPermission.ts` 一致：判断权限 id 是否在当前页的 apis 列表中。
 * 开发环境下若路由未携带 `meta.apis`（空数组），默认放行，避免本地 prem mock 无 apis 时整页按钮不可用。
 */
export function normalizeApisArray(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: number[] = [];
  for (const x of raw) {
    if (typeof x === 'number' && Number.isFinite(x)) {
      out.push(x);
    } else if (typeof x === 'string' && /^\d+$/.test(x.trim())) {
      out.push(Number(x.trim()));
    } else if (x && typeof x === 'object' && 'id' in (x as object)) {
      const n = Number((x as { id: unknown }).id);
      if (Number.isFinite(n)) {
        out.push(n);
      }
    }
  }
  return out;
}

export function checkSiteApiPermission(
  id: number | number[],
  apis: number[],
  mode: 'all' | 'any' = 'any',
): boolean {
  if (
    (!apis || apis.length === 0) &&
    typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV
  ) {
    return true;
  }

  const apiSet = new Set(apis);
  const checkIds = (Array.isArray(id) ? id : [id]).filter((v) =>
    Number.isSafeInteger(v),
  ) as number[];

  if (checkIds.length === 0) {
    return false;
  }

  return checkIds[mode === 'all' ? 'every' : 'some']((targetId) =>
    apiSet.has(targetId),
  );
}
