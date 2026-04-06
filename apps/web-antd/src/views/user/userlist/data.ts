import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

import type { SiteMemberRow } from './useApi';
import { fetchAgentAllListApi, fetchTeamAllListApi } from './useApi';

function firstWithdrawInfo(row: SiteMemberRow): Record<string, unknown> | null {
  const w = row.withdraw_info;
  if (!Array.isArray(w) || !w[0] || typeof w[0] !== 'object') {
    return null;
  }
  return w[0] as Record<string, unknown>;
}

async function fetchTeamsForForm() {
  const list = await fetchTeamAllListApi();
  return list.map((x) => ({ label: x.name, value: x.id }));
}

async function fetchAgentsForForm(params?: { team_ids?: number[] }) {
  const ids = params?.team_ids?.filter((n) => Number.isFinite(Number(n))) as
    | number[]
    | undefined;
  const list = await fetchAgentAllListApi(
    ids && ids.length > 0 ? { team_ids: ids } : {},
  );
  return list.map((x) => ({ label: x.name, value: x.id }));
}

export function useSiteMemberGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        placeholder: '用户 ID',
        style: { width: '100%' },
      },
      fieldName: 'uid',
      label: '用户 ID',
    },
    {
      component: 'Input',
      componentProps: { allowClear: true, maxlength: 11, placeholder: '手机号' },
      fieldName: 'phone',
      label: '手机号',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '上级 ID（空表示不限）',
        style: { width: '100%' },
      },
      fieldName: 'pid_display',
      label: '上级 ID',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchTeamsForForm,
        immediate: true,
        maxTagCount: 2,
        mode: 'multiple',
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
      },
      dependencies: {
        componentProps(values) {
          return {
            params: {
              team_ids: Array.isArray(values.team_ids) ? values.team_ids : [],
            },
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
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 2 },
        ],
        placeholder: '状态',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '正常', value: 1 },
          { label: '异常', value: 2 },
        ],
        placeholder: '用户异常状态',
      },
      fieldName: 'user_status',
      label: '用户异常状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '正常用户', value: 1 },
          { label: '测试账户', value: 2 },
        ],
        placeholder: '用户类型',
      },
      fieldName: 'type',
      label: '用户类型',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '最小',
        style: { width: '100%' },
      },
      fieldName: 'min_deposit_amount',
      label: '充值金额(小)',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '最大',
        style: { width: '100%' },
      },
      fieldName: 'max_deposit_amount',
      label: '充值金额(大)',
    },
    {
      component: 'SiteRangePicker',
      fieldName: 'registerRange',
      label: '注册时间',
    },
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '注册 IP' },
      fieldName: 'addip',
      label: '注册 IP',
    },
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '银行卡号' },
      fieldName: 'account_no',
      label: '银行卡号',
    },
    {
      component: 'SiteRangePicker',
      fieldName: 'loginRange',
      label: '上次登录时间',
    },
    {
      component: 'SiteRangePicker',
      fieldName: 'firstDepositRange',
      label: '首充时间',
    },
  ];
}

export function useSiteMemberColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', title: '#', width: 48 },
    { field: 'team_name', minWidth: 120, showOverflow: true, title: '总代名称' },
    { field: 'agent_name', minWidth: 120, showOverflow: true, title: '渠道名称' },
    { field: 'id', title: '用户ID', width: 100 },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '状态',
      width: 88,
    },
    {
      field: 'withdraw_status',
      slots: { default: 'colWithdrawStatus' },
      title: '提现状态',
      width: 100,
    },
    {
      field: 'invite_source',
      minWidth: 120,
      showOverflow: true,
      slots: { default: 'colInviteSource' },
      title: '邀请来源',
    },
    {
      field: 'ws_sub_abnormal',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue === 0 || cellValue ? String(cellValue) : '—',
      title: '下级WS异常累计',
      width: 130,
    },
    {
      field: 'ws_status',
      slots: { default: 'colWsStatus' },
      title: 'WS检测状态',
      width: 110,
    },
    { field: 'vip', title: '会员等级', width: 88 },
    { field: 'pid', title: '上级ID', width: 88 },
    {
      field: 'direct_sub_count',
      slots: { default: 'colDirectSub' },
      title: '直推人数',
      width: 100,
    },
    { field: 'phone', minWidth: 120, showOverflow: true, title: '手机号码' },
    { field: 'rtp', title: 'RTP', width: 72 },
    {
      field: 'user_status',
      slots: { default: 'colUserStatus' },
      title: '用户异常状态',
      width: 120,
    },
    {
      field: 'ws_abnormal',
      slots: { default: 'colWsAbnormal' },
      title: '异常WS账户',
      width: 120,
    },
    {
      formatter: ({ row }: { row: SiteMemberRow }) => {
        const f = firstWithdrawInfo(row);
        const v = f?.account_type;
        return v != null && v !== '' ? String(v) : '—';
      },
      title: '证件类型',
      width: 100,
    },
    {
      formatter: ({ row }: { row: SiteMemberRow }) => {
        const f = firstWithdrawInfo(row);
        const v = f?.account_name;
        return v != null && v !== '' ? String(v) : '—';
      },
      title: '银行卡姓名',
      width: 110,
    },
    {
      field: 'account_no',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue != null && String(cellValue) !== '' ? String(cellValue) : '—',
      minWidth: 140,
      showOverflow: true,
      title: '银行卡账号',
    },
    { field: 'invite', minWidth: 100, showOverflow: true, title: '邀请码' },
    {
      field: 'type',
      slots: { default: 'colUserType' },
      title: '用户类型',
      width: 100,
    },
    { field: 'amount', title: '可用余额', width: 100 },
    { field: 'freeze', title: '冻结金额', width: 100 },
    {
      field: 'withdrawal',
      sortable: true,
      title: '总提现金额',
      width: 110,
    },
    {
      field: 'deposit',
      sortable: true,
      title: '总充值金额',
      width: 110,
    },
    { field: 'task_amount', title: '剩余打码量', width: 100 },
    { field: 'total_task_amount', title: '总打码量', width: 100 },
    { field: 'wl_amount', title: '总输赢', width: 100 },
    { field: 'gift_amount', title: '总赠送金额', width: 100 },
    { field: 'gift_amount_today', title: '当日赠送金额', width: 110 },
    { field: 'withdrawal_today', title: '今日提现金额', width: 110 },
    { field: 'deposit_today', title: '今日充值金额', width: 110 },
    { field: 'wl_amount_today', title: '今日输赢金额', width: 110 },
    {
      field: 'addip',
      minWidth: 140,
      showOverflow: true,
      slots: { default: 'colRegIp' },
      title: '注册IP',
    },
    {
      field: 'login_ip',
      minWidth: 140,
      showOverflow: true,
      slots: { default: 'colLoginIp' },
      title: '上次登陆IP',
    },
    {
      field: 'remark',
      minWidth: 120,
      showOverflow: true,
      title: '备注',
    },
    {
      field: 'login_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue
          ? formatSiteDateTime(cellValue as number | string)
          : '—',
      title: '上次登录时间',
      width: 170,
    },
    {
      field: 'first_deposit_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue
          ? formatSiteDateTime(cellValue as number | string)
          : '—',
      title: '首充时间',
      width: 170,
    },
    {
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue ? formatSiteDateTime(cellValue as number | string) : '—',
      title: '注册时间',
      width: 170,
    },
    {
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue ? formatSiteDateTime(cellValue as number | string) : '—',
      title: '更新时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'colOperation' },
      title: '操作',
      width: 280,
    },
  ];
}
