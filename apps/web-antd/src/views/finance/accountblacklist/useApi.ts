import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/** 与 site_ui `finance/accountBlacklist`、POST /site/v1/risk/account/blacklist 对齐 */
export interface FinanceAccountBlacklistRow {
  account_name?: string;
  account_no?: string;
  account_type?: string;
  created_at?: number | string;
  id: number;
  ip?: string;
  is_site?: boolean | number;
}

export interface FinanceAccountBlacklistListResult {
  list: FinanceAccountBlacklistRow[];
  total: number;
}

function normalizeBlacklistListPayload(
  raw: unknown,
): FinanceAccountBlacklistListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ??
    d.items ??
    d.records ??
    []) as FinanceAccountBlacklistRow[];
  const total = Number(d.total ?? d.count ?? 0);
  return { list, total: Number.isFinite(total) ? total : 0 };
}

/** POST /site/v1/risk/account/blacklist */
export async function fetchFinanceAccountBlacklistListApi(
  body: Recordable<unknown>,
): Promise<FinanceAccountBlacklistListResult> {
  const res = await siteRequestClient.post<unknown>(
    '/site/v1/risk/account/blacklist',
    body,
  );
  return normalizeBlacklistListPayload(res);
}

/** POST /site/v1/risk/account/blacklist/remove */
export async function removeFinanceAccountBlacklistApi(
  body: Recordable<unknown>,
): Promise<unknown> {
  return siteRequestClient.post<unknown>(
    '/site/v1/risk/account/blacklist/remove',
    body,
  );
}
