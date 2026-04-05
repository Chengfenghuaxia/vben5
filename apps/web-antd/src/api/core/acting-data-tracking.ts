import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/** 数据埋点列表行（与 site_ui `website/dataTracking`、POST /site/v1/track/list 一致） */
export interface ActingDataTrackingRow {
  code?: string;
  created_at?: number | string;
  deposit?: number;
  domain?: string;
  events?: number[] | string;
  id: number;
  login?: number;
  name?: string;
  pv?: number;
  redirect?: number;
  register?: number;
  updated_at?: number | string;
  url?: string;
  uv?: number;
}

export interface ActingDataTrackingListResult {
  list: ActingDataTrackingRow[];
  total: number;
}

function normalizeDataTrackingListPayload(
  raw: unknown,
): ActingDataTrackingListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as ActingDataTrackingRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/track/list */
export async function fetchActingDataTrackingListApi(
  params: Recordable<unknown>,
): Promise<ActingDataTrackingListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/track/list',
    params,
  );
  return normalizeDataTrackingListPayload(data);
}

/** 新增 / 编辑提交体 */
export interface ActingDataTrackingSaveBody {
  domain: string;
  events: number[];
  id?: number;
  name: string;
  redirect: number;
}

/** POST /site/v1/track/add */
export async function createActingDataTrackingApi(
  body: ActingDataTrackingSaveBody,
) {
  return siteRequestClient.post<unknown>('/site/v1/track/add', body);
}

/** POST /site/v1/track/update */
export async function updateActingDataTrackingApi(
  body: ActingDataTrackingSaveBody & { id: number },
) {
  return siteRequestClient.post<unknown>('/site/v1/track/update', body);
}

/** POST /site/v1/track/del */
export async function deleteActingDataTrackingApi(body: {
  id?: number;
  ids?: number[];
}) {
  return siteRequestClient.post<unknown>('/site/v1/track/del', body);
}

/** POST /site/v1/track/clear */
export async function clearActingDataTrackingApi(body: { id: number }) {
  return siteRequestClient.post<unknown>('/site/v1/track/clear', body);
}

/** 详情表格行 POST /site/v1/track/record/list */
export interface ActingDataTrackingRecordRow {
  amount?: number;
  created_at?: number | string;
  device?: string;
  id?: number;
  ip?: string;
  phone?: string;
  uid?: number;
}

/** POST /site/v1/track/record/list */
export async function fetchActingDataTrackingRecordListApi(
  params: Recordable<unknown>,
): Promise<{
  list: ActingDataTrackingRecordRow[];
  total: number;
}> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/track/record/list',
    params,
  );
  if (data == null || typeof data !== 'object') {
    return { list: [], total: 0 };
  }
  const d = data as Record<string, unknown>;
  const list = (d.list ?? []) as ActingDataTrackingRecordRow[];
  const total = Number(d.total ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/domain/track/list — 表单域名下拉（与 site_ui domainTrackList 一致） */
export async function fetchDomainTrackListApi(
  body: Recordable<unknown> = {},
): Promise<{ name?: string; url?: string }[]> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/domain/track/list',
    body,
  );
  if (data == null || typeof data !== 'object') {
    return [];
  }
  const list = (data as Record<string, unknown>).list;
  return Array.isArray(list) ? (list as { name?: string; url?: string }[]) : [];
}

/** POST /site/v1/export/track/register/export */
export async function exportActingDataTrackingRegisterApi(
  body: Recordable<unknown>,
) {
  return siteRequestClient.post<unknown>(
    '/site/v1/export/track/register/export',
    body,
  );
}

/** POST /site/v1/export/track/login/export */
export async function exportActingDataTrackingLoginApi(
  body: Recordable<unknown>,
) {
  return siteRequestClient.post<unknown>(
    '/site/v1/export/track/login/export',
    body,
  );
}

/** POST /site/v1/export/track/deposit/export */
export async function exportActingDataTrackingDepositApi(
  body: Recordable<unknown>,
) {
  return siteRequestClient.post<unknown>(
    '/site/v1/export/track/deposit/export',
    body,
  );
}

/** POST /site/v1/export/record — 导出任务列表（站点通用能力，当前仅数据埋点详情使用） */
export interface ExportRecordRow {
  create_at?: number;
  file_name?: string;
  id?: number;
  operator?: string;
  progress?: number;
  status?: number;
  url?: string;
}

export async function fetchExportRecordApi(
  params: Recordable<unknown>,
): Promise<{
  list: ExportRecordRow[];
  total: number;
}> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/export/record',
    params,
  );
  if (data == null || typeof data !== 'object') {
    return { list: [], total: 0 };
  }
  const d = data as Record<string, unknown>;
  const list = (d.list ?? []) as ExportRecordRow[];
  const total = Number(d.total ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/export/del */
export async function deleteExportRecordApi(body: { id: number }) {
  return siteRequestClient.post<unknown>('/site/v1/export/del', body);
}
