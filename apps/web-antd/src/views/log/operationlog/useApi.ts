import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

/** 与常见 site 后台操作日志字段对齐，未出现的字段表格留空 */
export interface OperationLogRow {
  id: number;
  /** 操作人账号或昵称 */
  admin_name?: string;
  /** 模块 / 菜单 */
  module?: string;
  /** 请求方式 */
  method?: string;
  /** 接口或路由 */
  request_uri?: string;
  /** 操作类型：新增/编辑/删除/登录 等 */
  action?: string;
  ip?: string;
  /** 请求参数或变更摘要 */
  content?: string;
  created_at?: number | string;
}

export interface OperationLogListResult {
  list: OperationLogRow[];
  total: number;
}

function normalizeOperationLogList(raw: unknown): OperationLogListResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? d.records ?? []) as OperationLogRow[];
  const total = Number(d.total ?? d.count ?? list.length);
  return {
    list: Array.isArray(list) ? list : [],
    total: Number.isFinite(total) ? total : 0,
  };
}

/** POST /site/v1/oplog/list */
export async function fetchOperationLogListApi(
  params: Recordable<unknown>,
): Promise<OperationLogListResult> {
  const data = await siteRequestClient.post<unknown>('/site/v1/oplog/list', params);
  return normalizeOperationLogList(data);
}
