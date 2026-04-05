import type { RouteRecordStringComponent } from '@vben/types';

import {
  getFallbackDashboardRoutes,
  transformPremMenusToRoutes,
} from '#/router/prem-menu-to-routes';

import { siteAdminPremApi } from './site-auth';

/**
 * 后端权限菜单 → Vben `accessMode: backend` 所需的路由表
 */
export async function getAllMenusApi(): Promise<RouteRecordStringComponent[]> {
  const { menus } = await siteAdminPremApi();
  const routes = transformPremMenusToRoutes(menus);
  if (routes.length === 0) {
    return getFallbackDashboardRoutes();
  }
  return routes;
}
