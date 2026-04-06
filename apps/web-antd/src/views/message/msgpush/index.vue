<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { SITE_MSG_PUSH_PERM } from '#/constants/site-msg-push-perm';
import { Button, message, Popconfirm, Tag } from 'ant-design-vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import type { PushTaskRow } from './useApi';
import { deletePushTaskApi, fetchPushTaskListApi } from './useApi';
import {
  labelSendType,
  labelTaskStatus,
  taskStatusColor,
  useMsgPushColumns,
  useMsgPushGridFormSchema,
} from './data';
import PushTaskModal from './modules/push-task-modal.vue';

defineOptions({ name: 'MessageMsgpush' });

const router = useRouter();
const formOpen = ref(false);
const editingRow = ref<PushTaskRow | null>(null);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useMsgPushGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useMsgPushColumns(),
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
          if (formValues.push_type != null && formValues.push_type !== '') {
            params.push_type = Number(formValues.push_type);
          }
          if (formValues.send_type != null && formValues.send_type !== '') {
            params.send_type = Number(formValues.send_type);
          }
          try {
            const { list, total } = await fetchPushTaskListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载推送任务失败');
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
  } as VxeTableGridOptions<PushTaskRow>,
});

function onRefresh() {
  gridApi.query();
}

function openCreate() {
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: PushTaskRow) {
  editingRow.value = row;
  formOpen.value = true;
}

async function onDelete(row: PushTaskRow) {
  try {
    await deletePushTaskApi({ id: row.id });
    message.success('已删除');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

/** 与 site_ui 一致：跳转推送详情页，query 为 `id` */
function goPushDetail(row: PushTaskRow) {
  router.push({
    path: '/message/pushdetail',
    query: { id: String(row.id) },
  });
}
</script>

<template>
  <Page auto-content-height>
    <PushTaskModal
      v-model:open="formOpen"
      :row="editingRow"
      @success="onRefresh"
    />
    <Grid table-title="推送任务">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_MSG_PUSH_PERM.ADD"
          type="primary"
          @click="openCreate"
        >
          新增
        </Button>
      </template>
      <template #colNums="{ row }">
        {{ row.num ?? 0 }}/{{ row.success_num ?? 0 }}/{{ row.failed_num ?? 0 }}
      </template>
      <template #colSendType="{ row }">
        <span>
          {{ labelSendType(row.send_type) }}
          <template v-if="row.send_type === 3">
            {{ row.cycle === 1 ? '(每天)' : row.cycle === 2 ? '(每周)' : '' }}
          </template>
        </span>
      </template>
      <template #colStatus="{ row }">
        <Tag :color="taskStatusColor(row.status)">
          {{ labelTaskStatus(row.status) }}
        </Tag>
      </template>
      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button size="small" type="link" @click="goPushDetail(row)">
            详情
          </Button>
          <Button
            v-if="row.status !== 3"
            v-site-permission="SITE_MSG_PUSH_PERM.EDIT"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <span v-site-permission="SITE_MSG_PUSH_PERM.DEL" class="inline-flex">
            <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
              <Button danger size="small" type="link">删除</Button>
            </Popconfirm>
          </span>
        </div>
      </template>
    </Grid>
  </Page>
</template>
