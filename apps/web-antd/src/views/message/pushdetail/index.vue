<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { Button, message, Popconfirm, Tag } from 'ant-design-vue';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { MessagePushRow } from './useApi';
import {
  deleteMessagePushApi,
  fetchMessagePushListApi,
  updateMessagePushApi,
} from './useApi';
import {
  labelPushRecordStatus,
  pushRecordStatusColor,
  usePushDetailColumns,
  usePushDetailGridFormSchema,
} from './data';
import ReachDetailModal from './modules/reach-detail-modal.vue';

defineOptions({ name: 'MessagePushdetail' });

const route = useRoute();
const reachOpen = ref(false);
const reachTaskId = ref<null | number>(null);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: usePushDetailGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: usePushDetailColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { pageSize: 20 },
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const params: Record<string, unknown> = {
            page: page.currentPage,
            size: page.pageSize,
            limit: page.pageSize,
          };
          const qId = route.query.id;
          if (qId != null && String(qId).trim() !== '') {
            params.task_id = Number(qId);
          } else if (formValues.task_id != null && formValues.task_id !== '') {
            params.task_id = Number(formValues.task_id);
          }
          if (formValues.push_type != null && formValues.push_type !== '') {
            params.push_type = Number(formValues.push_type);
          }
          try {
            const { list, total } = await fetchMessagePushListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载推送详情失败');
            return {
              items: [],
              page: { total: 0 },
              total: 0,
            };
          }
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<MessagePushRow>,
});

watch(
  () => route.query.id,
  () => {
    gridApi.query();
  },
);

function openReach(row: MessagePushRow) {
  reachTaskId.value = row.id;
  reachOpen.value = true;
}

async function togglePause(record: MessagePushRow) {
  const next = record.status === 1 || record.status === 2 ? 3 : 2;
  try {
    await updateMessagePushApi({ id: record.id, status: next });
    message.success('操作成功');
    gridApi.query();
  } catch {
    /* 拦截器 */
  }
}

async function onDelete(row: MessagePushRow) {
  try {
    await deleteMessagePushApi({ id: row.id });
    message.success('已删除');
    gridApi.query();
  } catch {
    /* 拦截器 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <ReachDetailModal v-model:open="reachOpen" :task-id="reachTaskId" />
    <Grid table-title="推送详情列表">
      <template #colStatus="{ row }">
        <Tag :color="pushRecordStatusColor(row.status)">
          {{ labelPushRecordStatus(row.status) }}
        </Tag>
      </template>
      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button size="small" type="link" @click="openReach(row)">
            详情
          </Button>
          <Button
            v-if="row.status === 1 || row.status === 2"
            size="small"
            type="link"
            class="!text-amber-600"
            @click="togglePause(row)"
          >
            暂停
          </Button>
          <Button
            v-if="row.status === 3"
            size="small"
            type="link"
            @click="togglePause(row)"
          >
            继续
          </Button>
          <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
            <Button danger size="small" type="link">删除</Button>
          </Popconfirm>
        </div>
      </template>
    </Grid>
  </Page>
</template>
