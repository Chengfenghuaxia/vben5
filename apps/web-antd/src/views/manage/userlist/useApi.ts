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

/** POST /site/v1/admin/account/list */
export async function fetchAdminAccountListApi(body: Recordable<unknown>) {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/admin/account/list',
    body,
  );
  return normalizeList(data);
}

/** POST /site/v1/admin/account/add */
export function adminAccountAddApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/admin/account/add', body);
}

/** POST /site/v1/admin/account/update */
export function adminAccountUpdateApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/admin/account/update', body);
}

/** POST /site/v1/admin/account/delete */
export function adminAccountDeleteApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/admin/account/delete', body);
}

/** POST /site/v1/admin/account/auth/secret/reset */
export function adminAccountAuthSecretResetApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/admin/account/auth/secret/reset',
    body,
  );
}

/** POST /site/v1/admin/account/pwd/reset */
export function adminAccountPwdResetApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/admin/account/pwd/reset',
    body,
  );
}

/** POST /site/v1/team/all/list — 用户表单推广总代 */
export async function fetchTeamAllListApi(): Promise<
  { id: number; name: string }[]
> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/team/all/list',
    {},
  );
  if (data == null || typeof data !== 'object') {
    return [];
  }
  const list = (data as Record<string, unknown>).list;
  if (!Array.isArray(list)) {
    return [];
  }
  return list as { id: number; name: string }[];
}

/** POST /site/v1/agent/all/list — 用户表单渠道 */
export async function fetchAgentAllListApi(
  team_ids: number[],
): Promise<{ id: number; name: string }[]> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/agent/all/list',
    { team_ids },
  );
  if (data == null || typeof data !== 'object') {
    return [];
  }
  const list = (data as Record<string, unknown>).list;
  if (!Array.isArray(list)) {
    return [];
  }
  return list as { id: number; name: string }[];
}
