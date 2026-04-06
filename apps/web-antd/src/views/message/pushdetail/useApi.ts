import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/**
 * 推送详情列表（按任务维度子记录）— site_ui `pushDetail/index.vue` messagePushList
 */
export interface MessagePushRow {
  created_at?: number | string;
  failed_num?: number;
  id: number;
  msg_type?: null | number;
  num?: number;
  push_type?: null | number;
  send_type?: null | number;
  sending_at?: number | string;
  status?: null | number;
  success_num?: number;
  task_id?: number;
  template_name?: string;
  user_type?: null | number;
}

/**
 * 单条推送触达明细 — site_ui `messagePushDetailList`，参数 task_id / uid
 */
export interface PushReachDetailRow {
  id: number;
  phone?: string;
  site?: string;
  status?: null | number;
  task_id?: number;
  uid?: number;
  updated_at?: number | string;
}

function normalizeList(raw: unknown): {
  list: Record<string, unknown>[];
  total: number;
} {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as Record<string, unknown>[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/push/list — site_ui messagePushList */
export async function fetchMessagePushListApi(
  params: Recordable<unknown>,
): Promise<{ list: MessagePushRow[]; total: number }> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/push/list',
    params,
  );
  const { list, total } = normalizeList(data);
  return { list: list as unknown as MessagePushRow[], total };
}

/** POST /site/v1/push/detail/list — site_ui messagePushDetailList */
export async function fetchPushReachDetailListApi(
  params: Recordable<unknown>,
): Promise<{ list: PushReachDetailRow[]; total: number }> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/push/detail/list',
    params,
  );
  const { list, total } = normalizeList(data);
  return { list: list as unknown as PushReachDetailRow[], total };
}

/** POST /site/v1/push/del — site_ui messagePushDel */
export async function deleteMessagePushApi(body: {
  id?: number;
  ids?: number[];
}) {
  return siteRequestClient.post<unknown>('/site/v1/push/del', body);
}

/** POST /site/v1/push/update — site_ui messagePushUpdate（暂停/继续等） */
export async function updateMessagePushApi(body: {
  id: number;
  status: number;
}) {
  return siteRequestClient.post<unknown>('/site/v1/push/update', body);
}

/** POST /site/v1/export/push/detail/export — site_ui pushDetailExport */
export async function exportPushDetailApi(params: Recordable<unknown>) {
  return siteRequestClient.post<unknown>(
    '/site/v1/export/push/detail/export',
    params,
  );
}
