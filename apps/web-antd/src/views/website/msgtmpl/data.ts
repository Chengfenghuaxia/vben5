import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export const MSG_TMPL_TYPE_OPTIONS = [
  { label: '站内推送', value: 1 },
  { label: '浏览器推送', value: 2 },
];

export const MSG_TMPL_STATUS_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 2 },
];

export function useMsgTmplGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '模板名称' },
      fieldName: 'name',
      label: '名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: MSG_TMPL_TYPE_OPTIONS,
        placeholder: '全部',
      },
      fieldName: 'tmpl_type',
      label: '类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: MSG_TMPL_STATUS_OPTIONS,
        placeholder: '全部',
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useMsgTmplColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', title: '#', width: 52 },
    { field: 'id', title: 'ID', width: 72 },
    {
      field: 'language',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        String(cellValue ?? '—'),
      title: '语言',
      width: 100,
    },
    {
      field: 'tmpl_type',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        MSG_TMPL_TYPE_OPTIONS.find((x) => x.value === cellValue)?.label ??
        String(cellValue ?? '—'),
      title: '类型',
      width: 110,
    },
    {
      field: 'name',
      minWidth: 120,
      showOverflow: true,
      title: '模板名称',
    },
    {
      field: 'title',
      minWidth: 120,
      showOverflow: true,
      title: '标题',
    },
    {
      field: 'content',
      minWidth: 200,
      showOverflow: true,
      title: '内容摘要',
    },
    {
      field: 'status',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        MSG_TMPL_STATUS_OPTIONS.find((x) => x.value === cellValue)?.label ??
        String(cellValue ?? '—'),
      title: '状态',
      width: 88,
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
