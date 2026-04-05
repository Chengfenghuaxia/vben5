/**
 * 系统管理（后台用户 / 角色 / 部门 / IP）按钮权限 id — 对齐 site_ui `views/manage/*`
 */
export const SITE_MANAGE_USER_PERM = {
  ADD: 65,
  EDIT: 61,
  RESET_AUTH: 175,
  RESET_PWD: 62,
  DEL: 64,
} as const;

export const SITE_MANAGE_ROLE_PERM = {
  ADD: 11,
  AUTH: 9,
  EDIT: 6,
  DEL: 8,
} as const;

export const SITE_MANAGE_DEP_PERM = {
  ADD: 86,
  EDIT: 83,
  DEL: 85,
} as const;

export const SITE_MANAGE_IP_PERM = {
  ADD: 76,
  DEL: 75,
} as const;
