import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    /** 菜单路由由 site prem 接口下发 */
    accessMode: 'backend',
    /** 须为 prem 动态路由中存在的 path；避免指向未下发的静态页导致落到全屏 404、无侧栏 */
    defaultHomePath: '/home',
    name: import.meta.env.VITE_APP_TITLE,
  },
});
