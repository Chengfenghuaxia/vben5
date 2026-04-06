/** 用户管理 / 会员列表 `user_userlist` — 与 site_ui `user/userlist/index.vue` v-permission 一致 */
export const SITE_USER_MEMBER_PERM = {
  /** 消息 */
  MSG: 21,
  /** 重置密码 */
  RESET_PWD: 37,
  /** 调整上级 */
  SUPERIOR: 38,
  /** 删除（测试用户） */
  DEL: 40,
  /** 余额调整 */
  BALANCE: 41,
  /** 新增会员 */
  ADD: 42,
  /** 用户状态 Switch、修改备注、修改提现信息、禁用时备注等（site 共用 307） */
  STATUS_AND_REMARK: 307,
  /** 提现状态 Switch */
  WITHDRAW_STATUS: 303,
  /** 打码量调整 */
  DAMA: 309,
} as const;
