import type { Recordable } from '@vben/types';

import { siteRequestClient } from '#/api/request';

export interface GameListRow {
  collections?: number;
  game_code?: string;
  game_name?: string;
  icon?: string;
  id: number;
  is_hot?: number;
  operator?: string;
  rect_icon?: string;
  sort?: number;
  status?: number;
  updated_at?: number | string;
  venue_code?: string;
  venue_id?: number | string;
}

export interface GameListQueryResult {
  iconShape?: number;
  list: GameListRow[];
  total: number;
}

function normalizeGameListPayload(raw: unknown): GameListQueryResult {
  if (raw == null || typeof raw !== 'object') {
    return { list: [], total: 0 };
  }
  const d = raw as Record<string, unknown>;
  const list = (d.list ?? d.items ?? d.records ?? []) as GameListRow[];
  const total = Number(d.total ?? d.count ?? 0);
  const iconShape = d.icon_shape;
  return {
    iconShape:
      iconShape === null || iconShape === undefined
        ? undefined
        : Number(iconShape),
    list,
    total: Number.isFinite(total) ? total : 0,
  };
}

async function postGameList(
  url: string,
  body: Recordable<unknown>,
): Promise<GameListQueryResult> {
  const res = await siteRequestClient.post<unknown>(url, body);
  return normalizeGameListPayload(res);
}

/** POST /site/v1/game/list */
export function fetchGameListApi(body: Recordable<unknown>) {
  return postGameList('/site/v1/game/list', body);
}

/** POST /site/v1/game/hot/list */
export function fetchGameHotListApi(body: Recordable<unknown>) {
  return postGameList('/site/v1/game/hot/list', body);
}

/** POST /site/v1/game/fav/list */
export function fetchGameFavListApi(body: Recordable<unknown>) {
  return postGameList('/site/v1/game/fav/list', body);
}

/** POST /site/v1/venue/all/list */
export async function fetchVenueAllListApi(
  body: Recordable<unknown> = {},
): Promise<{ list: { code: string; name: string }[] }> {
  const res = await siteRequestClient.post<unknown>(
    '/site/v1/venue/all/list',
    body,
  );
  if (res == null || typeof res !== 'object') {
    return { list: [] };
  }
  const d = res as Record<string, unknown>;
  const list = (d.list ?? []) as { code: string; name: string }[];
  return { list: Array.isArray(list) ? list : [] };
}

/** POST /site/v1/game/update/status */
export function updateGameStatusApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/game/update/status', body);
}

/** POST /site/v1/game/update/hot */
export function updateGameHotApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/game/update/hot', body);
}

/** POST /site/v1/game/disable/batch */
export function gameDisableBatchApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/game/disable/batch', body);
}

/** POST /site/v1/game/update/sort */
export function updateGameSortApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/game/update/sort', body);
}

/** POST /site/v1/game/update/hot/sort */
export function updateGameHotSortApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/game/update/hot/sort', body);
}

/** POST /site/v1/game/sort/batch */
export function gameSortBatchApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/game/sort/batch', body);
}

/** POST /site/v1/game/hot/sort/batch */
export function gameHotSortBatchApi(body: Recordable<unknown>) {
  return siteRequestClient.post<unknown>('/site/v1/game/hot/sort/batch', body);
}
