import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

/** site_ui Withdrawmoney index method 列 */
export const WITHDRAWAL_WAY_METHOD_MAP: Record<
  number,
  { color: string; label: string }
> = {
  0: { color: 'default', label: '未知' },
  1: { color: 'success', label: '银行卡' },
  2: { color: 'error', label: '电子钱包' },
};

export function useWithdrawMoneyGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入名称',
      },
      fieldName: 'name',
      label: '提现名称',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入code',
      },
      fieldName: 'code',
      label: '提现Code',
    },
  ];
}

/** 列顺序与 site_ui `Withdrawmoney/index.vue` columns 一致（无序号列时由表格 seq 补） */
export function useWithdrawMoneyColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', align: 'center', title: '序号', width: 64 },
    {
      align: 'center',
      field: 'name',
      minWidth: 150,
      title: '提现名称',
    },
    {
      align: 'center',
      field: 'code',
      minWidth: 150,
      title: '提现Code',
    },
    {
      align: 'center',
      field: 'method',
      slots: { default: 'colMethod' },
      title: '提现方式',
      width: 150,
    },
    {
      align: 'center',
      field: 'status',
      slots: { default: 'colStatus' },
      title: '状态',
      width: 150,
    },
    {
      align: 'center',
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '更新时间',
      width: 150,
    },
    {
      align: 'center',
      field: 'operator',
      minWidth: 150,
      title: '操作人',
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      minWidth: 120,
      slots: { default: 'colOperation' },
      title: '操作',
    },
  ];
}
