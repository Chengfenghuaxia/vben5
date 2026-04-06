import { useAccessStore } from '@vben/stores';

import type { SiteAdminInfoRaw } from '#/api/core/site-auth';
import { handleSiteNotificationMessage } from '#/composables/use-site-notification-handler';
import { playSiteMqttTipSound } from '#/composables/use-site-audio-tip';
import {
  closeSiteMqtt,
  isSiteMqttNotifyEnabled,
  subscribeSiteMqtt,
} from '#/utils/site-mqtt';
import {
  getSiteMqttAdminInfo,
  setSiteMqttAdminInfo,
} from '#/utils/site-mqtt-context';

/**
 * 登录后写入 admin info 并调用本函数；`app.vue` 里 token 变化也会触发。
 */
export function refreshSiteMqtt() {
  const accessStore = useAccessStore();
  if (!accessStore.accessToken) {
    closeSiteMqtt(true);
    return;
  }
  const raw = getSiteMqttAdminInfo();
  if (!raw) {
    return;
  }
  if (!isSiteMqttNotifyEnabled(raw)) {
    closeSiteMqtt(false);
    return;
  }
  subscribeSiteMqtt(raw, ({ data }) => {
    playSiteMqttTipSound();
    handleSiteNotificationMessage(data);
  });
}

/** 供 auth 在拿到 `/admin/info` 后调用 */
export function setSiteAdminInfoForMqtt(raw: null | SiteAdminInfoRaw) {
  if (!raw) {
    return;
  }
  setSiteMqttAdminInfo(raw);
  refreshSiteMqtt();
}
