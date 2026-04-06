import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

export interface SiteNotifyRow {
  id: number;
  notify_type?: null | number;
  related_code?: string;
  scene?: null | number;
  status?: null | number;
  template_id?: null | number;
  template_name?: string;
  updated_at?: number | string;
  user_type?: null | number;
}

export interface SiteNotifyListResult {
  list: SiteNotifyRow[];
  total: number;
}

function normalizeNotifyList(raw: unknown): SiteNotifyListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as SiteNotifyRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/notify/list */
export async function fetchSiteNotifyListApi(
  params: Recordable<unknown>,
): Promise<SiteNotifyListResult> {
  const data = await siteRequestClient.post<unknown>('/site/v1/notify/list', params);
  return normalizeNotifyList(data);
}

export interface SiteNotifySaveBody {
  id?: number;
  notify_type: number;
  related_code?: string;
  scene: number;
  status: number;
  template_id: number;
  user_type: number;
}

/** POST /site/v1/notify/add */
export async function createSiteNotifyApi(body: SiteNotifySaveBody) {
  return siteRequestClient.post<unknown>('/site/v1/notify/add', body);
}

/** POST /site/v1/notify/update */
export async function updateSiteNotifyApi(body: SiteNotifySaveBody & { id: number }) {
  return siteRequestClient.post<unknown>('/site/v1/notify/update', body);
}

/** POST /site/v1/notify/del */
export async function deleteSiteNotifyApi(body: { id?: number; ids?: number[] }) {
  return siteRequestClient.post<unknown>('/site/v1/notify/del', body);
}

export interface MsgTmplOptionRow {
  id: number;
  name: string;
}

/** POST /site/v1/msg/tmpl/all/list */
export async function fetchMsgTmplAllListApi(body: {
  tmpl_type: number;
}): Promise<MsgTmplOptionRow[]> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/msg/tmpl/all/list',
    body,
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
      const name = typeof r.name === 'string' ? r.name : '';
      if (!Number.isFinite(id)) {
        return null;
      }
      return { id, name };
    })
    .filter((x): x is MsgTmplOptionRow => x !== null);
}
