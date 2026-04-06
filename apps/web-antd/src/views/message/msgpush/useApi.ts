import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/**
 * 推送任务列表行 — 与 site_ui `message/msgPush/index.vue` 列字段一致
 */
export interface PushTaskRow {
  created_at?: number | string;
  cycle?: null | number;
  cycle_time?: string;
  cycle_days?: number[];
  failed_num?: number;
  id: number;
  msg_type?: null | number;
  num?: number;
  push_type?: null | number;
  send_type?: null | number;
  sending_at?: number | string;
  status?: null | number;
  success_num?: number;
  template_id?: null | number;
  template_name?: string;
  updated_at?: number | string;
  user_type?: null | number;
}

export interface PushTaskListResult {
  list: PushTaskRow[];
  total: number;
}

function normalizeList(raw: unknown): PushTaskListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as PushTaskRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/push/task/list — site_ui pushTaskList */
export async function fetchPushTaskListApi(
  params: Recordable<unknown>,
): Promise<PushTaskListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/push/task/list',
    params,
  );
  return normalizeList(data);
}

/** 新增/编辑提交体 — 与 site_ui `msgPush/modules/create-venues.vue` submitData 一致 */
export interface PushTaskSaveBody extends Record<string, unknown> {
  id?: number;
  cycle?: null | number;
  cycle_days?: number[];
  cycle_time?: null | string;
  msg_type?: null | number;
  push_type: number;
  send_type: number;
  sending_at?: null | number | string;
  status: number;
  template_id: number;
  user_type: number;
}

/** POST /site/v1/push/task/add — site_ui pushTaskAdd */
export async function createPushTaskApi(body: PushTaskSaveBody) {
  return siteRequestClient.post<unknown>('/site/v1/push/task/add', body);
}

/** POST /site/v1/push/task/update — site_ui pushTaskUpdate */
export async function updatePushTaskApi(
  body: PushTaskSaveBody & { id: number },
) {
  return siteRequestClient.post<unknown>('/site/v1/push/task/update', body);
}

/** POST /site/v1/push/task/del — site_ui pushTaskDel */
export async function deletePushTaskApi(body: { id?: number; ids?: number[] }) {
  return siteRequestClient.post<unknown>('/site/v1/push/task/del', body);
}
