import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/**
 * 自动短信任务行 — site_ui `user/autosms/index.vue` + `getsmstasklist`
 */
export interface SmsTaskRow {
  config_id?: number;
  config_name?: string;
  content?: string;
  end_time?: string;
  fail_num?: number;
  id: number;
  mode?: null | number;
  open_time?: number | string;
  operation_at?: number | string;
  operator?: string;
  start_time?: string;
  status?: null | number;
  submit_num?: number;
  success_num?: number;
  success_rate?: string;
}

export interface SmsTaskListResult {
  list: SmsTaskRow[];
  total: number;
}

function normalizeList(raw: unknown): SmsTaskListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as SmsTaskRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/sms/task/list — site_ui getsmstasklist */
export async function fetchSmsTaskListApi(
  params: Recordable<unknown>,
): Promise<SmsTaskListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/sms/task/list',
    params,
  );
  return normalizeList(data);
}

export interface SmsTaskSaveBody {
  config_id: number | string;
  content: string;
  end_time: string;
  id?: number;
  mode: number;
  start_time: string;
  status: number;
}

/** POST /site/v1/sms/task/add — site_ui addsmstask */
export async function createSmsTaskApi(body: SmsTaskSaveBody) {
  return siteRequestClient.post<unknown>('/site/v1/sms/task/add', body);
}

/** POST /site/v1/sms/update — site_ui updatesmstask */
export async function updateSmsTaskApi(body: SmsTaskSaveBody & { id: number }) {
  return siteRequestClient.post<unknown>('/site/v1/sms/update', body);
}

/** POST /site/v1/sms/update/status — site_ui updatestatussmstask */
export async function updateSmsTaskStatusApi(body: {
  id: number;
  status: number;
}) {
  return siteRequestClient.post<unknown>('/site/v1/sms/update/status', body);
}

export interface SmsConfigOptionRow {
  id: number;
  name: string;
}

/** POST /site/v1/sms/config/list — site_ui getCconfiglist */
/** POST /site/v1/sms/record — site_ui getsmsrecord（按 date_type 汇总） */
export interface SmsRecordSummary {
  fail_num: number;
  submit_num: number;
  success_num: number;
}

function normalizeSmsRecord(raw: unknown): SmsRecordSummary {
  if (raw == null || typeof raw !== 'object') {
    return { submit_num: 0, success_num: 0, fail_num: 0 };
  }
  const d = raw as Record<string, unknown>;
  return {
    submit_num: Number(d.submit_num) || 0,
    success_num: Number(d.success_num) || 0,
    fail_num: Number(d.fail_num) || 0,
  };
}

export async function fetchSmsRecordApi(body: {
  date_type: number;
}): Promise<SmsRecordSummary> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/sms/record',
    body,
  );
  return normalizeSmsRecord(data);
}

/** GET /site/v1/sms/balance — site_ui getsmsbalance */
export interface SmsBalancePayload {
  balance: number;
  unit_price: number;
}

function normalizeBalancePayload(raw: unknown): SmsBalancePayload {
  if (raw == null || typeof raw !== 'object') {
    return { balance: 0, unit_price: 0 };
  }
  const d = raw as Record<string, unknown>;
  return {
    balance: Number(d.balance) || 0,
    unit_price: Number(d.unit_price) || 0,
  };
}

/** 与 site_ui 一致：展示 floor(balance / unit_price) 条 */
export function smsBalanceToRemainingCount(payload: SmsBalancePayload): number {
  if (payload.balance === 0 || payload.unit_price === 0) {
    return 0;
  }
  return Math.floor(payload.balance / payload.unit_price);
}

export async function fetchSmsBalanceApi(): Promise<SmsBalancePayload> {
  const data = await siteRequestClient.get<unknown>('/site/v1/sms/balance');
  return normalizeBalancePayload(data);
}

/** GET /site/v1/sms/refresh/balance — site_ui getsmsrefresh */
export async function refreshSmsBalanceApi(): Promise<SmsBalancePayload> {
  const data = await siteRequestClient.get<unknown>(
    '/site/v1/sms/refresh/balance',
  );
  return normalizeBalancePayload(data);
}

/** 通道配置首条（site_ui smsaisle `list[0]`） */
export async function fetchSmsConfigFirstRowApi(): Promise<Record<
  string,
  unknown
> | null> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/sms/config/list',
    {},
  );
  if (data == null || typeof data !== 'object') {
    return null;
  }
  const list = (data as { list?: unknown }).list;
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  const first = list[0];
  return first && typeof first === 'object'
    ? (first as Record<string, unknown>)
    : null;
}

/** POST /site/v1/sms/config/update — site_ui smsconfigupdate */
export async function updateSmsConfigApi(body: Record<string, unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/sms/config/update', body);
}

export async function fetchSmsConfigListApi(): Promise<SmsConfigOptionRow[]> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/sms/config/list',
    {},
  );
  if (data == null || typeof data !== 'object') {
    return [];
  }
  const list = (data as { list?: unknown }).list;
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }
      const r = row as Record<string, unknown>;
      const id = Number(r.id);
      const name = typeof r.name === 'string' ? r.name : String(r.name ?? '');
      if (!Number.isFinite(id)) {
        return null;
      }
      return { id, name };
    })
    .filter((x): x is SmsConfigOptionRow => x !== null);
}
