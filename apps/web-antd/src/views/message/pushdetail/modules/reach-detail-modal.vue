<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { Button, InputNumber, message, Modal, Space } from 'ant-design-vue';
import { ref, watch } from 'vue';

import type { PushReachDetailRow } from '../useApi';
import { fetchPushReachDetailListApi } from '../useApi';
import { usePushReachDetailColumns } from '../data';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  /** 对应 site_ui messagePushDetailList 的 task_id */
  taskId?: null | number;
}>();

const uidFilter = ref<number | undefined>(undefined);

const [Grid, gridApi] = useVbenVxeGrid({
  showSearchForm: false,
  formOptions: {
    schema: [],
  },
  gridOptions: {
    columns: usePushReachDetailColumns(),
    height: 360,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (props.taskId == null || !Number.isFinite(Number(props.taskId))) {
            return { items: [], page: { total: 0 }, total: 0 };
          }
          const params: Record<string, unknown> = {
            task_id: props.taskId,
            size: 1000,
          };
          if (uidFilter.value != null && Number.isFinite(uidFilter.value)) {
            params.uid = uidFilter.value;
          }
          try {
            const { list, total } = await fetchPushReachDetailListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载触达明细失败');
            return { items: [], page: { total: 0 }, total: 0 };
          }
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: false,
      refresh: false,
      search: false,
    },
  } as VxeTableGridOptions<PushReachDetailRow>,
});

watch(open, (v) => {
  if (v) {
    uidFilter.value = undefined;
    gridApi.query();
  }
});

watch(
  () => props.taskId,
  () => {
    if (open.value) {
      gridApi.query();
    }
  },
);

function searchUid() {
  gridApi.query();
}

function resetUid() {
  uidFilter.value = undefined;
  gridApi.query();
}
</script>

<template>
  <Modal
    v-model:open="open"
    destroy-on-close
    title="推送触达明细"
    width="960"
    :footer="null"
  >
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <span class="text-sm">用户ID</span>
      <InputNumber
        v-model:value="uidFilter"
        :controls="false"
        placeholder="可选"
        class="w-40"
        @press-enter="searchUid"
      />
      <Space>
        <Button size="small" type="primary" @click="searchUid">搜索</Button>
        <Button size="small" @click="resetUid">重置</Button>
      </Space>
    </div>
    <Grid />
  </Modal>
</template>
