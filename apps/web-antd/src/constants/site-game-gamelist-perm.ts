/**
 * 游戏列表页按钮权限 id（对齐 site_ui `views/game/gamelist/index.vue`）
 */
export const SITE_GAME_GAMELIST_PERM = {
  /** 批量上/下架 — id 1000559 */
  BATCH_SHELF: 1000559,
  /** 批量排序 — id 1000631 */
  BATCH_SORT: 1000631,
  /** 单条排序 — id 364 */
  ROW_SORT: 364,
  /** 游戏状态开关 — id 183 */
  STATUS: 183,
  /** 热门开关 — id 220 */
  HOT: 220,
  /** 侧栏显示「收藏」分组 — id 1000662 */
  FAV_MENU: 1000662,
} as const;
