import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

/** 跳转页文案（与 site_ui `website/dataTracking` 列表 redirect 列一致） */
export const WEBSITE_DATATRACKING_REDIRECT_LABELS: Record<number, string> = {
  1: '首页',
  2: '登录',
  3: '注册',
  4: '充值',
  5: '累计充值活动',
  6: '无限代理活动',
  7: '充值大酬宾活动',
  8: '每日救济金活动',
  9: '等级奖励活动',
  10: '拼多多活动',
  11: '红包雨活动',
  12: '刮刮乐活动',
  13: '超级会员日活动',
  14: 'VIP活动',
  15: '每周补偿金活动',
  16: '洗码活动',
  17: '邀请宝箱活动',
  18: '神秘任务活动',
  19: '抽奖集卡活动',
  20: '存款返现活动',
  21: '兑换码活动',
  22: '存款宝箱活动',
  23: '签到活动',
  24: 'VPI激励卡活动',
  25: '破产补助活动',
};

export const WEBSITE_DATATRACKING_REDIRECT_OPTIONS = Object.entries(
  WEBSITE_DATATRACKING_REDIRECT_LABELS,
).map(([value, label]) => ({ label, value: Number(value) }));

export const WEBSITE_DATATRACKING_EVENT_OPTIONS = [
  { label: '埋点事件-UV(独立访客)', value: 1 },
  { label: '埋点事件-PV(访问量)', value: 2 },
  { label: '埋点事件-注册', value: 3 },
  { label: '埋点事件-登录', value: 4 },
  { label: '埋点事件-充值', value: 5 },
] as const;

export function useWebsiteDatatrackingGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: '埋点名称' },
    { component: 'Input', fieldName: 'url', label: '推广地址' },
    {
      component: 'SiteRangePicker',
      fieldName: 'statRange',
      label: '统计时间',
    },
  ];
}

export function useWebsiteDatatrackingColumns(): VxeTableGridColumns {
  return [
    { field: 'id', title: 'ID', width: 100 },
    { field: 'name', minWidth: 120, title: '埋点名称' },
    {
      field: 'url',
      minWidth: 280,
      showOverflow: true,
      slots: { default: 'colUrl' },
      title: '推广地址',
    },
    {
      field: 'redirect',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        WEBSITE_DATATRACKING_REDIRECT_LABELS[Number(cellValue)] ?? '',
      title: '跳转页面',
      width: 130,
    },
    { field: 'uv', title: 'UV', width: 100 },
    { field: 'pv', title: 'PV', width: 100 },
    {
      field: 'register',
      slots: { default: 'colRegister' },
      title: '注册',
      width: 90,
    },
    {
      field: 'login',
      slots: { default: 'colLogin' },
      title: '登录',
      width: 90,
    },
    {
      field: 'deposit',
      slots: { default: 'colDeposit' },
      title: '充值',
      width: 90,
    },
    {
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '创建时间',
      width: 170,
    },
    {
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '更新时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'colOperation' },
      title: '操作',
      width: 160,
    },
  ];
}
