import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/** 充值订单列表行（字段与 site_ui `finance/deposit`、POST /site/v1/deposit/list 对齐） */
export interface FinanceDepositRow {
  agent_name?: string;
  amount?: number;
  channel?: string;
  created_at?: number | string;
  fee?: number;
  gift_status?: null | number;
  id: number;
  operator?: string;
  order_id?: string;
  pid?: number | string;
  real_amount?: number;
  remark?: string;
  sn_id?: string;
  status?: null | number;
  team_name?: string;
  template_id?: number;
  template_name?: string;
  uid?: number;
  updated_at?: number | string;
}

export interface FinanceDepositListStats {
  deposit_amount?: number | string;
  deposit_count?: number;
  deposit_user?: number;
  fee?: number | string;
  success_rate?: number;
}

export interface FinanceDepositListResult extends FinanceDepositListStats {
  list: FinanceDepositRow[];
  total: number;
}

function normalizeDepositListPayload(raw: unknown): FinanceDepositListResult {
  if (raw == null || typeof raw !== 'object') {
    return {
      deposit_amount: undefined,
      deposit_count: undefined,
      deposit_user: undefined,
      fee: undefined,
      list: [],
      success_rate: undefined,
      total: 0,
    };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? d.records ?? []) as FinanceDepositRow[];
  const total = Number(d.total ?? d.count ?? 0);
  return {
    deposit_amount: d.deposit_amount as number | string | undefined,
    deposit_count: Number(d.deposit_count ?? 0) || undefined,
    deposit_user: Number(d.deposit_user ?? 0) || undefined,
    fee: d.fee as number | string | undefined,
    list: Array.isArray(list) ? list : [],
    success_rate: (() => {
      const s =
        typeof d.success_rate === 'number' ? d.success_rate : Number(d.success_rate);
      return Number.isFinite(s) ? s : 0;
    })(),
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/deposit/list */
export async function fetchFinanceDepositListApi(
  params: Recordable<unknown>,
): Promise<FinanceDepositListResult> {
  const data = await siteRequestClient.post<unknown>('/site/v1/deposit/list', params);
  return normalizeDepositListPayload(data);
}

/** POST /site/v1/deposit/success — 设置成功 */
export async function setFinanceDepositSuccessApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/deposit/success', body);
}

/** POST /site/v1/deposit/add — 创建订单 */
export async function createFinanceDepositOrderApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/deposit/add', body);
}

/** POST /site/v1/export/financial/deposit/export */
export async function exportFinanceDepositListApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/export/financial/deposit/export', body);
}

export interface FinChannelOptionRow {
  code: string;
  name: string;
  pay_in_status?: number;
}

function normalizeFinChannelList(raw: unknown): FinChannelOptionRow[] {
  if (raw == null || typeof raw !== 'object') {
    return [];
  }
  const list = (raw as Record<string, unknown>).list;
  if (!Array.isArray(list)) {
    return [];
  }
  const out: FinChannelOptionRow[] = [];
  for (const row of list) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const r = row as Record<string, unknown>;
    const code = typeof r.code === 'string' ? r.code : '';
    const name = typeof r.name === 'string' ? r.name : '';
    if (!code) {
      continue;
    }
    const pis = r.pay_in_status;
    const pay_in_status =
      typeof pis === 'number'
        ? pis
        : pis != null && pis !== ''
          ? Number(pis)
          : undefined;
    out.push({
      code,
      name: name || code,
      pay_in_status: Number.isFinite(Number(pay_in_status)) ? Number(pay_in_status) : undefined,
    });
  }
  return out;
}

/** POST /site/v1/finchannel/all/list */
export async function fetchFinChannelAllListApi(
  body: Recordable<unknown> = {},
): Promise<FinChannelOptionRow[]> {
  const data = await siteRequestClient.post<unknown>('/site/v1/finchannel/all/list', body);
  return normalizeFinChannelList(data);
}

export interface DepositTemplateRow {
  agents?: { id: number; name?: string }[] | null;
  id: number;
  name?: string;
  team_name?: string;
}

function normalizeTemplateList(raw: unknown): DepositTemplateRow[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw as DepositTemplateRow[];
  }
  if (typeof raw === 'object') {
    const d = raw as Record<string, unknown>;
    const list = (d.list ?? d.data ?? d.items) as unknown;
    if (Array.isArray(list)) {
      return list as DepositTemplateRow[];
    }
  }
  return [];
}

/** POST /site/v1/deposit/template/list */
export async function fetchDepositTemplateListApi(
  body: Recordable<unknown> = {},
): Promise<DepositTemplateRow[]> {
  const data = await siteRequestClient.post<unknown>('/site/v1/deposit/template/list', body);
  return normalizeTemplateList(data);
}
