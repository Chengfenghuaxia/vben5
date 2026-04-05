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
            component: '/finance/deposittabs/index',
            icon: 'lucide:list-plus',
            name: '充值选项',
            path: '/finance/deposittabs',
            sort: 0,
            url: 'FinanceDeposittabs',
          },
          {
            component: '/finance/deposit/index',
            icon: 'lucide:wallet',
            name: '充值订单',
            path: '/finance/deposit',
            sort: 1,
            url: 'FinanceDeposit',
          },
          {
            component: '/finance/withdrawaltabs/index',
            icon: 'lucide:list-minus',
            name: '提现选项',
            path: '/finance/withdrawaltabs',
            sort: 2,
            url: 'FinanceWithdrawaltabs',
          },
          {
            component: '/finance/withdraworder/index',
            icon: 'lucide:arrow-down-to-line',
            name: '提现订单',
            path: '/finance/withdraworder',
            sort: 3,
            url: 'FinanceWithdrawOrder',
          },
          {
            component: '/finance/abnormal/index',
            icon: 'lucide:triangle-alert',
            name: '异常订单',
            path: '/finance/abnormal',
            sort: 4,
            url: 'FinanceAbnormal',
          },
          {
            component: '/finance/accountblacklist/index',
            icon: 'lucide:user-x',
            name: '黑名单',
            path: '/finance/accountblacklist',
            sort: 5,
            url: 'FinanceAccountBlacklist',
          },
          {
            component: '/finance/withdrawmoney/index',
            icon: 'lucide:banknote-arrow-down',
            name: '取现管理',
            path: '/finance/withdrawmoney',
            sort: 6,
            url: 'FinanceWithdrawmoney',
          },
          {
            component: '/finance/channel/index',
            icon: 'lucide:link',
            name: '渠道列表',
            path: '/finance/channel',
            sort: 7,
            url: 'FinanceChannel',
          },
        ],
        icon: 'lucide:banknote',
        name: '财务管理',
        path: '/finance',
        sort: 2,
        url: 'Finance',
      },
      {
        children: [
          {
            component: '/game/gamelist/index',
            icon: 'lucide:gamepad-2',
            name: '游戏列表',
            path: '/game/gamelist',
            sort: 0,
            url: 'GameGamelist',
          },
        ],
        icon: 'lucide:gamepad-2',
        name: '游戏管理',
        path: '/game',
        sort: 3,
        url: 'Game',
      },
      {
        children: [
          {
            apis: [65, 61, 175, 62, 64],
            component: '/manage/userlist/index',
            icon: 'lucide:user-cog',
            name: '后台用户',
            path: '/manage/userlist',
            sort: 0,
            url: 'ManageUserlist',
          },
          {
            apis: [11, 9, 6, 8],
            component: '/manage/role/index',
            icon: 'lucide:shield',
            name: '角色管理',
            path: '/manage/role',
            sort: 1,
            url: 'ManageRole',
          },
          {
            apis: [86, 83, 85],
            component: '/manage/dep/index',
            icon: 'lucide:building-2',
            name: '部门管理',
            path: '/manage/dep',
            sort: 2,
            url: 'ManageDep',
          },
          {
            apis: [76, 75],
            component: '/manage/ip/index',
            icon: 'lucide:network',
            name: 'IP白名单',
            path: '/manage/ip',
            sort: 3,
            url: 'ManageIp',
          },
        ],
        icon: 'lucide:settings',
        name: '系统管理',
        path: '/manage',
        sort: 4,
        url: 'Manage',
      },
    ],
  });
});
