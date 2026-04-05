import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  fetchSiteAdminInfoApi,
  getAccessCodesApi,
  getUserInfoApi,
  loginApi,
  logoutApi,
  mapSiteAdminToUserInfo,
  siteAdminAuthBindApi,
} from '#/api';
import { $t } from '#/locales';

export interface GoogleBindPayload {
  qrcode: string;
  secret?: string;
}

export interface AuthLoginResult {
  googleBind?: GoogleBindPayload;
  needGoogleBind?: boolean;
  userInfo: null | UserInfo;
}

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ): Promise<AuthLoginResult> {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await loginApi(params);

      if (!accessToken) {
        return { userInfo: null };
      }

      accessStore.setAccessToken(accessToken);

      const rawInfo = await fetchSiteAdminInfoApi();
      if (rawInfo?.auth_qrcode) {
        return {
          googleBind: {
            qrcode: String(rawInfo.auth_qrcode),
            secret:
              typeof rawInfo.auth_secret === 'string'
                ? rawInfo.auth_secret
                : undefined,
          },
          needGoogleBind: true,
          userInfo: null,
        };
      }

      userInfo = mapSiteAdminToUserInfo(rawInfo);
      userStore.setUserInfo(userInfo);

      const accessCodes = await getAccessCodesApi();
      accessStore.setAccessCodes(accessCodes);

      if (accessStore.loginExpired) {
        accessStore.setLoginExpired(false);
      } else {
        onSuccess
          ? await onSuccess?.()
          : await router.push(
              userInfo.homePath || preferences.app.defaultHomePath,
            );
      }

      if (userInfo?.realName) {
        notification.success({
          description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
          duration: 3,
          message: $t('authentication.loginSuccess'),
        });
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  /**
   * 谷歌验证绑定（成功后清空登录态，需重新登录）
   */
  async function bindGoogleAuth(authCode: string) {
    await siteAdminAuthBindApi({ auth_code: authCode });
    notification.success({
      message: '绑定成功，请重新登录',
    });
    await logout(false);
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 后端未实现 logout 时可忽略
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    bindGoogleAuth,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
