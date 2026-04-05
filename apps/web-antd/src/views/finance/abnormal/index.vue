<script lang="ts" setup>
/**
 * 财务管理 / 异常订单
 * - 接口、列表字段、查询参数、状态文案：对齐 site_ui `E:\备份\游戏后台管理\site_ui\src\views\finance\abnormal`
 * - 架构：Vben `Page` + `useVbenVxeGrid`（site_ui 为 ATable + useTable）
 *
 * 列表：POST /site/v1/order/abnormal/list
 * 请求体：与 site_ui useTable apiParams + consumption-search 一致 — page、limit、size、uid、order_id、sn_id、method、start_time、end_time
 */
import type { FinanceAbnormalRow } from './useApi';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { fetchFinanceAbnormalListApi } from './useApi';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { siteDateTimeWallRangeToUtcMillis } from '#/utils/datetime';
import { Tag, Tooltip, message } from 'ant-design-vue';

import {
  abnormalOrderStatusDisplay,
  abnormalOrderTypeText,
  abnormalSnStatusDisplay,
  useFinanceAbnormalColumns,
  useFinanceAbnormalGridFormSchema,
} from './data';

defineOptions({ name: 'FinanceAbnormal' });

function buildListParams(
  page: { currentPage: number; pageSize: number },
  formValues: Record<string, unknown>,
): Record<string, unknown> {
  const size = page.pageSize;
  const params: Record<string, unknown> = {
    limit: size,
    page: page.currentPage,
    size,
  };
  if (formValues.uid != null && formValues.uid !== '') {
    params.uid = Number(formValues.uid);
  }
  if (
    formValues.order_id != null &&
    String(formValues.order_id).trim() !== ''
  ) {
    params.order_id = String(formValues.order_id).trim();
  }
  if (formValues.sn_id != null && String(formValues.sn_id).trim() !== '') {
    params.sn_id = String(formValues.sn_id).trim();
  }
  const method = formValues.method;
  if (
    method !== null &&
    method !== undefined &&
    method !== '' &&
    Number(method) !== 0
  ) {
    params.method = Number(method);
  }
  const createR = formValues.createTimeRange;
  if (Array.isArray(createR) && createR.length === 2) {
    const b = siteDateTimeWallRangeToUtcMillis(createR[0], createR[1]);
    if (b) {
      params.start_time = b.start_ms;
      params.end_time = b.end_ms;
    }
  }
  return params;
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
    },
    schema: useFinanceAbnormalGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useFinanceAbnormalColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      pageSize: 20,
    },
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const params = buildListParams(page, formValues);
          try {
            const res = await fetchFinanceAbnormalListApi(params);
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载异常订单列表失败');
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
  } as VxeTableGridOptions<FinanceAbnormalRow>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="异常订单列表">
      <template #colOrderType="{ row }">
        <span>{{ abnormalOrderTypeText(row.order_type) }}</span>
      </template>
      <template #colStatus="{ row }">
        <template
          v-for="st in [abnormalOrderStatusDisplay(row.order_type, row.status)]"
          :key="`s-${row.id}`"
        >
          <Tag v-if="st" :color="st.color">{{ st.text }}</Tag>
        </template>
      </template>
      <template #colSnStatus="{ row }">
        <template
          v-for="st in [abnormalSnStatusDisplay(row.order_type, row.sn_status)]"
          :key="`sn-${row.id}`"
        >
          <Tag v-if="st" :color="st.color">{{ st.text }}</Tag>
        </template>
      </template>
      <template #colParams="{ row }">
        <Tooltip
          v-if="row.params"
          placement="topLeft"
          :title="String(row.params)"
        >
          <span class="block max-w-full truncate">{{ row.params }}</span>
        </Tooltip>
        <span v-else>-</span>
      </template>
    </Grid>
  </Page>
</template>
