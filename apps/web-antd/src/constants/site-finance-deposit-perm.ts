/**
 * 充值订单页按钮权限（与 site_ui `finance/deposit/index.vue` 一致，随后端 prem / apis 调整）。
 */
export const SITE_FINANCE_DEPOSIT_PERM = {
  /** 列表「编辑」（site_ui v-permission id: 43） */
  EDIT: 43,
  /** 「设置成功」（site_ui id: 298） */
  SET_SUCCESS: 298,
  /**
   * 「创建订单」—— site_ui 使用 `$buttonPermissions(route.path, '/site/v1/deposit/add')`；
   * 若 prem 使用数字 id，在此填写并在菜单 `apis` 中下发。
   */
  CREATE_ORDER: 999001,
  /**
   * 「导出」任务 — prem 中 `/site/v1/export/financial/deposit/export` 对应 id，未对上前本地 dev 仍会放行。
   */
  EXPORT: 999002,
} as const;
