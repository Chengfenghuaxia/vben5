import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/** 推广总代列表行（与 site_ui `acting/team` 一致） */
export interface ActingTeamDomainEntry {
  domain: string;
  used?: 1 | 2;
}

export interface ActingTeamRow {
  domains?: ActingTeamDomainEntry[];
  id: number;
  name?: string;
  operator?: string;
  updated_at?: number | string;
  /** 列表展示的推广域名（多为多域名拼接） */
  url?: string;
}

export interface ActingTeamListResult {
  list: ActingTeamRow[];
  total: number;
}

function normalizeTeamListPayload(raw: unknown): ActingTeamListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as ActingTeamRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return { list: Array.isArray(list) ? list : [], total: Number.isFinite(total) ? total : 0 };
}

/** POST /site/v1/team/list */
export async function fetchActingTeamListApi(
  params: Recordable<unknown>,
): Promise<ActingTeamListResult> {
  const data = await siteRequestClient.post<unknown>('/site/v1/team/list', params);
  return normalizeTeamListPayload(data);
}

/** 新增 / 编辑提交体（与 site_ui 抽屉 model 一致：domain 为域名数组） */
export interface ActingTeamSaveBody {
  domain: string[];
  id?: number | string;
  name: string;
}

/** POST /site/v1/team/add */
export async function createActingTeamApi(body: ActingTeamSaveBody) {
  return siteRequestClient.post<unknown>('/site/v1/team/add', body);
}

/** POST /site/v1/team/update */
export async function updateActingTeamApi(body: ActingTeamSaveBody & { id: number | string }) {
  return siteRequestClient.post<unknown>('/site/v1/team/update', body);
}

/** POST /site/v1/team/del — 单条 { id } 或批量 { ids } */
export async function deleteActingTeamApi(body: { id?: number | string; ids?: number[] }) {
  return siteRequestClient.post<unknown>('/site/v1/team/del', body);
}

export interface DomainOptionRow {
  domain: string;
}

function normalizeDomainList(raw: unknown): DomainOptionRow[] {
  if (raw == null || typeof raw !== 'object') {
    return [];
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as unknown[];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((row) => {
      if (typeof row === 'string') {
        return { domain: row };
      }
      if (!row || typeof row !== 'object') {
        return null;
      }
      const r = row as Record<string, unknown>;
      const dom = typeof r.domain === 'string' ? r.domain : '';
      return dom ? { domain: dom } : null;
    })
    .filter((x): x is DomainOptionRow => x !== null);
}

/** GET /site/v1/domain/all/list（与 site_ui `GetAlldomainList` 一致） */
export async function fetchDomainAllListApi(): Promise<DomainOptionRow[]> {
  const data = await siteRequestClient.get<unknown>('/site/v1/domain/all/list');
  return normalizeDomainList(data);
}
