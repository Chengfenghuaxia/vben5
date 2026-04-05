/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

/**
 * site 接口 baseURL：
 * - 显式 VITE_GLOB_SITE_API_URL（开发可填 https://s1... 直连）
 * - 生产未配置时：同源相对路径 ''（与当前访问域名一致，如 https://你的域名/site/v1/...）
 * - 开发：若配置了 VITE_PROXY_SITE_TARGET，用 '' 走 Vite /site 代理
 * - 否则与主接口一致（本地 Mock 时为 /api → /api/site/v1/...）
 */
function resolveSiteApiBase(): string {
  const explicit = String(import.meta.env.VITE_GLOB_SITE_API_URL ?? '').trim();
  if (explicit) {
    return explicit;
  }
  if (import.meta.env.PROD) {
    return '';
  }
  const proxyTarget = String(import.meta.env.VITE_PROXY_SITE_TARGET ?? '').trim();
  if (proxyTarget) {
    return '';
  }
  return apiURL;
}

function createRequestClient(
  baseURL: string,
  options?: RequestClientOptions,
  authenticateExtras?: { ignore401ForRequest?: (config: any) => boolean },
) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  /** site 后台通常要求 Header 直接带 token，不加 Bearer 前缀 */
  function formatToken(token: null | string) {
    if (!token) {
      return null;
    }
    const raw =
      String(import.meta.env.VITE_GLOB_API_AUTH_RAW_HEADER || '') === 'true';
    return raw ? token : `Bearer ${token}`;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: (code) =>
        code === 0 ||
        code === '0' ||
        code === '0000' ||
        Number(code) === 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
      ...authenticateExtras,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage =
        responseData?.error ??
        responseData?.message ??
        responseData?.msg ??
        '';
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const siteRequestClient = createRequestClient(
  resolveSiteApiBase(),
  { responseReturn: 'data' },
  {
    ignore401ForRequest: (config) =>
      String(config?.url ?? '').includes('/site/v1/admin/login'),
  },
);

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
