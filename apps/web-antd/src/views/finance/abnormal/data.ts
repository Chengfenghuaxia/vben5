import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

/**
 * 与 site_ui `views/finance/abnormal/modules/consumption-search.vue` 一致：
 * 订单类型筛选用字段名 `method`，0 不限 / 1 充值 / 2 提现。
 */
export const SITE_UI_ABNORMAL_METHOD_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '充值', value: 1 },
  { label: '提现', value: 2 },
] as const;

/** site_ui index.vue customRender 中与订单状态共用的 Tag color 映射 */
const STATUS_TAG_COLOR: Record<number, string> = {
  1: 'processing',
  2: 'success',
  3: 'error',
  4: 'warning',
  5: 'success',
  6: 'error',
};

const DEPOSIT_STATUS_LABELS: { label: string; value: number }[] = [
  { label: '待支付', value: 1 },
  { label: '已成功', value: 2 },
  { label: '已失败', value: 3 },
  { label: '已取消', value: 4 },
];

const WITHDRAW_STATUS_LABELS: { label: string; value: number }[] = [
  { label: '等待审核', value: 1 },
  { label: '审核通过', value: 2 },
  { label: '后台拒绝', value: 3 },
  { label: '代付处理', value: 4 },
  { label: '代付成功', value: 5 },
  { label: '代付失败', value: 6 },
  { label: '重新下单', value: 7 },
];

function labelFromList(
  value: number,
  list: { label: string; value: number }[],
): string | undefined {
  return list.find((item) => item.value === value)?.label;
}

/**
 * 订单状态展示（site_ui `order_type === 1` 充值 / `=== 2` 提现两套文案）
 */
export function abnormalOrderStatusDisplay(
  orderType: unknown,
  status: unknown,
): { color: string; text: string } | null {
  if (status === null || status === undefined) {
    return null;
  }
  const s = Number(status);
  if (!Number.isFinite(s)) {
    return null;
  }
  const ot = Number(orderType);
  const color = STATUS_TAG_COLOR[s];
  if (!color) {
    return null;
  }
  if (ot === 1) {
    const text = labelFromList(s, DEPOSIT_STATUS_LABELS);
    return text ? { color, text } : null;
  }
  if (ot === 2) {
    const text = labelFromList(s, WITHDRAW_STATUS_LABELS);
    return text ? { color, text } : null;
  }
  return null;
}

/**
 * 三方订单状态（site_ui 与订单状态相同分支逻辑）
 */
export function abnormalSnStatusDisplay(
  orderType: unknown,
  snStatus: unknown,
): { color: string; text: string } | null {
  return abnormalOrderStatusDisplay(orderType, snStatus);
}

export function abnormalOrderTypeText(orderType: unknown): string {
  const ot = Number(orderType);
  if (ot === 1) {
    return '充值';
  }
  if (ot === 2) {
    return '提现';
  }
  return '-';
}

export function useFinanceAbnormalGridFormSchema(): VbenFormSchema[] {
  const rangePickerProps = {
    format: 'YYYY-MM-DD HH:mm:ss',
    showTime: true,
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };

  return [
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
      component: 'Input',
      fieldName: 'order_id',
      label: '订单ID',
    },
    {
      component: 'Input',
      fieldName: 'sn_id',
      label: '三方订单号',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [...SITE_UI_ABNORMAL_METHOD_OPTIONS],
        placeholder: '请选择订单类型',
      },
      fieldName: 'method',
      label: '订单类型',
    },
    {
      component: 'RangePicker',
      componentProps: rangePickerProps,
      fieldName: 'createTimeRange',
      label: '创建时间',
    },
  ];
}

/** 列顺序与宽度对齐 site_ui `views/finance/abnormal/index.vue` columns */
export function useFinanceAbnormalColumns(): VxeTableGridColumns {
  return [
    {
      align: 'center',
      field: 'id',
      title: '订单ID',
      width: 200,
    },
    {
      align: 'center',
      field: 'uid',
      title: '用户ID',
      width: 100,
    },
    {
      align: 'center',
      field: 'order_type',
      slots: { default: 'colOrderType' },
      title: '订单类型',
      width: 100,
    },
    {
      align: 'center',
      field: 'order_id',
      minWidth: 180,
      title: '订单号',
    },
    {
      align: 'center',
      field: 'sn_id',
      minWidth: 180,
      title: '三方订单号',
    },
    {
      align: 'center',
      field: 'status',
      slots: { default: 'colStatus' },
      title: '订单状态',
      width: 100,
    },
    {
      align: 'center',
      field: 'sn_status',
      slots: { default: 'colSnStatus' },
      title: '三方订单状态',
      width: 180,
    },
    {
      align: 'center',
      field: 'params',
      minWidth: 100,
      slots: { default: 'colParams' },
      title: '回调参数',
    },
    {
      align: 'center',
      field: 'channel',
      minWidth: 150,
      title: '支付通道',
    },
    {
      align: 'center',
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '创建时间',
      width: 180,
    },
  ];
}
