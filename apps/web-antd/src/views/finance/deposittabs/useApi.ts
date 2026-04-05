import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

export interface DepositTabRow {
  amount?: number;
  id: number;
  is_hot?: number;
  operator?: string;
  sort?: number;
  status?: number;
  template_id?: number;
  updated_at?: number | string;
}

export interface DepositTabsListResult {
  list: DepositTabRow[];
  total: number;
}

function normalizeTabsList(raw: unknown): DepositTabsListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.records ?? d.items ?? []) as DepositTabRow[];
  const total = Number(d.total ?? d.count ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/deposit/tabs/list */
export async function fetchDepositTabsListApi(
  params: Recordable<unknown>,
): Promise<DepositTabsListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/deposit/tabs/list',
    params,
  );
  return normalizeTabsList(data);
}

/** POST /site/v1/deposit/tabs/add */
export async function addDepositTabApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/deposit/tabs/add', body);
}

/** POST /site/v1/deposit/tabs/update */
export async function updateDepositTabApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/deposit/tabs/update', body);
}

/** POST /site/v1/deposit/tabs/del */
export async function delDepositTabApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/deposit/tabs/del', body);
}

/** POST /site/v1/deposit/template/add */
export async function depositTemplateAddApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/deposit/template/add', body);
}

/** POST /site/v1/deposit/template/del */
export async function depositTemplateDelApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/deposit/template/del', body);
}

/** POST /site/v1/deposit/template/config/update */
export async function depositTemplateConfigUpdateApi(
  body: Recordable<unknown>,
) {
  return siteRequestClient.post<unknown>(
    '/site/v1/deposit/template/config/update',
    body,
  );
}

/** POST /site/v1/deposit/template/update */
export async function depositTemplateUpdateTeamApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/deposit/template/update',
    body,
  );
}
