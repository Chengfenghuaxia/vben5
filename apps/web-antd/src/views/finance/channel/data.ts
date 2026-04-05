import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

/** site_ui user-search.vue 类型选项 */
export const CHANNEL_MODE_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '充值', value: 1 },
  { label: '取现', value: 2 },
] as const;

/** site_ui 通道状态 / 代收 / 代付 下拉 */
export const CHANNEL_ON_OFF_OPTIONS = [
  { label: '开启', value: 1 },
  { label: '关闭', value: 2 },
] as const;

export const CHANNEL_MODE_TAG: Record<number, { color: string; text: string }> =
  {
    0: { color: 'default', text: '不限' },
    1: { color: 'warning', text: '充值' },
    2: { color: 'success', text: '取现' },
  };

export function useFinanceChannelGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...CHANNEL_MODE_OPTIONS],
        placeholder: '请选择类型',
      },
      fieldName: 'mode',
      label: '类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...CHANNEL_ON_OFF_OPTIONS],
        placeholder: '请选择通道状态',
      },
      fieldName: 'status',
      label: '通道状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...CHANNEL_ON_OFF_OPTIONS],
        placeholder: '请选择代收状态',
      },
      fieldName: 'pay_in_status',
      label: '代收状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...CHANNEL_ON_OFF_OPTIONS],
        placeholder: '请选择代付状态',
      },
      fieldName: 'pay_out_status',
      label: '代付状态',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入通道code',
      },
      fieldName: 'code',
      label: '通道Code',
    },
  ];
}

export function useFinanceChannelColumns(): VxeTableGridColumns {
  return [
    {
      align: 'center',
      field: 'id',
      title: '通道ID',
      width: 80,
    },
    {
      align: 'center',
      field: 'name',
      minWidth: 150,
      title: '通道名称',
    },
    {
      align: 'center',
      field: 'mode',
      slots: { default: 'colMode' },
      title: '类型',
      width: 150,
    },
    {
      align: 'center',
      field: 'code',
      minWidth: 150,
      title: '通道Code',
    },
    {
      align: 'center',
      field: 'pay_in_status',
      minWidth: 180,
      slots: { default: 'colPayIn' },
      title: '代收通道状态/权重',
    },
    {
      align: 'center',
      field: 'pay_out_status',
      minWidth: 180,
      slots: { default: 'colPayOut' },
      title: '代付通道状态/权重',
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
      title: '操作员',
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      minWidth: 280,
      slots: { default: 'colOperation' },
      title: '操作',
    },
  ];
}
