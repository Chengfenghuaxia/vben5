import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

export interface MsgTmplRow {
  content?: string;
  id: number;
  image?: string;
  language?: string;
  name?: string;
  status?: null | number;
  title?: string;
  tmpl_type?: null | number;
  updated_at?: number | string;
  url?: string;
}

export interface MsgTmplListResult {
  list: MsgTmplRow[];
  total: number;
}

function normalizeList(raw: unknown): MsgTmplListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as MsgTmplRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/msg/tmpl/list */
export async function fetchMsgTmplListApi(
  params: Recordable<unknown>,
): Promise<MsgTmplListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/msg/tmpl/list',
    params,
  );
  return normalizeList(data);
}

export interface MsgTmplSaveBody {
  content: string;
  id?: number;
  image: string;
  language: string;
  name: string;
  site?: string;
  status: number;
  title: string;
  tmpl_type: number;
  url: string;
}

/** POST /site/v1/msg/tmpl/add */
export async function createMsgTmplApi(body: MsgTmplSaveBody) {
  return siteRequestClient.post<unknown>('/site/v1/msg/tmpl/add', body);
}

/** POST /site/v1/msg/tmpl/update */
export async function updateMsgTmplApi(body: MsgTmplSaveBody & { id: number }) {
  return siteRequestClient.post<unknown>('/site/v1/msg/tmpl/update', body);
}

/** POST /site/v1/msg/tmpl/del */
export async function deleteMsgTmplApi(body: { id?: number; ids?: number[] }) {
  return siteRequestClient.post<unknown>('/site/v1/msg/tmpl/del', body);
}
