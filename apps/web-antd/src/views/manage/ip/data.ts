import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export function useManageIpGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入 IP' },
      fieldName: 'ip',
      label: 'IP',
    },
  ];
}

export function useManageIpColumns(): VxeTableGridColumns {
  return [
    { field: 'ip', minWidth: 160, title: 'IP' },
    { field: 'operator', title: '操作人', width: 120 },
    {
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '创建时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operate',
      fixed: 'right',
      slots: { default: 'colOperate' },
      title: '操作',
      width: 100,
    },
  ];
}
