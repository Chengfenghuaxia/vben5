/**
 * 渠道列表 — 与 site_ui `views/finance/channel/index.vue` 中 v-permission / apis 判断一致。
 */
export const SITE_FINANCE_CHANNEL_PERM = {
  /** 通道配置 */
  CONFIG: 206,
  /** 代收权重 */
  PAY_IN_WEIGHT: 1000648,
  /** 代付权重 */
  PAY_OUT_WEIGHT: 1000650,
  /**
   * 代收通道开关可用（site 用 apis.includes(1000647) 控制 CustomSwitch disabled）
   */
  PAY_IN_STATUS: 1000647,
  /**
   * 代付通道开关可用（site 用 apis.includes(1000649)）
   */
  PAY_OUT_STATUS: 1000649,
} as const;
