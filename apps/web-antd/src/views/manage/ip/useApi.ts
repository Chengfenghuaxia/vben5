import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

function normalizeList(raw: unknown): {
  list: Record<string, unknown>[];
  total: number;
} {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.records ?? d.items ?? []) as Record<
    string,
    unknown
  >[];
  const total = Number(d.total ?? d.count ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/ip/list */
export async function fetchIpListApi(body: Recordable<unknown>) {
  const data = await siteRequestClient.post<unknown>('/site/v1/ip/list', body);
  return normalizeList(data);
}

/** POST /site/v1/ip/add */
export function ipAddApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/ip/add', body);
}

/** POST /site/v1/ip/del */
export function ipDelApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/ip/del', body);
}
