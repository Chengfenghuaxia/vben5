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

/** POST /site/v1/dep/list */
export async function fetchDepListApi(body: Recordable<unknown>) {
  const data = await siteRequestClient.post<unknown>('/site/v1/dep/list', body);
  return normalizeList(data);
}

/** POST /site/v1/dep/add */
export function depAddApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/dep/add', body);
}

/** POST /site/v1/dep/update */
export function depUpdateApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/dep/update', body);
}

/** POST /site/v1/dep/del */
export function depDelApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/dep/del', body);
}

/** GET /site/v1/dep/all/list */
export async function fetchDepAllListApi(): Promise<
  { id: number; name: string }[]
> {
  const data = await siteRequestClient.get<unknown>('/site/v1/dep/all/list');
  if (data == null || typeof data !== 'object') {
    return [];
  }
  const list = (data as Record<string, unknown>).list;
  if (!Array.isArray(list)) {
    return [];
  }
  return list as { id: number; name: string }[];
}
