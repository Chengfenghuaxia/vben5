import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import {
  fetchAgentAllListApi,
  fetchTeamAllListApi,
} from '#/api/core/acting-agent';
import {
  fetchDepositTemplateListApi,
  fetchFinChannelAllListApi,
} from '#/api/core/finance-deposit';
import { defaultSiteTodayWallDateTimeRange, formatSiteDateTime } from '#/utils/datetime';

async function fetchTeamsForForm() {
  const list = await fetchTeamAllListApi();
  return list.map((x) => ({ label: x.name, value: x.id }));
}

async function fetchAgentsForForm(params?: { team_ids?: number[] }) {
  const ids = params?.team_ids?.filter((n) => Number.isFinite(Number(n))) as number[] | undefined;
  const list = await fetchAgentAllListApi(
    ids && ids.length > 0 ? { team_ids: ids } : {},
  );
  return list.map((x) => ({ label: x.name, value: x.id }));
}

async function fetchChannelsForForm() {
  const list = await fetchFinChannelAllListApi();
  return list.map((x) => ({ label: x.name, value: x.code }));
}

async function fetchTemplatesForForm() {
  const list = await fetchDepositTemplateListApi();
  return list.map((x) => ({ label: x.name ?? String(x.id), value: x.id }));
}

export const FINANCE_DEPOSIT_STATUS_OPTIONS = [
  { label: '待支付', value: 1 },
  { label: '已成功', value: 2 },
  { label: '已失败', value: 3 },
  { label: '已取消', value: 4 },
  { label: '已补单', value: 5 },
  { label: '部分支付', value: 6 },
] as const;

export function useFinanceDepositGridFormSchema(): VbenFormSchema[] {
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
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchTeamsForForm,
        immediate: true,
        maxTagCount: 2,
        mode: 'multiple',
        placeholder: '推广总代',
      },
      fieldName: 'team_ids',
      label: '推广总代',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchAgentsForForm,
        immediate: true,
        maxTagCount: 2,
        mode: 'multiple',
        placeholder: '渠道名称',
      },
      dependencies: {
        componentProps(values) {
          const team_ids = Array.isArray(values.team_ids) ? values.team_ids : [];
          return {
            disabled: team_ids.length === 0,
            params: { team_ids },
          };
        },
        trigger(_values, formApi) {
          void formApi.setFieldValue('agent_ids', undefined);
        },
        triggerFields: ['team_ids'],
      },
      fieldName: 'agent_ids',
      label: '渠道名称',
    },
    { component: 'Input', fieldName: 'sn_id', label: '三方订单号' },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...FINANCE_DEPOSIT_STATUS_OPTIONS],
        placeholder: '订单状态',
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
      label: '订单更新时间',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchChannelsForForm,
        immediate: true,
        placeholder: '支付通道',
      },
      fieldName: 'channel',
      label: '通道名称',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchTemplatesForForm,
        immediate: true,
        placeholder: '充值模板',
      },
      fieldName: 'template_id',
      label: '充值模板',
    },
  ];
}

export function useFinanceDepositColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', title: '序号', width: 64 },
    { field: 'order_id', minWidth: 140, title: '订单号' },
    { field: 'uid', title: '用户ID', width: 110 },
    { field: 'team_name', minWidth: 120, title: '总代名称' },
    { field: 'agent_name', minWidth: 120, title: '渠道名称' },
    {
      field: 'pid',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue != null && cellValue !== '' ? String(cellValue) : '-',
      title: '上级ID',
      width: 100,
    },
    { field: 'amount', title: '订单金额', width: 110 },
    { field: 'real_amount', title: '充值金额', width: 110 },
    { field: 'fee', title: '通道费', width: 100 },
    { field: 'channel', minWidth: 120, title: '支付通道' },
    { field: 'sn_id', minWidth: 140, showOverflow: true, title: '三方订单号' },
    {
      field: 'gift_status',
      slots: { default: 'colGiftStatus' },
      title: '充值赠送活动状态',
      width: 150,
    },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '订单状态',
      width: 110,
    },
    { field: 'template_name', minWidth: 120, title: '充值模板' },
    {
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '订单创建时间',
      width: 170,
    },
    {
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '订单更新时间',
      width: 170,
    },
    { field: 'operator', minWidth: 100, title: '操作员' },
    { field: 'remark', minWidth: 100, showOverflow: true, title: '备注' },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'colOperation' },
      title: '操作',
      width: 120,
    },
  ];
}
