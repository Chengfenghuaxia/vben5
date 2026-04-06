import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

const WEEK_LABELS: Record<number, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
};

export function labelPushType(v: null | number | undefined) {
  if (v === 1) {
    return '站内推送';
  }
  if (v === 2) {
    return '浏览器(PWA)推送';
  }
  return v == null ? '—' : String(v);
}

export function labelMsgType(v: null | number | undefined) {
  if (v === 1) {
    return '正常';
  }
  if (v === 2) {
    return '静音';
  }
  return v == null ? '—' : String(v);
}

const USER_TYPE_LABELS: Record<number, string> = {
  4: '全体用户',
  9: '注册30分钟未充值',
  10: '注册2小时未充值',
  12: '首充次日未登录',
  13: '首充3日未登录',
  14: '首充7日未登录',
  15: '首充15日未登录',
  16: '首充30日未登录',
};

export function labelUserType(v: null | number | undefined) {
  if (v == null) {
    return '—';
  }
  return USER_TYPE_LABELS[v] ?? String(v);
}

export function labelTaskStatus(v: null | number | undefined) {
  const m: Record<number, string> = {
    0: '未知',
    1: '正常',
    2: '停用',
    3: '完成',
  };
  if (v == null) {
    return '—';
  }
  return m[v] ?? String(v);
}

export function taskStatusColor(v: null | number | undefined): string {
  if (v === 1) {
    return 'processing';
  }
  if (v === 2) {
    return 'warning';
  }
  if (v === 3) {
    return 'success';
  }
  return 'default';
}

export function labelSendType(v: null | number | undefined) {
  if (v === 1) {
    return '即时';
  }
  if (v === 2) {
    return '定时';
  }
  if (v === 3) {
    return '循环';
  }
  return v == null ? '—' : String(v);
}

export function formatCycleDays(days: null | number[] | undefined): string {
  if (!Array.isArray(days) || days.length === 0) {
    return '—';
  }
  return days.map((d) => WEEK_LABELS[d] ?? String(d)).join('、');
}

export function useMsgPushGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '站内推送', value: 1 },
          { label: '浏览器(PWA)推送', value: 2 },
        ],
        placeholder: '全部',
      },
      fieldName: 'push_type',
      label: '推送类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '即时', value: 1 },
          { label: '定时', value: 2 },
          { label: '循环', value: 3 },
        ],
        placeholder: '全部',
      },
      fieldName: 'send_type',
      label: '发送类型',
    },
  ];
}

export function useMsgPushColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', title: '#', width: 48 },
    { field: 'id', title: 'ID', width: 72 },
    {
      field: 'push_type',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        labelPushType(cellValue as number),
      title: '推送类型',
      width: 130,
    },
    {
      field: 'msg_type',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        labelMsgType(cellValue as number),
      title: '消息类型',
      width: 96,
    },
    {
      field: 'user_type',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        labelUserType(cellValue as number),
      minWidth: 140,
      showOverflow: true,
      title: '用户类型',
    },
    {
      field: 'template_name',
      minWidth: 120,
      showOverflow: true,
      title: '消息模板',
    },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '状态',
      width: 88,
    },
    {
      field: 'send_type',
      slots: { default: 'colSendType' },
      title: '发送类型',
      width: 110,
    },
    {
      field: 'cycle_days',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatCycleDays(cellValue as number[]),
      minWidth: 120,
      showOverflow: true,
      title: '循环周期',
    },
    {
      field: 'num',
      slots: { default: 'colNums' },
      title: '总/成/败',
      width: 120,
    },
    {
      field: 'sending_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        cellValue != null && String(cellValue) !== ''
          ? formatSiteDateTime(cellValue as number | string)
          : '—',
      title: '发送时间',
      width: 170,
    },
    {
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '更新时间',
      width: 170,
    },
    {
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '创建时间',
      width: 170,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'colOperation' },
      title: '操作',
      width: 220,
    },
  ];
}
