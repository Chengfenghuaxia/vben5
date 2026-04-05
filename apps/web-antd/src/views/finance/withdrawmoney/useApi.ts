import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/**
 * 取现管理 — 与 site_ui `service/api/withdrawal.ts` 一致。
 * 菜单 path：`/finance/withdrawmoney`（site_ui `finance_withdrawmoney`）
 */
export interface WithdrawalWayRow {
  code?: string;
  id: number | string;
  max?: null | number;
  method?: null | number;
  min?: null | number;
  name?: string;
  operator?: string;
  status?: null | number;
  updated_at?: number | string;
}

export interface WithdrawalWayListResult {
  list: WithdrawalWayRow[];
  total: number;
}

function normalizeWayListPayload(raw: unknown): WithdrawalWayListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.records ?? d.list ?? d.items ?? []) as WithdrawalWayRow[];
  const total = Number(d.total ?? d.count ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/withdrawal/way/list — site_ui GetwithdrawalList */
export async function fetchWithdrawalWayListApi(
  params: Recordable<unknown>,
): Promise<WithdrawalWayListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/withdrawal/way/list',
    params,
  );
  return normalizeWayListPayload(data);
}

/** POST /site/v1/withdrawal/way/status — site_ui Updatewithdrawalwaystatus */
export async function updateWithdrawalWayStatusApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/withdrawal/way/status',
    body,
  );
}

/** POST /site/v1/withdrawal/way/update — site_ui Setwithdrawalway（编辑取现范围） */
export async function setWithdrawalWayApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/withdrawal/way/update',
    body,
  );
}
