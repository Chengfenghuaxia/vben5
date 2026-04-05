import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export function useManageRoleColumns(): VxeTableGridColumns {
  return [
    { field: 'name', minWidth: 140, title: '角色名称' },
    { field: 'operator', title: '操作人', width: 120 },
    { field: 'remark', minWidth: 120, showOverflow: true, title: '备注' },
    {
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '更新时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operate',
      fixed: 'right',
      slots: { default: 'colOperate' },
      title: '操作',
      width: 200,
    },
  ];
}
