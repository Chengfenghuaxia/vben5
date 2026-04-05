/**
 * 提现选项 — 与 site_ui `views/finance/withdrawaltabs/index.vue` 中权限 id 一致。
 */
export const SITE_FINANCE_WITHDRAWAL_TABS_PERM = {
  /** 新增（site `usePermission(215)`） */
  ADD: 215,
  /** 删除 */
  DEL: 217,
  /** 编辑 */
  EDIT: 218,
  /** 列表状态开关：`POST /site/v1/withdrawal/tabs/update`（prem `apis` 需包含 135） */
  UPDATE: 135,
} as const;
