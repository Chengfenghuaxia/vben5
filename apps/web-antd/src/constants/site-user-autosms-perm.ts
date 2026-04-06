/** 自动短信 `user_autosms` — 与 site_ui `user/autosms/index.vue` / `dataTabs.vue` 一致 */
export const SITE_USER_AUTOSMS_PERM = {
  /** 顶部日期 Tab + 汇总统计区域 `v-permission` on DataTabs */
  SUMMARY_BLOCK: 1_000_404,
  /** 表格行「操作」按钮 */
  OPERATE: 1_000_406,
  /** 有该 id 时发送状态 Switch 才可操作（site: `apis.some(1000407)`） */
  STATUS_SWITCH: 1_000_407,
  /** 刷新剩余可用条数 */
  BALANCE_REFRESH: 1_000_410,
} as const;
