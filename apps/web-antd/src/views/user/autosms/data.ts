import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export const SMS_MODE_OPTIONS = [
  { label: '注册30分钟未充值', value: 9 },
  { label: '注册2小时未充值', value: 10 },
  { label: '注册当日未充值', value: 11 },
  { label: '首充次日未登录', value: 12 },
  { label: '首充3日未登录', value: 13 },
  { label: '首充7日未登录', value: 14 },
  { label: '首充15日未登录', value: 15 },
  { label: '首充30日未登录', value: 16 },
  { label: '首充满2小时用户', value: 19 },
  { label: '首充30分钟临界用户（余额 ≤ 2）', value: 21 },
  { label: '首充2小时临界用户（余额 ≤ 2）', value: 22 },
  { label: '首充次日临界用户（余额 ≤ 2）', value: 23 },
];

export function labelSmsMode(v: null | number | undefined) {
  if (v == null) {
    return '—';
  }
  return SMS_MODE_OPTIONS.find((x) => x.value === v)?.label ?? String(v);
}

export function useAutoSmsColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', title: '#', width: 48 },
    { field: 'id', title: 'ID', width: 72 },
    {
      field: 'mode',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        labelSmsMode(cellValue as number),
      minWidth: 200,
      showOverflow: true,
      title: '用户类型',
    },
    {
      field: 'config_name',
      minWidth: 100,
      showOverflow: true,
      title: '通道名称',
    },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '发送状态',
      width: 100,
    },
    { field: 'submit_num', title: '提交条数', width: 96 },
    { field: 'success_num', title: '成功条数', width: 96 },
    { field: 'fail_num', title: '失败条数', width: 96 },
    {
      field: 'success_rate',
      slots: { default: 'colSuccessRate' },
      title: '成功率',
      width: 96,
    },
    {
      field: 'operator',
      showOverflow: true,
      title: '操作人',
      width: 100,
    },
    {
      field: 'open_time',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue === 0 || cellValue == null
          ? '/'
          : formatSiteDateTime(cellValue as number | string),
      title: '开启时间',
      width: 170,
    },
    {
      field: 'operation_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue === 0 || cellValue == null
          ? '/'
          : formatSiteDateTime(cellValue as number | string),
      title: '操作时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'colOperation' },
      title: '操作',
      width: 140,
    },
  ];
}
