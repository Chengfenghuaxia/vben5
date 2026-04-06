/**
 * 对接现有后端的 `/site/v1` 管理端接口（登录、info、prem 等）
 */
import {
  parsePremResponseBody,
  type PremMenuNode,
} from '#/router/prem-menu-to-routes';

import { siteRequestClient } from '#/api/request';

/** 登录接口 POST /site/v1/admin/login 的请求体 */
export interface SiteAdminLoginBody {
  auth_code?: string;
  pwd: string;
  site?: string;
  username: string;
}

/** GET /site/v1/admin/info 原始返回（字段随后端可能扩展） */
export interface SiteAdminInfoRaw {
  auth_qrcode?: string;
  auth_secret?: string;
  avatar?: string;
  id?: number | string;
  /** IANA 时区，与 site_ui userinfo.load_location 一致，用于全站时间展示 */
  load_location?: string;
  /** 是否接收 MQTT：仅 `1` 开启（与 site_ui `userinfo.notify === 1` 一致） */
  notify?: number | string;
  real_name?: string;
  role?: string;
  roles?: string[];
  /** 站点编码，MQTT 订阅 `broadcast/fin/${site}` */
  site?: string;
  site_code?: string;
  username?: string;
  uid?: number | string;
  user_id?: number | string;
  [key: string]: unknown;
}

export async function siteAdminLoginApi(body: SiteAdminLoginBody) {
  return siteRequestClient.post<{ role?: string; token: string; username?: string }>(
    '/site/v1/admin/login',
    {
      auth_code: body.auth_code ?? '',
      pwd: body.pwd,
      site: body.site ?? '',
      username: body.username,
    },
  );
}

export async function fetchSiteAdminInfoApi() {
  return siteRequestClient.get<SiteAdminInfoRaw>('/site/v1/admin/info');
}

/** 权限与菜单树（原始 body 在此解析，适配后端多种 JSON 形状） */
export async function siteAdminPremApi(): Promise<{ menus: PremMenuNode[] }> {
  const body = await siteRequestClient.get<unknown>('/site/v1/admin/prem', {
    responseReturn: 'body',
  });
  return parsePremResponseBody(body);
}

export async function siteAdminAuthBindApi(data: { auth_code: string }) {
  return siteRequestClient.post<unknown>('/site/v1/admin/auth/bind', data);
}
