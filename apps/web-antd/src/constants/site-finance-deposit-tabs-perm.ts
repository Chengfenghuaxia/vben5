/**
 * 充值选项 — 与 site_ui `views/finance/deposittabs/index.vue` 中权限 id 一致。
 */
export const SITE_FINANCE_DEPOSIT_TABS_PERM = {
  /** 新增选项 / 添加模板等（site `usePermission(176)`） */
  ADD: 176,
  /** 列表 */
  LIST: 177,
  /** 删除选项 */
  DEL: 244,
  /** 编辑选项 */
  EDIT: 245,
  /** 列表热门/状态开关：`POST /site/v1/deposit/tabs/update`（prem `apis` 需包含 179） */
  UPDATE: 179,
} as const;
