import type { Router } from 'vue-router';

/**
 * 当前路由 `matched` 上各级 `meta.apis` 的并集（与 `v-site-permission` 一致）。
 */
export function getMergedRouteApis(router: Router): number[] {
  const merged = new Set<number>();
  for (const record of router.currentRoute.value.matched) {
    for (const id of normalizeApisArray(record.meta?.apis)) {
      merged.add(id);
    }
  }
  return [...merged];
}

/**
 * 与 site_ui `utils/checkPermission.ts` 一致：判断权限 id 是否在「当前页可用」的 apis 列表中。
 * 实际调用处（`v-site-permission`）会把 `route.matched` 上各级的 `meta.apis` 做并集，与常见 prem 挂在父级菜单的行为一致。
 * 开发环境下若合并后仍无 apis，默认放行，避免本地 prem mock 无 apis 时整页按钮不可用。
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
