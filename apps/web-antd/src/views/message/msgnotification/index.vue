<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { Button, message, Popconfirm, Tag } from 'ant-design-vue';
import { ref } from 'vue';

import type { SiteNotifyRow } from './useApi';
import {
  deleteSiteNotifyApi,
  fetchSiteNotifyListApi,
} from './useApi';
import { SITE_NOTIFY_PERM } from '#/constants/site-notify-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  labelNotifyType,
  labelScene,
  labelUserType,
  statusTagProps,
  useNotifyColumns,
  useNotifyGridFormSchema,
} from './data';
import NotifyFormModal from './modules/notify-form-modal.vue';

defineOptions({ name: 'MessageMsgnotification' });

const formOpen = ref(false);
const editingRow = ref<SiteNotifyRow | null>(null);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useNotifyGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useNotifyColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {},
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const params: Record<string, unknown> = {
            page: page.currentPage,
            size: page.pageSize,
          };
          if (formValues.notify_type != null && formValues.notify_type !== '') {
            params.notify_type = Number(formValues.notify_type);
          }
          if (formValues.status != null && formValues.status !== '') {
            params.status = Number(formValues.status);
          }
          if (formValues.scene != null && formValues.scene !== '') {
            params.scene = Number(formValues.scene);
          }
          try {
            const { list, total } = await fetchSiteNotifyListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载列表失败');
            return {
              items: [],
              page: { total: 0 },
              total: 0,
            };
          }
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SiteNotifyRow>,
});

function onRefresh() {
  gridApi.query();
}

function openCreate() {
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: SiteNotifyRow) {
  editingRow.value = row;
  formOpen.value = true;
}

async function onDelete(row: SiteNotifyRow) {
  try {
    await deleteSiteNotifyApi({ id: row.id });
    message.success('已删除');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <NotifyFormModal v-model:open="formOpen" :row="editingRow" @success="onRefresh" />
    <Grid table-title="消息通知">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_NOTIFY_PERM.ADD"
          type="primary"
          @click="openCreate"
        >
          新增
        </Button>
      </template>
      <template #colNotifyType="{ row }">
        <Tag>{{ labelNotifyType(row.notify_type) }}</Tag>
      </template>
      <template #colUserType="{ row }">
        <template v-for="text in [labelUserType(row.user_type)]" :key="row.id">
          <Tag v-if="text">{{ text }}</Tag>
        </template>
      </template>
      <template #colScene="{ row }">
        <Tag>{{ labelScene(row.scene) }}</Tag>
      </template>
      <template #colStatus="{ row }">
        <Tag :color="statusTagProps(row.status).color">
          {{ statusTagProps(row.status).label }}
        </Tag>
      </template>
      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_NOTIFY_PERM.EDIT"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <span v-site-permission="SITE_NOTIFY_PERM.DEL" class="inline-flex">
            <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
              <Button danger size="small" type="link">删除</Button>
            </Popconfirm>
          </span>
        </div>
      </template>
    </Grid>
  </Page>
</template>
