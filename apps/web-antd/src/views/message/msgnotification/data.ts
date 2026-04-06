import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export const NOTIFY_TYPE_OPTIONS = [
  { label: '站内推送', value: 1 },
  { label: '浏览器推送', value: 2 },
];

export const NOTIFY_STATUS_SEARCH_OPTIONS = [
  { label: '正常', value: 1 },
  { label: '禁用', value: 2 },
];

export const SCENE_OPTIONS = [
  { label: '提现成功', value: 1 },
  { label: '提现失败', value: 2 },
  { label: '充值成功', value: 3 },
  { label: '充值失败', value: 4 },
  { label: '活动开启', value: 5 },
  { label: '活动关闭', value: 6 },
  { label: '用户注册', value: 7 },
];

export function labelNotifyType(v: null | number | undefined) {
  if (v == null) {
    return '—';
  }
  return NOTIFY_TYPE_OPTIONS.find((x) => x.value === v)?.label ?? String(v);
}

const USER_TYPE_LABELS: Record<number, string> = {
  4: '全体用户',
  9: '注册30分钟未充值',
  10: '注册2小时未充值',
  12: '首充次日未登录',
  13: '首充3日未登录',
  14: '首充7日未登录',
  15: '首充15日未登录',
  16: '首充30日未登录',
};

export function labelUserType(v: null | number | undefined) {
  if (v == null) {
    return '—';
  }
  return USER_TYPE_LABELS[v] ?? '';
}

const SCENE_LABELS: Record<number, string> = {
  0: '未知',
  1: '提现成功',
  2: '提现失败',
  3: '充值成功',
  4: '充值失败',
  5: '活动开启',
  6: '活动关闭',
  7: '用户注册',
};

export function labelScene(v: null | number | undefined) {
  if (v == null) {
    return '—';
  }
  return SCENE_LABELS[v] ?? String(v);
}

const STATUS_LABELS: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '未知' },
  1: { color: 'success', label: '正常' },
  2: { color: 'error', label: '禁用' },
};

export function statusTagProps(v: null | number | undefined) {
  if (v == null) {
    return { color: 'default' as const, label: '—' };
  }
  const x = STATUS_LABELS[v] ?? { color: 'default' as const, label: String(v) };
  return x;
}

export function useNotifyGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: NOTIFY_TYPE_OPTIONS,
        placeholder: '全部',
      },
      fieldName: 'notify_type',
      label: '通知类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: NOTIFY_STATUS_SEARCH_OPTIONS,
        placeholder: '全部',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: SCENE_OPTIONS,
        placeholder: '全部',
      },
      fieldName: 'scene',
      label: '场景',
    },
  ];
}

export function useNotifyColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', title: '#', width: 60 },
    {
      field: 'notify_type',
      slots: { default: 'colNotifyType' },
      title: '通知类型',
      width: 120,
    },
    {
      field: 'user_type',
      slots: { default: 'colUserType' },
      title: '用户类型',
      minWidth: 160,
    },
    {
      field: 'scene',
      slots: { default: 'colScene' },
      title: '场景',
      width: 120,
    },
    { field: 'related_code', minWidth: 120, showOverflow: true, title: '关联信息' },
    {
      field: 'template_name',
      minWidth: 140,
      showOverflow: true,
      title: '消息模板',
    },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '状态',
      width: 100,
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
