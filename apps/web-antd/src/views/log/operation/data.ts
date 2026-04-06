import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export function useOperationLogGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '操作人' },
      fieldName: 'admin_name',
      label: '操作人',
    },
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '模块/菜单' },
      fieldName: 'module',
      label: '模块',
    },
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '关键词' },
      fieldName: 'keyword',
      label: '关键词',
    },
    {
      component: 'SiteRangePicker',
      fieldName: 'timeRange',
      label: '操作时间',
    },
  ];
}

export function useOperationLogColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', title: '#', width: 56 },
    { field: 'id', title: 'ID', width: 88 },
    {
      field: 'admin_name',
      minWidth: 110,
      showOverflow: true,
      title: '操作人',
    },
    {
      field: 'module',
      minWidth: 120,
      showOverflow: true,
      title: '模块',
    },
    {
      field: 'action',
      minWidth: 96,
      showOverflow: true,
      title: '操作',
    },
    {
      field: 'method',
      showOverflow: true,
      title: '方法',
      width: 88,
    },
    {
      field: 'request_uri',
      minWidth: 200,
      showOverflow: true,
      title: '请求地址',
    },
    {
      field: 'ip',
      showOverflow: true,
      title: 'IP',
      width: 140,
    },
    {
      field: 'content',
      minWidth: 220,
      showOverflow: true,
      title: '内容',
    },
    {
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '操作时间',
      width: 172,
    },
  ];
}
