/**
 * 数据埋点页按钮权限 id（与 site_ui `website/dataTracking` 内 v-permission / usePermission 一致，随后端 prem 调整）。
 */
export const SITE_DATA_TRACKING_PERM = {
  /** 新增（site_ui usePermission(1000499)） */
  ADD: 1000499,
  /** 删除 */
  DELETE: 1000500,
  /** 编辑 */
  EDIT: 1000502,
  /** 充值详情导出 */
  EXPORT_DEPOSIT: 1000504,
  /** 登录详情导出 */
  EXPORT_LOGIN: 1000505,
  /** 注册详情导出 */
  EXPORT_REGISTER: 1000506,
  /** 表单内清空统计数据 */
  CLEAR: 1000636,
} as const;
