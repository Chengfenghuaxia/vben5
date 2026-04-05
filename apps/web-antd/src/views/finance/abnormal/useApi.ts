import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/**
 * 异常订单 — 与 site_ui `src/service/api/abnormal.ts`、`views/finance/abnormal/index.vue` 列表字段一致。
 * POST /site/v1/order/abnormal/list
 */
export interface FinanceAbnormalRow {
  channel?: string;
  created_at?: number | string;
  id: number;
  order_id?: string;
  order_type?: null | number;
  params?: string;
  sn_id?: string;
  sn_status?: null | number;
  status?: null | number;
  uid?: number;
}

export interface FinanceAbnormalListResult {
  list: FinanceAbnormalRow[];
  total: number;
}

function normalizeAbnormalListPayload(raw: unknown): FinanceAbnormalListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  /** site_ui useTable transformer 使用 data.records；后端也可能返回 list */
  const list = (d.records ?? d.list ?? d.items ?? []) as FinanceAbnormalRow[];
  const total = Number(d.total ?? d.count ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/order/abnormal/list */
export async function fetchFinanceAbnormalListApi(
  params: Recordable<unknown>,
): Promise<FinanceAbnormalListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/order/abnormal/list',
    params,
  );
  return normalizeAbnormalListPayload(data);
}
