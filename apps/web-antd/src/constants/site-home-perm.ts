/**
 * 首页接口权限（与 site_ui `views/home/index.vue` 中 apis.includes 一致）。
 */
export const SITE_HOME_PERM = {
  /** 财务横幅 /site/v1/home/fin */
  FIN: 181,
  /** 运营数据与图表 /site/v1/home/operation */
  OPERATION: 182,
} as const;
