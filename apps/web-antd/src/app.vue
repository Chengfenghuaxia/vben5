<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';

import { useAntdDesignTokens } from '@vben/hooks';
import { preferences, usePreferences } from '@vben/preferences';

import { App, ConfigProvider, theme } from 'ant-design-vue';

import { useSiteAudioTip } from '#/composables/use-site-audio-tip';
import { useSiteMqttBootstrap } from '#/composables/use-site-mqtt-bootstrap';
import { antdLocale } from '#/locales';

defineOptions({ name: 'App' });

const { isDark } = usePreferences();
const { tokens } = useAntdDesignTokens();

const tipsRef = useTemplateRef<HTMLAudioElement>('tipsRef');
useSiteAudioTip(tipsRef);
const { initialize } = useSiteMqttBootstrap();
initialize();

const tokenTheme = computed(() => {
  const algorithm = isDark.value
    ? [theme.darkAlgorithm]
    : [theme.defaultAlgorithm];

  // antd 紧凑模式算法
  if (preferences.app.compact) {
    algorithm.push(theme.compactAlgorithm);
  }

  return {
    algorithm,
    token: tokens,
  };
});

</script>

<template>
  <ConfigProvider :locale="antdLocale" :theme="tokenTheme">
    <App>
      <RouterView />
      <audio
        ref="tipsRef"
        loop
        preload="auto"
        src="/msg.mp3"
        style="display: none"
      />
    </App>
  </ConfigProvider>
</template>
