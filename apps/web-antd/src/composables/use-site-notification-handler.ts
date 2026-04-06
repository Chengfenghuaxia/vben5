import { h } from 'vue';

import { notification } from 'ant-design-vue';

import { pauseSiteTipAudio } from '#/composables/use-site-audio-tip';

/** 与 site_ui `useNotificationHandler` 共用计数（7 / 27 两类提现相关通知） */
let withdrawalMessageCount = 0;

/**
 * 财务类 MQTT 通知（对齐 site_ui useNotificationHandler）
 */
export function handleSiteNotificationMessage(data: unknown) {
  if (!data || typeof data !== 'object') {
    return;
  }
  const d = data as Record<string, unknown>;
  if (Number(d.type) !== 4) {
    return;
  }
  const subType = Number(d.sub_type);
  const content = String(d.content ?? '');

  if (subType === 7) {
    withdrawalMessageCount += 1;
    notification.info({
      description: h('div', {
        innerHTML: `<p>您有新的提现申请，请及时处理</p><p>${content}</p>`,
      }),
      duration: 30,
      key: 'withdrawNotification',
      message: `提现申请${withdrawalMessageCount}`,
      onClose: () => {
        pauseSiteTipAudio();
        withdrawalMessageCount = 0;
      },
      placement: 'bottomRight',
    });
    return;
  }
  if (subType === 27) {
    withdrawalMessageCount += 1;
    notification.error({
      description: h('div', {
        innerHTML: `<p>代付失败，请及时处理</p><p>${content}</p>`,
      }),
      duration: 30,
      key: 'PayonBehalf',
      message: `代付失败${withdrawalMessageCount}`,
      onClose: () => {
        pauseSiteTipAudio();
        withdrawalMessageCount = 0;
      },
      placement: 'bottomRight',
    });
    return;
  }
  if (subType === 29) {
    notification.error({
      description: h('div', {
        innerHTML: `<p>短信条数不足，请及时处理</p><p>${content}</p>`,
      }),
      duration: 30,
      key: 'sms',
      message: '短信条数不足',
      onClose: () => {
        pauseSiteTipAudio();
      },
      placement: 'bottomRight',
    });
  }
}
