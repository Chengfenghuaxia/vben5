import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

import {
  fetchAgentAllListApi,
  fetchTeamAllListApi,
} from '#/views/acting/agent/useApi';

export { fetchAgentAllListApi, fetchTeamAllListApi };

/** 会员列表行 — site_ui `user/userlist` + `GetUserListU`（字段随后端扩展） */
export interface SiteMemberRow {
  account_no?: string;
  addip?: string;
  addr?: string;
  agent_name?: string;
  amount?: number;
  created_at?: number | string;
  deposit?: number;
  deposit_today?: number;
  direct_sub_count?: number;
  first_deposit_at?: number | string;
  freeze?: number;
  gift_amount?: number;
  gift_amount_today?: number;
  id: number;
  invite?: string;
  invite_source?: string;
  login_addr?: string;
  login_at?: number | string;
  login_ip?: string;
  nickname?: string;
  phone?: string;
  pid?: number;
  remark?: string;
  rtp?: number;
  status?: number;
  team_name?: string;
  total_task_amount?: number;
  task_amount?: number;
  type?: null | number;
  updated_at?: number | string;
  user_status?: number;
  vip?: number;
  withdraw_info?: Array<Record<string, unknown>>;
  withdraw_status?: number;
  withdrawal?: number;
  withdrawal_today?: number;
  wl_amount?: number;
  wl_amount_today?: number;
  ws_abnormal?: number;
  ws_status?: number;
  ws_sub_abnormal?: number;
}

export interface SiteMemberListResult {
  list: SiteMemberRow[];
  total: number;
}

function normalizeList(raw: unknown): SiteMemberListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as SiteMemberRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/user/list */
export async function fetchSiteMemberListApi(
  params: Recordable<unknown>,
): Promise<SiteMemberListResult> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/user/list',
    params,
  );
  return normalizeList(data);
}

/** POST /site/v1/user/add */
export async function addSiteMemberApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/user/add', body);
}

/** POST /site/v1/user/del */
export async function deleteSiteMemberApi(body: {
  id?: number;
  ids?: number[];
}) {
  return siteRequestClient.post<unknown>('/site/v1/user/del', body);
}

/** POST /site/v1/user/user/pwd/reset */
export async function resetSiteMemberPwdApi(body: { uid: number | string }) {
  return siteRequestClient.post<unknown>('/site/v1/user/user/pwd/reset', body);
}

/** POST /site/v1/user/status */
export async function updateSiteMemberStatusApi(body: {
  id: number;
  remark?: string;
  status: number;
}) {
  return siteRequestClient.post<unknown>('/site/v1/user/status', body);
}

/** POST /site/v1/user/withdrawal/status */
export async function updateSiteMemberWithdrawalStatusApi(body: {
  id: number;
  remark?: string;
  withdraw_status: number;
}) {
  return siteRequestClient.post<unknown>(
    '/site/v1/user/withdrawal/status',
    body,
  );
}

/** POST /site/v1/user/remark */
export async function updateSiteMemberRemarkApi(body: {
  id: number;
  remark: string;
}) {
  return siteRequestClient.post<unknown>('/site/v1/user/remark', body);
}

/** POST /site/v1/user/adjust */
export async function adjustSiteMemberBalanceApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/user/adjust', body);
}

/** POST /site/v1/user/adjust/task */
export async function adjustSiteMemberTaskApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/user/adjust/task', body);
}

/** POST /site/v1/user/superior */
export async function setSiteMemberSuperiorApi(body: {
  pid: number;
  uid: number;
}) {
  return siteRequestClient.post<unknown>('/site/v1/user/superior', body);
}

/** POST /site/v1/user/withdrawal/info */
export async function updateSiteMemberWithdrawalInfoApi(
  body: Recordable<unknown>,
) {
  return siteRequestClient.post<unknown>('/site/v1/user/withdrawal/info', body);
}

/** POST /site/v1/risk/user/ws/abnormal/add */
export async function addSiteMemberWsAbnormalApi(body: { id: number }) {
  return siteRequestClient.post<unknown>(
    '/site/v1/risk/user/ws/abnormal/add',
    body,
  );
}

/** GET /site/v1/activity/list — 邀请来源 code → 标题 */
export async function fetchActivityListForMemberMapApi(): Promise<
  Record<string, string>
> {
  const data = await siteRequestClient.get<unknown>('/site/v1/activity/list');
  const map: Record<string, string> = {
    deposit: '充值页面',
    mission_summary: '任务概要页面',
  };
  if (data == null || typeof data !== 'object') {
    return map;
  }
  const list = (data as { list?: unknown }).list;
  if (!Array.isArray(list)) {
    return map;
  }
  for (const item of list) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const r = item as Record<string, unknown>;
    const code =
      typeof r.code === 'string' ? r.code : String(r.code ?? '').trim();
    if (!code) {
      continue;
    }
    const title =
      typeof r.title === 'string' ? r.title : String(r.title ?? code);
    map[code] = title;
  }
  return map;
}

/** POST /site/v1/msg/list — 站内信（按用户筛） */
export async function fetchSiteMsgListApi(
  params: Recordable<unknown>,
): Promise<{ list: Record<string, unknown>[]; total: number }> {
  const data = await siteRequestClient.post<unknown>(
    '/site/v1/msg/list',
    params,
  );
  if (data == null || typeof data !== 'object') {
    return { list: [], total: 0 };
  }
  const d = data as Record<string, unknown>;
  const list = (d.list ?? d.items ?? []) as Record<string, unknown>[];
  const total = Number(d.total ?? d.count ?? 0);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/msg/del */
export async function deleteSiteMsgApi(body: { id: number }) {
  return siteRequestClient.post<unknown>('/site/v1/msg/del', body);
}
