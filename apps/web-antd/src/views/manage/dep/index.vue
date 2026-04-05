<script lang="ts" setup>
/**
 * 系统管理 / 部门管理 — site_ui `views/manage/dep`
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { SITE_MANAGE_DEP_PERM } from '#/constants/site-manage-perm';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { depDelApi, fetchDepListApi } from '#/views/manage/dep/useApi';
import { Button, Popconfirm, Tag, message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  manageDepStatusDisplay,
  useManageDepColumns,
  useManageDepGridFormSchema,
} from './data';
import type { ManageDepRow } from './modules/dep-modal.vue';
import DepModal from './modules/dep-modal.vue';

defineOptions({ name: 'ManageDep' });

const router = useRouter();
const mergedApis = computed(() => getMergedRouteApis(router));

function can(id: number) {
  return checkSiteApiPermission(id, mergedApis.value);
}

const modalOpen = ref(false);
const modalRow = ref<ManageDepRow | null>(null);

function buildParams(
  page: { currentPage: number; pageSize: number },
  formValues: Record<string, unknown>,
): Record<string, unknown> {
  const size = page.pageSize;
  const params: Record<string, unknown> = {
    limit: size,
    page: page.currentPage,
    size,
  };
  if (formValues.name != null && String(formValues.name).trim() !== '') {
    params.name = String(formValues.name).trim();
  }
  if (
    formValues.status !== null &&
    formValues.status !== undefined &&
    formValues.status !== ''
  ) {
    params.status = Number(formValues.status);
  }
  return params;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    commonConfig: {
      componentProps: { class: 'w-full' },
    },
    schema: useManageDepGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useManageDepColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { pageSize: 20 },
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          try {
            const res = await fetchDepListApi(buildParams(page, formValues));
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载部门列表失败');
            return { items: [], page: { total: 0 }, total: 0 };
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
  } as VxeTableGridOptions<ManageDepRow>,
});

function onRefresh() {
  void gridApi.query();
}

function openAdd() {
  modalRow.value = null;
  modalOpen.value = true;
}

function openEdit(row: ManageDepRow) {
  modalRow.value = row;
  modalOpen.value = true;
}

async function onDelete(row: ManageDepRow) {
  try {
    await depDelApi({ id: row.id });
    message.success('删除成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <DepModal v-model:open="modalOpen" :row="modalRow" @success="onRefresh" />

    <Grid table-title="部门管理">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_MANAGE_DEP_PERM.ADD"
          :disabled="!can(SITE_MANAGE_DEP_PERM.ADD)"
          type="primary"
          @click="openAdd"
        >
          新增
        </Button>
      </template>

      <template #colStatus="{ row }">
        <template
          v-for="st in [manageDepStatusDisplay(row.status)]"
          :key="`s-${row.id}`"
        >
          <Tag v-if="st" :color="st.color">{{ st.text }}</Tag>
        </template>
      </template>

      <template #colOperate="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_MANAGE_DEP_PERM.EDIT"
            :disabled="!can(SITE_MANAGE_DEP_PERM.EDIT)"
            ghost
            size="small"
            type="primary"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Popconfirm title="确定删除吗？" @confirm="() => onDelete(row)">
            <Button
              v-site-permission="SITE_MANAGE_DEP_PERM.DEL"
              :disabled="!can(SITE_MANAGE_DEP_PERM.DEL)"
              danger
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      </template>
    </Grid>
  </Page>
</template>
