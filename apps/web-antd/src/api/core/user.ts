import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';

import { setSiteAdminInfoForMqtt } from '#/utils/site-mqtt-refresh';

import { fetchSiteAdminInfoApi, type SiteAdminInfoRaw } from './site-auth';

function mapSiteAdminToUserInfo(raw: SiteAdminInfoRaw): UserInfo {
  const username =
    (typeof raw.username === 'string' && raw.username) || 'user';
  const role = raw.role;
  const roles = Array.isArray(raw.roles)
    ? raw.roles.filter((r): r is string => typeof r === 'string')
    : role
      ? [String(role)]
      : [];

  const realName =
    (typeof raw.real_name === 'string' && raw.real_name) ||
    (typeof raw.nickname === 'string' && raw.nickname) ||
    username;

  const id = raw.id ?? raw.user_id ?? raw.uid;
  const userId = id !== undefined && id !== null ? String(id) : username;

  const loadLocation =
    typeof raw.load_location === 'string' && raw.load_location.trim()
      ? raw.load_location.trim()
      : undefined;

  return {
    avatar: typeof raw.avatar === 'string' ? raw.avatar : '',
    desc: typeof raw.desc === 'string' ? raw.desc : '',
    homePath: preferences.app.defaultHomePath,
    loadLocation,
    realName,
    roles,
    token: '',
    userId,
    username,
  };
}

/**
 * 获取用户信息（site：GET /site/v1/admin/info）
 */
export async function getUserInfoApi() {
  const raw = await fetchSiteAdminInfoApi();
  setSiteAdminInfoForMqtt(raw);
  return mapSiteAdminToUserInfo(raw);
}

export { mapSiteAdminToUserInfo };
