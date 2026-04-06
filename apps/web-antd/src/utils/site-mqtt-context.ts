import type { SiteAdminInfoRaw } from '#/api/core/site-auth';

/** 登录后缓存的 admin/info，供 MQTT clientId / 订阅 topic 使用（与 site_ui session userinfo 语义对齐） */
let cachedAdminInfo: null | SiteAdminInfoRaw = null;

export function setSiteMqttAdminInfo(raw: null | SiteAdminInfoRaw) {
  cachedAdminInfo = raw;
}

export function getSiteMqttAdminInfo(): null | SiteAdminInfoRaw {
  return cachedAdminInfo;
}

export function clearSiteMqttAdminInfo() {
  cachedAdminInfo = null;
}
