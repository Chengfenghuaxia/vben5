/**
 * 推广总代页按钮权限 id（与 site_ui `acting/team/index.vue` 一致）。
 */
export const SITE_TEAM_PERM = {
  /** 新增（菜单级 usePermission(13)） */
  ADD: 13,
  /** 编辑 */
  EDIT: 43,
  /** 删除 */
  DEL: 45,
} as const;
