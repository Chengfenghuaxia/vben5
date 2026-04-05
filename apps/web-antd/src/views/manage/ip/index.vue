<script lang="ts" setup>
/**
 * 系统管理 / IP 白名单 — site_ui `manage_ip` → `/manage/ip`
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { SITE_MANAGE_IP_PERM } from '#/constants/site-manage-perm';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { fetchIpListApi, ipDelApi } from '#/views/manage/ip/useApi';
import { Button, Popconfirm, message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useManageIpColumns, useManageIpGridFormSchema } from './data';
import IpAddModal from './modules/ip-add-modal.vue';

defineOptions({ name: 'ManageIp' });

const router = useRouter();
const mergedApis = computed(() => getMergedRouteApis(router));

function can(id: number) {
  return checkSiteApiPermission(id, mergedApis.value);
}

const addOpen = ref(false);

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
  if (formValues.ip != null && String(formValues.ip).trim() !== '') {
    params.ip = String(formValues.ip).trim();
  }
  return params;
}

type IpRow = Record<string, unknown> & { id?: number };

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    commonConfig: {
      componentProps: { class: 'w-full' },
    },
    schema: useManageIpGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useManageIpColumns(),
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
            const res = await fetchIpListApi(buildParams(page, formValues));
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载 IP 列表失败');
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
  } as VxeTableGridOptions<IpRow>,
});

function onRefresh() {
  void gridApi.query();
}

async function onDelete(row: IpRow) {
  try {
    await ipDelApi({ id: row.id });
    message.success('删除成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <IpAddModal v-model:open="addOpen" @success="onRefresh" />

    <Grid table-title="IP 白名单">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_MANAGE_IP_PERM.ADD"
          :disabled="!can(SITE_MANAGE_IP_PERM.ADD)"
          type="primary"
          @click="addOpen = true"
        >
          新增
        </Button>
      </template>

      <template #colOperate="{ row }">
        <Popconfirm title="确定删除吗？" @confirm="() => onDelete(row)">
          <Button
            v-site-permission="SITE_MANAGE_IP_PERM.DEL"
            :disabled="!can(SITE_MANAGE_IP_PERM.DEL)"
            danger
            size="small"
          >
            删除
          </Button>
        </Popconfirm>
      </template>
    </Grid>
  </Page>
</template>
