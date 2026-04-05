import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

export interface WithdrawalTabRow {
  amount?: number;
  id: number;
  operator?: string;
  sort?: number;
  status?: number;
  updated_at?: number | string;
}

export interface WithdrawalTabsListResult {
  list: WithdrawalTabRow[];
  total: number;
}

function normalizeTabsList(raw: unknown): WithdrawalTabsListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.records ?? d.items ?? []) as WithdrawalTabRow[];
  const total = Number(d.total ?? d.count ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/withdrawal/tabs/list */
export async function fetchWithdrawalTabsListApi(
  params: Recordable<unknown>,
): Promise<WithdrawalTabsListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/withdrawal/tabs/list',
    params,
  );
  return normalizeTabsList(data);
}

/** POST /site/v1/withdrawal/tabs/add */
export async function addWithdrawalTabApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/tabs/add', body);
}

/** POST /site/v1/withdrawal/tabs/update */
export async function updateWithdrawalTabApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/withdrawal/tabs/update',
    body,
  );
}

/** POST /site/v1/withdrawal/tabs/del */
export async function delWithdrawalTabApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/tabs/del', body);
}
