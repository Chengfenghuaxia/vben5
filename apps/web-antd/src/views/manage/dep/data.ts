import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export function useManageDepGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入部门名称' },
      fieldName: 'name',
      label: '部门名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '开启', value: 1 },
          { label: '关闭', value: 2 },
        ],
        placeholder: '状态',
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useManageDepColumns(): VxeTableGridColumns {
  return [
    { field: 'name', minWidth: 160, title: '部门名称' },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '状态',
      width: 100,
    },
    { field: 'operator', title: '操作人', width: 120 },
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
      width: 140,
    },
  ];
}

export function manageDepStatusDisplay(
  status: unknown,
): { color: string; text: string } | null {
  const n = Number(status);
  if (n === 1) {
    return { color: 'success', text: '开启' };
  }
  if (n === 2) {
    return { color: 'default', text: '关闭' };
  }
  return null;
}
