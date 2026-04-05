import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { fetchFinChannelAllListApi } from '#/views/finance/deposit/useApi';
import {
  defaultSiteTodayWallDateTimeRange,
  formatSiteDateTime,
} from '#/utils/datetime';

/** site_ui withdraworder StatusOptions + 表格中更多状态 */
export const FINANCE_WITHDRAWAL_STATUS_OPTIONS = [
  { label: '等待审核', value: 1 },
  { label: '审核通过', value: 2 },
  { label: '后台拒绝', value: 3 },
  { label: '代付处理', value: 4 },
  { label: '代付成功', value: 5 },
  { label: '代付失败', value: 6 },
  { label: '重新下单', value: 7 },
  { label: '银行回退', value: 8 },
  { label: '已补单', value: 9 },
  { label: '跨天回退', value: 10 },
  { label: '待退款', value: 11 },
  { label: '已退款', value: 12 },
] as const;

export const WITHDRAWAL_STATUS_TAG: Record<
  number,
  { color: string; text: string }
> = {
  1: { color: 'processing', text: '等待审核' },
  2: { color: 'success', text: '审核通过' },
  3: { color: 'error', text: '后台拒绝' },
  4: { color: 'warning', text: '代付处理' },
  5: { color: 'success', text: '代付成功' },
  6: { color: 'error', text: '代付失败' },
  7: { color: 'default', text: '重新下单' },
  8: { color: 'warning', text: '银行回退' },
  9: { color: 'success', text: '已补单' },
  10: { color: 'warning', text: '跨天回退' },
  11: { color: 'processing', text: '待退款' },
  12: { color: 'success', text: '已退款' },
};

async function fetchPayOutChannelsForForm() {
  const list = await fetchFinChannelAllListApi();
  return list
    .filter((item) => item.pay_out_status === 1)
    .map((x) => ({ label: x.name, value: x.code }));
}

export function useFinanceWithdrawalGridFormSchema(): VbenFormSchema[] {
  const [createStart, createEnd] = defaultSiteTodayWallDateTimeRange();
  const rangePickerProps = {
    format: 'YYYY-MM-DD HH:mm:ss',
    showTime: true,
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };

  return [
    { component: 'Input', fieldName: 'order_id', label: '订单号' },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 1,
        placeholder: '请输入用户ID',
        style: { width: '100%' },
      },
      fieldName: 'uid',
      label: '用户ID',
    },
    { component: 'Input', fieldName: 'sn_id', label: '三方订单号' },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...FINANCE_WITHDRAWAL_STATUS_OPTIONS],
        placeholder: '状态',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'RangePicker',
      componentProps: rangePickerProps,
      defaultValue: [createStart, createEnd],
      fieldName: 'createTimeRange',
      label: '创建时间',
    },
    {
      component: 'RangePicker',
      componentProps: rangePickerProps,
      fieldName: 'updateTimeRange',
      label: '处理时间',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchPayOutChannelsForForm,
        immediate: true,
        placeholder: '通道名称',
      },
      fieldName: 'channel',
      label: '通道名称',
    },
    { component: 'Input', fieldName: 'account_no', label: '银行卡号' },
  ];
}

export function useFinanceWithdrawalColumns(): VxeTableGridColumns {
  return [
    { type: 'checkbox', width: 48 },
    { field: 'order_id', minWidth: 180, title: '订单号' },
    { field: 'uid', title: '用户ID', width: 100 },
    {
      field: 'black_status',
      slots: { default: 'colBlackStatus' },
      title: '是否列入黑名单',
      width: 130,
    },
    { field: 'amount', title: '提现金额', width: 100 },
    {
      field: 'real_amount',
      sortable: true,
      title: '转账金额',
      width: 110,
    },
    { field: 'fee', title: '玩家手续费', width: 100 },
    { field: 'channel_fee', title: '通道手续费', width: 110 },
    { field: 'account_type', title: '账号类型', width: 100 },
    { field: 'bank_code', title: '银行Code', width: 100 },
    { field: 'sn_id', minWidth: 160, showOverflow: true, title: '三方订单号' },
    { field: 'account_no', minWidth: 120, title: '银行卡号' },
    { field: 'channel', minWidth: 130, title: '支付通道' },
    { field: 'account_name', minWidth: 110, title: '银行卡账户名' },
    { field: 'identify_type', title: '证件类型', width: 100 },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '订单状态',
      width: 110,
    },
    { field: 'ip', minWidth: 140, title: '提现IP' },
    {
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '创建时间',
      width: 170,
    },
    {
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '处理时间',
      width: 150,
    },
    { field: 'operator', minWidth: 90, title: '操作员' },
    { field: 'remark', minWidth: 120, showOverflow: true, title: '备注' },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      minWidth: 420,
      slots: { default: 'colOperation' },
      title: '操作',
    },
  ];
}
