import { siteRequestClient } from '#/api/request';

/** GET /site/v1/home/fin */
export interface SiteHomeFinData {
  balance: number;
  withdrawal_audit: number;
  withdrawal_processed: number;
  withdrawal_total: number;
  withdrawal_unprocessed: number;
}

export async function fetchSiteHomeFinApi(): Promise<SiteHomeFinData> {
  const data = await siteRequestClient.get<SiteHomeFinData>('/site/v1/home/fin');
  return data ?? ({} as SiteHomeFinData);
}

export interface SiteHomeHourRow {
  deposit: number;
  difference: number;
  hour: number;
  last_deposit: number;
  last_difference: number;
  last_wl_amount: number;
  last_withdrawal: number;
  wl_amount: number;
  withdrawal: number;
}

export interface SiteHomeHistoryRow {
  apk_download: number;
  apk_register: number;
  date: string;
  fission: number;
  ip: number;
  online: number;
  register: number;
}

/** POST /site/v1/home/operation */
export interface SiteHomeOperationData {
  apk_download_today?: number;
  apk_download_yesterday?: number;
  first_deposit: number;
  fission: number;
  history_list?: SiteHomeHistoryRow[];
  ip: number;
  list: SiteHomeHourRow[];
  new_deposit: number;
  one_first_deposit: number;
  one_new_deposit: number;
  online: number;
  pwa: number;
  register: number;
  version: string;
}

export async function fetchSiteHomeOperationApi(body: {
  end_date: string;
  start_date: string;
}): Promise<SiteHomeOperationData> {
  const data = await siteRequestClient.post<SiteHomeOperationData>(
    '/site/v1/home/operation',
    body,
  );
  return data ?? ({} as SiteHomeOperationData);
}

/** GET /site/v1/activity/list — 与 site_ui 首页缓存首条活动 code 一致 */
export async function fetchSiteActivityListApi(): Promise<{ code?: string }[]> {
  const raw = await siteRequestClient.get<unknown>('/site/v1/activity/list');
  if (raw == null || typeof raw !== 'object') {
    return [];
  }
  const list = (raw as { list?: unknown }).list;
  if (!Array.isArray(list)) {
    return [];
  }
  return list.map((row) => {
    if (!row || typeof row !== 'object') {
      return {};
    }
    const code = (row as { code?: unknown }).code;
    return typeof code === 'string' ? { code } : {};
  });
}
