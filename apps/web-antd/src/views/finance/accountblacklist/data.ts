import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
};

export function accountBlacklistTypeLabel(type: unknown): string {
  if (type === null || type === undefined || type === '') {
    return '-';
  }
  const s = String(type);
  return ACCOUNT_TYPE_LABEL[s] ?? s;
}

export function useFinanceAccountBlacklistGridFormSchema(): VbenFormSchema[] {
  const rangePickerProps = {
    format: 'YYYY-MM-DD HH:mm:ss',
    showTime: true,
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };

  return [
    {
      component: 'RangePicker',
      componentProps: rangePickerProps,
      fieldName: 'timeRange',
      label: '时间',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入银行卡号',
      },
      fieldName: 'account_no',
      label: '银行卡号',
    },
  ];
}

export function useFinanceAccountBlacklistColumns(): VxeTableGridColumns {
  return [
    {
      align: 'center',
      field: 'account_type',
      slots: { default: 'colAccountType' },
      title: '证件类型',
      width: 120,
    },
    {
      align: 'center',
      field: 'account_no',
      minWidth: 180,
      title: '银行卡号',
    },
    {
      align: 'center',
      field: 'account_name',
      minWidth: 180,
      title: '银行卡账户名',
    },
    {
      align: 'center',
      field: 'ip',
      minWidth: 150,
      title: 'IP',
    },
    {
      align: 'center',
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '加入时间',
      width: 180,
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
