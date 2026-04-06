import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

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

/** 子推送记录状态 — site_ui pushDetail */
export function labelPushRecordStatus(v: null | number | undefined) {
  const m: Record<number, string> = {
    0: '未知',
    1: '等待',
    2: '发送中',
    3: '暂停',
    4: '完成',
    5: '失败',
  };
  if (v == null) {
    return '—';
  }
  return m[v] ?? String(v);
}

export function pushRecordStatusColor(v: null | number | undefined): string {
  if (v === 1) {
    return 'processing';
  }
  if (v === 2) {
    return 'cyan';
  }
  if (v === 3) {
    return 'warning';
  }
  if (v === 4) {
    return 'success';
  }
  if (v === 5) {
    return 'error';
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
  return v == null ? '—' : String(v);
}

export function usePushDetailGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        placeholder: '推送任务 ID',
        style: { width: '100%' },
      },
      fieldName: 'task_id',
      label: '任务 ID',
    },
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
  ];
}

export function usePushDetailColumns(): VxeTableGridColumns {
  return [
    { type: 'seq', title: '#', width: 48 },
    { field: 'id', title: 'ID', width: 72 },
    { field: 'task_id', title: '任务ID', width: 88 },
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
    { field: 'num', title: '总发送', width: 88 },
    { field: 'success_num', title: '成功', width: 88 },
    { field: 'failed_num', title: '失败', width: 88 },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '状态',
      width: 96,
    },
    {
      field: 'send_type',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        labelSendType(cellValue as number),
      title: '发送类型',
      width: 96,
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

/** 触达明细表列 — site_ui pushDetail/modules/msg.vue */
export function usePushReachDetailColumns(): VxeTableGridColumns {
  return [
    { field: 'uid', title: '用户ID', width: 110 },
    { field: 'site', title: '站点Code', width: 110 },
    { field: 'task_id', title: '消息推送ID', width: 110 },
    { field: 'phone', minWidth: 120, showOverflow: true, title: '手机号码' },
    {
      field: 'status',
      formatter: ({ cellValue }: { cellValue: unknown }) => {
        const m: Record<number, string> = {
          0: '未知',
          1: '等待推送',
          2: '推送完成',
          3: '推送失败',
          4: '打开成功',
        };
        const n = cellValue as number;
        return m[n] ?? String(cellValue ?? '—');
      },
      title: '状态',
      width: 110,
    },
    {
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '更新时间',
      width: 170,
    },
  ];
}
