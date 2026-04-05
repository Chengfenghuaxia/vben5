import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/**
 * 渠道列表 — 与 site_ui `service/api/channel.ts` 一致。
 */
export interface FinChannelRow {
  code?: string;
  id: number | string;
  mode?: null | number;
  name?: string;
  operator?: string;
  pay_in_status?: null | number;
  pay_in_weight?: number;
  pay_out_status?: null | number;
  pay_out_weight?: number;
  status?: null | number;
  updated_at?: number | string;
}

export interface FinChannelListResult {
  list: FinChannelRow[];
  total: number;
}

function normalizeList(raw: unknown): FinChannelListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.records ?? d.list ?? d.items ?? []) as FinChannelRow[];
  const total = Number(d.total ?? d.count ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/finchannel/list — site_ui GetChannelList */
export async function fetchFinChannelListApi(
  params: Recordable<unknown>,
): Promise<FinChannelListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/finchannel/list',
    params,
  );
  return normalizeList(data);
}

/** POST /site/v1/finchannel/in/status — site_ui updatePayInStatus */
export async function updateFinChannelPayInStatusApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/finchannel/in/status', body);
}

/** POST /site/v1/finchannel/out/status — site_ui updatePayOutStatus */
export async function updateFinChannelPayOutStatusApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/finchannel/out/status',
    body,
  );
}

/** POST /site/v1/finchannel/in/weight/update — site_ui updatePayInWeight */
export async function updateFinChannelPayInWeightApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/finchannel/in/weight/update',
    body,
  );
}

/** POST /site/v1/finchannel/out/weight/update — site_ui updatePayOutWeight */
export async function updateFinChannelPayOutWeightApi(
  body: Recordable<unknown>,
) {
  return siteRequestClient.post<unknown>(
    '/site/v1/finchannel/out/weight/update',
    body,
  );
}

/** POST /site/v1/finchannel/config — site_ui getfinchannelconfig */
export async function getFinChannelConfigApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/finchannel/config', body);
}

/** POST /site/v1/finchannel/config/update — site_ui updatefinchannelconfig */
export async function updateFinChannelConfigApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/finchannel/config/update',
    body,
  );
}

/** 解析配置接口返回（兼容直接对象或包一层 data） */
export function unwrapFinChannelConfigPayload(
  raw: unknown,
): Record<string, unknown> {
  if (raw == null || typeof raw !== 'object') {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const inner = o.data;
  if (
    inner != null &&
    typeof inner === 'object' &&
    !Array.isArray(inner)
  ) {
    return inner as Record<string, unknown>;
  }
  return o;
}
