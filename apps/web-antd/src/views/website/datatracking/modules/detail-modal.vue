<script lang="ts" setup>
import type { ActingDataTrackingRow } from '../useApi';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { computed, ref, watch } from 'vue';

import {
  exportActingDataTrackingDepositApi,
  exportActingDataTrackingLoginApi,
  exportActingDataTrackingRegisterApi,
  fetchActingDataTrackingRecordListApi,
} from '../useApi';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { Button } from 'ant-design-vue';

import { formatSiteDateTime } from '#/utils/datetime';

export type WebsiteDatatrackingDetailPayload = ActingDataTrackingRow & {
  Btnid: number;
  end_at?: number;
  eventType: number;
  start_at?: number;
};

defineOptions({ name: 'WebsiteDatatrackingDetailModal' });

const props = defineProps<{
  open: boolean;
  row: null | WebsiteDatatrackingDetailPayload;
}>();

const emit = defineEmits<{
  'update:open': [boolean];
}>();

const innerOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

const titleMap: Record<number, string> = {
  3: '注册详情',
  4: '登录详情',
  5: '充值详情',
};

const title = computed(() => {
  const t = props.row?.eventType != null ? titleMap[props.row.eventType] : '';
  return t || '详情';
});

const exportLoading = ref(false);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'id', title: 'ID', width: 90 },
      {
        field: 'created_at',
        formatter: ({ cellValue }: { cellValue: unknown }) =>
          formatSiteDateTime(cellValue as number | string),
        title: '时间',
        width: 170,
      },
      { field: 'uid', title: 'UID', width: 100 },
      { field: 'phone', minWidth: 120, title: '手机号' },
      { field: 'amount', title: '金额', width: 100 },
      { field: 'ip', minWidth: 140, title: 'IP' },
      { field: 'device', minWidth: 120, title: '设备' },
    ],
    height: 420,
    pagerConfig: {},
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          const r = props.row;
          if (!r?.id) {
            return { items: [], page: { total: 0 }, total: 0 };
          }
          const base = {
            id: r.id,
            page: page.currentPage,
            size: page.pageSize,
            type: r.eventType,
            ...(r.start_at != null && r.end_at != null
              ? { end_at: r.end_at, start_at: r.start_at }
              : {}),
          };
          try {
            const { list, total } =
              await fetchActingDataTrackingRecordListApi(base);
            return { items: list, page: { total }, total };
          } catch {
            message.error('加载详情失败');
          }
          return { items: [], page: { total: 0 }, total: 0 };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, zoom: true },
  },
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[900px]',
  footer: false,
  onOpenChange(isOpen) {
    innerOpen.value = isOpen;
  },
});

watch(
  () => [props.open, props.row] as const,
  ([open, row]) => {
    if (!open) {
      modalApi.close();
      return;
    }
    if (!row) {
      return;
    }
    modalApi.open();
    modalApi.setState({ title: title.value });
    gridApi.query();
  },
);

async function onExport() {
  const r = props.row;
  if (!r?.id) {
    return;
  }
  exportLoading.value = true;
  try {
    const base = {
      Btnid: r.Btnid,
      id: r.id,
      ...(r.start_at != null && r.end_at != null
        ? { end_at: r.end_at, start_at: r.start_at }
        : {}),
    };
    if (r.eventType === 3) {
      await exportActingDataTrackingRegisterApi(base);
    } else if (r.eventType === 4) {
      await exportActingDataTrackingLoginApi(base);
    } else if (r.eventType === 5) {
      await exportActingDataTrackingDepositApi(base);
    }
    message.success('导出成功');
  } catch {
    /* 拦截器 */
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <Modal>
    <Grid>
      <template #toolbar-tools>
        <Button :loading="exportLoading" type="primary" @click="onExport"
          >导出</Button
        >
      </template>
    </Grid>
  </Modal>
</template>
