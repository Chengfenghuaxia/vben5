/**
 * MQTT 实时推送 — 对齐 site_ui `utils/mqtt.ts`（WebSocket + base64 JSON 载荷）
 */
import type { MqttClient } from 'mqtt';
import mqtt from 'mqtt';

import type { SiteAdminInfoRaw } from '#/api/core/site-auth';

import { clearSiteMqttAdminInfo } from '#/utils/site-mqtt-context';

function resolveMqttUrl(): string {
  const fromEnv = String(import.meta.env.VITE_GLOB_MQTT_URL ?? '').trim();
  if (fromEnv) {
    return fromEnv;
  }
  return 'wss://m.halln.cc';
}

function resolveMqttAuth(): { password: string; username: string } {
  return {
    password: String(
      import.meta.env.VITE_GLOB_MQTT_PASSWORD ?? 'Player@123456',
    ),
    username: String(import.meta.env.VITE_GLOB_MQTT_USERNAME ?? 'player'),
  };
}

export function siteCodeFromAdmin(raw: SiteAdminInfoRaw): string {
  const s = raw.site ?? raw.site_code;
  return typeof s === 'string' ? s.trim() : String(s ?? '').trim();
}

let client: MqttClient | null = null;
let messageHandler: ((payload: { data: unknown }) => void) | null = null;
let listenerAttached = false;
let manualDisconnect = false;

function attachMessageListener() {
  if (!client || listenerAttached) {
    return;
  }
  client.on('message', (_topic: string, message: Buffer) => {
    if (!messageHandler) {
      return;
    }
    try {
      const encoded = message.toString();
      const decoded = JSON.parse(atob(encoded)) as unknown;
      messageHandler({ data: decoded });
    } catch (e) {
      console.error('[site-mqtt] 解析消息失败', e);
    }
  });
  listenerAttached = true;
}

function subscribeTopicForAdmin(raw: SiteAdminInfoRaw) {
  if (!client?.connected) {
    return;
  }
  const site = siteCodeFromAdmin(raw);
  if (!site) {
    console.warn('[site-mqtt] admin/info 无 site，跳过订阅');
    return;
  }
  const topic = `broadcast/fin/${site}`;
  client.subscribe(topic, { qos: 0 }, (err) => {
    if (err) {
      console.error('[site-mqtt] 订阅失败', topic, err);
    } else {
      console.info('[site-mqtt] 已订阅', topic);
    }
  });
}

/**
 * 建立连接（使用当前 `getSiteMqttAdminInfo()` 生成 clientId；连接成功后按 site 订阅）
 */
export function connectSiteMqtt(admin: SiteAdminInfoRaw) {
  const mqttUrl = resolveMqttUrl();
  manualDisconnect = false;

  if (client?.connected) {
    subscribeTopicForAdmin(admin);
    return;
  }

  if (client) {
    try {
      client.end(true);
    } catch {
      /* ignore */
    }
    client = null;
    listenerAttached = false;
  }

  const id = admin.id ?? admin.user_id ?? admin.uid ?? siteCodeFromAdmin(admin);
  const { password, username } = resolveMqttAuth();

  const options = {
    clean: true,
    clientId: `client_${id || 'unknown'}_${Date.now()}`,
    connectTimeout: 10 * 1000,
    keepalive: 60,
    password,
    reconnectPeriod: 5000,
    username,
  };

  console.info('[site-mqtt] 连接', mqttUrl);
  client = mqtt.connect(mqttUrl, options);
  attachMessageListener();

  client.on('connect', () => {
    console.info('[site-mqtt] 已连接');
    subscribeTopicForAdmin(admin);
  });

  client.on('error', (err: Error) => {
    console.error('[site-mqtt] error', err);
  });

  client.on('close', () => {
    if (manualDisconnect) {
      console.info('[site-mqtt] 已断开');
    }
  });
}

/**
 * 注册业务回调并在已连接时确保已订阅
 */
export function subscribeSiteMqtt(
  admin: SiteAdminInfoRaw,
  onMessage: (payload: { data: unknown }) => void,
) {
  messageHandler = onMessage;
  if (!client) {
    connectSiteMqtt(admin);
    return;
  }
  attachMessageListener();
  if (client.connected) {
    subscribeTopicForAdmin(admin);
  }
}

/**
 * 关闭 MQTT。`clearContext === true` 时清空 admin/info 缓存（登出）；仅关闭通知时传 `false` 保留缓存。
 */
export function closeSiteMqtt(clearContext = true) {
  manualDisconnect = true;
  messageHandler = null;
  listenerAttached = false;
  if (client) {
    try {
      if (client.connected) {
        client.end(true);
      }
    } catch {
      /* ignore */
    }
    client = null;
  }
  if (clearContext) {
    clearSiteMqttAdminInfo();
  }
}

/** 与 site_ui `useMqttNotification` 一致：仅 `notify === 1` 时连接 MQTT */
export function isSiteMqttNotifyEnabled(raw: SiteAdminInfoRaw): boolean {
  const n = raw.notify;
  if (n === undefined || n === null) {
    return false;
  }
  return Number(n) === 1;
}

