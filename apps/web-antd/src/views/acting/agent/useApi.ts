import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/** 推广代理（渠道）列表行，字段以后端为准 */
/** 与 site_ui 推广渠道一致：广告平台配置（测试链接用 pixel_id + md5） */
export type ActingAgentAdPlatform = 'kwai' | 'meta' | 'tiktok';

export interface ActingAgentAdConfigEntry {
  pixel_id?: string;
  secret_key?: string;
  test_code?: string;
}

export interface ActingAgentRow {
  /** 当前投放平台，默认 meta */
  ad_codes?: ActingAgentAdPlatform | string;
  ad_config?: Partial<
    Record<ActingAgentAdPlatform | string, ActingAgentAdConfigEntry>
  >;
  agent_type?: null | number;
  id: number;
  is_single?: null | number;
  name?: string;
  operator?: string;
  pwa_type?: null | number;
  team_id?: number;
  team_name?: string;
  updated_at?: number | string;
  url?: string;
}

/** 新增 / 编辑提交体，字段以后端为准（与 site_ui 渠道表单一致） */
export interface ActingAgentSaveBody {
  ad_codes?: string;
  ad_config?: Partial<Record<string, ActingAgentAdConfigEntry>>;
  agent_type: number;
  id?: number;
  is_single?: number;
  name: string;
  pwa_type?: number;
  team_id: number;
  url?: string;
}

export interface ActingAgentListResult {
  list: ActingAgentRow[];
  total: number;
}

function normalizeListPayload(raw: unknown): ActingAgentListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as ActingAgentRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/agent/list */
export async function fetchActingAgentListApi(
  params: Recordable<unknown>,
): Promise<ActingAgentListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/agent/list',
    params,
  );
  return normalizeListPayload(data);
}

/** POST /site/v1/agent/del */
export async function deleteActingAgentsApi(body: { ids: number[] }) {
  return siteRequestClient.post<unknown>('/site/v1/agent/del', body);
}

/** POST /site/v1/agent/add */
export async function createActingAgentApi(body: ActingAgentSaveBody) {
  return siteRequestClient.post<unknown>('/site/v1/agent/add', body);
}

/** POST /site/v1/agent/update */
export async function updateActingAgentApi(
  body: ActingAgentSaveBody & { id: number },
) {
  return siteRequestClient.post<unknown>('/site/v1/agent/update', body);
}

export interface IdNameItem {
  id: number;
  name: string;
}

function normalizeIdNameList(raw: unknown): IdNameItem[] {
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
    .filter((x): x is IdNameItem => x !== null);
}

/** POST /site/v1/team/all/list — 推广总代下拉 */
export async function fetchTeamAllListApi(
  body: Recordable<unknown> = {},
): Promise<IdNameItem[]> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/team/all/list',
    body,
  );
  return normalizeIdNameList(data);
}

/** POST /site/v1/agent/all/list — 渠道名称下拉（可按 team_ids 过滤） */
export async function fetchAgentAllListApi(body: {
  team_ids?: number[];
}): Promise<IdNameItem[]> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/agent/all/list',
    body,
  );
  return normalizeIdNameList(data);
}
