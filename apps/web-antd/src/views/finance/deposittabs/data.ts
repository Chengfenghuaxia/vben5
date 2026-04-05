import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export function useDepositTabsColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', width: 64, title: '序号' },
    { field: 'amount', title: '充值金额', minWidth: 120, align: 'center' },
    {
      field: 'is_hot',
      slots: { default: 'colIsHot' },
      title: '是否热门推荐',
      minWidth: 140,
      align: 'center',
    },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '状态',
      minWidth: 100,
      align: 'center',
    },
    { field: 'sort', title: '排序', minWidth: 90, align: 'center' },
    {
      field: 'updated_at',
      formatter: ({ cellValue }) =>
        formatSiteDateTime(cellValue as number | string),
      minWidth: 170,
      title: '更新时间',
      align: 'center',
    },
    { field: 'operator', minWidth: 100, title: '操作员', align: 'center' },
    {
      field: 'operate',
      fixed: 'right',
      slots: { default: 'colOperate' },
      title: '操作',
      width: 160,
      align: 'center',
    },
  ];
}
