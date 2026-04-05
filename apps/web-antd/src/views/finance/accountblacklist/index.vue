<script lang="ts" setup>
/**
 * 财务管理 / 账号黑名单
 * - 对齐 site_ui `views/finance/accountBlacklist`
 * - 列表：POST /site/v1/risk/account/blacklist — page、limit、size、account_no、start_at、end_at
 * - 解除：POST /site/v1/risk/account/blacklist/remove — { id }；仅 `is_site` 为真时展示按钮
 */
import type { FinanceAccountBlacklistRow } from './useApi';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import {
  fetchFinanceAccountBlacklistListApi,
  removeFinanceAccountBlacklistApi,
} from './useApi';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { siteDateTimeWallRangeToUtcMillis } from '#/utils/datetime';
import { Button, Popconfirm, Tag, message } from 'ant-design-vue';

import {
  accountBlacklistTypeLabel,
  useFinanceAccountBlacklistColumns,
  useFinanceAccountBlacklistGridFormSchema,
} from './data';

defineOptions({ name: 'FinanceAccountBlacklist' });

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
  const no = formValues.account_no;
  if (no != null && String(no).trim() !== '') {
    params.account_no = String(no).trim();
  }
  const tr = formValues.timeRange;
  if (Array.isArray(tr) && tr.length === 2) {
    const b = siteDateTimeWallRangeToUtcMillis(tr[0], tr[1]);
    if (b) {
      params.start_at = b.start_ms;
      params.end_at = b.end_ms;
    }
  }
  return params;
}

function isSiteRow(row: FinanceAccountBlacklistRow): boolean {
  const v = row.is_site;
  if (typeof v === 'boolean') {
    return v;
  }
  return Number(v) === 1;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
    },
    schema: useFinanceAccountBlacklistGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useFinanceAccountBlacklistColumns(),
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
            const res = await fetchFinanceAccountBlacklistListApi(params);
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载黑名单列表失败');
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
  } as VxeTableGridOptions<FinanceAccountBlacklistRow>,
});

async function handleRemove(id: number) {
  try {
    await removeFinanceAccountBlacklistApi({ id });
    message.success('解除黑名单成功');
    gridApi.query();
  } catch {
    message.error('解除黑名单失败');
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="黑名单列表">
      <template #colAccountType="{ row }">
        <Tag>{{ accountBlacklistTypeLabel(row.account_type) }}</Tag>
      </template>
      <template #colOperate="{ row }">
        <Popconfirm
          title="确定解除黑名单吗？"
          @confirm="handleRemove(row.id)"
        >
          <Button v-if="isSiteRow(row)" type="primary" size="small">
            解除黑名单
          </Button>
        </Popconfirm>
      </template>
    </Grid>
  </Page>
</template>
