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

/** POST /site/v1/role/list */
export async function fetchRoleListApi(body: Recordable<unknown>) {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/role/list',
    body,
  );
  return normalizeList(data);
}

/** POST /site/v1/role/add */
export function roleAddApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/role/add', body);
}

/** POST /site/v1/role/update */
export function roleUpdateApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/role/update', body);
}

/** POST /site/v1/role/del */
export function roleDelApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/role/del', body);
}

/** POST /site/v1/role/authority */
export async function fetchRoleAuthorityApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/role/authority', body);
}

/** POST /site/v1/role/authority/update */
export function updateRoleAuthorityApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/role/authority/update',
    body,
  );
}

/** GET /site/v1/role/all/list */
export async function fetchRoleAllListApi(): Promise<
  { id: number; name: string }[]
> {
  const data = await siteRequestClient.get<unknown>('/site/v1/role/all/list');
  if (data == null || typeof data !== 'object') {
    return [];
  }
  const list = (data as Record<string, unknown>).list;
  if (!Array.isArray(list)) {
    return [];
  }
  return list as { id: number; name: string }[];
}
