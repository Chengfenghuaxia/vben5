<script lang="ts" setup>
/**
 * 日志管理 / 操作日志 — prem：`path: /log/operation`，`url: log_operation`，`component: view.log_operation`
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { siteCalendarDateRangeToUtcMillis } from '#/utils/datetime';
import { message } from 'ant-design-vue';

import type { OperationLogRow } from './useApi';
import { fetchOperationLogListApi } from './useApi';

import { useOperationLogColumns, useOperationLogGridFormSchema } from './data';

defineOptions({ name: 'LogOperation' });

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useOperationLogGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useOperationLogColumns(),
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
          };
          if (
            formValues.admin_name != null &&
            String(formValues.admin_name).trim() !== ''
          ) {
            params.admin_name = String(formValues.admin_name).trim();
          }
          if (
            formValues.module != null &&
            String(formValues.module).trim() !== ''
          ) {
            params.module = String(formValues.module).trim();
          }
          if (
            formValues.keyword != null &&
            String(formValues.keyword).trim() !== ''
          ) {
            params.keyword = String(formValues.keyword).trim();
          }
          const range = formValues.timeRange;
          if (Array.isArray(range) && range.length === 2) {
            const bounds = siteCalendarDateRangeToUtcMillis(range[0], range[1]);
            if (bounds) {
              params.start_at = bounds.start_at;
              params.end_at = bounds.end_at;
            }
          }
          try {
            const { list, total } = await fetchOperationLogListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载操作日志失败');
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
  } as VxeTableGridOptions<OperationLogRow>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="操作日志" />
  </Page>
</template>
