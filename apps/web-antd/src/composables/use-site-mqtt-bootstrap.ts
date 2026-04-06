import { watch } from 'vue';

import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { closeSiteMqtt } from '#/utils/site-mqtt';
import { refreshSiteMqtt } from '#/utils/site-mqtt-refresh';

export function useSiteMqttBootstrap() {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  function initialize() {
    watch(
      () => [accessStore.accessToken, preferences.app.locale] as const,
      () => {
        refreshSiteMqtt();
      },
      { immediate: true },
    );

    watch(
      () => userStore.userInfo?.userId,
      (id) => {
        if (!id) {
          closeSiteMqtt();
        }
      },
    );
  }

  return { initialize };
}
