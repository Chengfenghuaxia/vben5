import type { ConfigEnv } from 'vite';

import { cwd } from 'node:process';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

export default defineConfig(async (config: ConfigEnv) => {
  const env = loadEnv(config.mode, cwd(), '');
  const siteProxyTarget = (env.VITE_PROXY_SITE_TARGET || '').trim();

  const proxy: Record<string, Record<string, unknown>> = {
    '/api': {
      changeOrigin: true,
      // 本地 Mock：/api/** → Nitro（路由为 /api/site/v1/...）
      target: 'http://localhost:5320',
      ws: true,
    },
  };

  // 开发环境：浏览器请求 /site/** 时转发到真实后端（与 /api  mock 前缀分离）
  if (siteProxyTarget) {
    proxy['/site'] = {
      changeOrigin: true,
      secure: siteProxyTarget.startsWith('https'),
      target: siteProxyTarget,
    };
  }

  return {
    application: {},
    vite: {
      server: {
        proxy,
      },
    },
  };
});
