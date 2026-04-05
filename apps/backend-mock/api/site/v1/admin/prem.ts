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
        component: '/home/index',
        icon: 'lucide:layout-template',
        name: '首页',
        path: '/home',
        sort: -2,
        url: 'SiteHome',
      },
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
      {
        children: [
          {
            component: '/acting/team/index',
            icon: 'lucide:users-round',
            name: '推广总代',
            path: '/acting/team',
            sort: 0,
            url: 'ActingTeam',
          },
          {
            component: '/acting/agent/index',
            icon: 'lucide:user-cog',
            name: '推广代理',
            path: '/acting/agent',
            sort: 1,
            url: 'ActingAgent',
          },
        ],
        icon: 'lucide:megaphone',
        name: '推广',
        path: '/acting',
        sort: 1,
        url: 'Acting',
      },
      {
        children: [
          {
            component: '/finance/deposit/index',
            icon: 'lucide:wallet',
            name: '充值订单',
            path: '/finance/deposit',
            sort: 0,
            url: 'FinanceDeposit',
          },
        ],
        icon: 'lucide:banknote',
        name: '财务管理',
        path: '/finance',
        sort: 2,
        url: 'Finance',
      },
    ],
  });
});
