import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/**
 * 接口与 E:\\备份\\游戏后台管理\\site_ui\\src\\service\\api\\withdrawal.ts、risk.ts 一致。
 * 列表：POST /site/v1/withdrawal/list
 */
export interface FinanceWithdrawalRow {
  account_name?: string;
  account_no?: string;
  account_type?: string;
  agent_name?: string;
  amount?: number;
  bank_code?: string;
  black_status?: null | number;
  channel?: string;
  channel_fee?: number;
  created_at?: number | string;
  fee?: number;
  id: number;
  identify_type?: string;
  ip?: string;
  operator?: string;
  order_id?: string;
  pid?: number | string;
  real_amount?: number;
  remark?: string;
  sn_id?: string;
  status?: null | number;
  team_name?: string;
  uid?: number;
  updated_at?: number | string;
}

export interface FinanceWithdrawalListResult {
  channel_fee?: number | string;
  fee?: number | string;
  list: FinanceWithdrawalRow[];
  success_rate?: number;
  total: number;
  withdrawal_amount?: number | string;
  withdrawal_count?: number;
  withdrawal_real_amount?: number | string;
  withdrawal_user?: number;
}

function normalizeWithdrawListPayload(
  raw: unknown,
): FinanceWithdrawalListResult {
  if (raw == null || typeof raw !== 'object') {
    return {
      list: [],
      total: 0,
    };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? d.records ?? []) as FinanceWithdrawalRow[];
  const total = Number(d.total ?? d.count ?? 0);
  const sr = d.success_rate;
  return {
    channel_fee: d.channel_fee as number | string | undefined,
    fee: d.fee as number | string | undefined,
    list: Array.isArray(list) ? list : [],
    success_rate: (() => {
      const s = typeof sr === 'number' ? sr : Number(sr);
      return Number.isFinite(s) ? s : 0;
    })(),
    total: Number.isFinite(total) ? total : 0,
    withdrawal_amount: d.withdrawal_amount as number | string | undefined,
    withdrawal_count: Number(d.withdrawal_count ?? 0) || undefined,
    withdrawal_real_amount: d.withdrawal_real_amount as
      | number
      | string
      | undefined,
    withdrawal_user: Number(d.withdrawal_user ?? 0) || undefined,
  };
}

/** POST /site/v1/withdrawal/list */
export async function fetchFinanceWithdrawalListApi(
  params: Recordable<unknown>,
): Promise<FinanceWithdrawalListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/withdrawal/list',
    params,
  );
  return normalizeWithdrawListPayload(data);
}

/** POST /site/v1/export/financial/withdrawal/export */
export async function exportFinanceWithdrawalListApi(
  body: Recordable<unknown>,
) {
  return siteRequestClient.post<unknown>(
    '/site/v1/export/financial/withdrawal/export',
    body,
  );
}

/** POST /site/v1/withdrawal/lock — 审核通过并放款 */
export async function withdrawalLockApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/lock', body);
}

/** POST /site/v1/withdrawal/reject */
export async function withdrawalRejectApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/reject', body);
}

/** POST /site/v1/withdrawal/unlock */
export async function withdrawalUnlockApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/unlock', body);
}

/** POST /site/v1/withdrawal/pay — 代付提现 */
export async function withdrawalPayApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/pay', body);
}

/** POST /site/v1/withdrawal/reorder — 重新下单 */
export async function withdrawalReorderApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/reorder', body);
}

/** POST /site/v1/withdrawal/success — 置为成功 body: { order_id } */
export async function withdrawalSuccessApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/success', body);
}

/** POST /site/v1/withdrawal/reject/success — 批量拒绝成功订单 */
export async function withdrawalRejectSuccessApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/withdrawal/reject/success',
    body,
  );
}

/** POST /site/v1/withdrawal/refund */
export async function withdrawalRefundApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/withdrawal/refund', body);
}

/** POST /site/v1/risk/account/blacklist/add */
export async function addAccountBlacklistApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/risk/account/blacklist/add',
    body,
  );
}
