import { baseRequestClient } from '#/api/request';

import { siteAdminLoginApi, siteAdminPremApi } from './site-auth';

export namespace AuthApi {
  /** 登录接口参数（对接 site 后台） */
  export interface LoginParams {
    /** 谷歌验证码 */
    auth_code?: string;
    password?: string;
    /** 站点 code（客服/站点登录时使用） */
    site?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录（site：POST /site/v1/admin/login，token 字段映射为 accessToken）
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const res = await siteAdminLoginApi({
    auth_code: data.auth_code,
    pwd: data.password ?? '',
    site: data.site,
    username: data.username ?? '',
  });
  if (!res?.token) {
    throw new Error('Login response missing token');
  }
  return { accessToken: res.token };
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码（site：GET /site/v1/admin/prem，menus 转为字符串列表）
 */
export async function getAccessCodesApi() {
  try {
    const data = await siteAdminPremApi();
    const menus = data?.menus;
    if (Array.isArray(menus)) {
      return menus.map((item) =>
        typeof item === 'string' ? item : JSON.stringify(item),
      );
    }
    return [];
  } catch {
    return [];
  }
}
