import { eventHandler } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler((event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  /** 与 site_ui prem.menus 结构一致，便于本地联调动态侧栏 */
  return useResponseSuccess({
    menus: [
      {
        children: [
          {
            component: '/dashboard/analytics/index',
            icon: 'lucide:area-chart',
            name: '分析页',
            path: '/analytics',
            sort: 0,
            url: 'Analytics',
          },
          {
            component: '/dashboard/workspace/index',
            icon: 'carbon:workspace',
            name: '工作台',
            path: '/workspace',
            sort: 1,
            url: 'Workspace',
          },
        ],
        icon: 'lucide:layout-dashboard',
        name: '仪表盘',
        path: '/dashboard',
        sort: -1,
        url: 'Dashboard',
      },
    ],
  });
});
