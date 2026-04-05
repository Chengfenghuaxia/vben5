<script lang="ts" setup>
/**
 * 财务管理 / 取现管理
 * - 业务、接口、字段：对齐 site_ui `E:\备份\游戏后台管理\site_ui\src\views\finance\Withdrawmoney`
 * - 实现：Vben `Page` + `useVbenVxeGrid` + `modules/set-range-modal.vue`
 *
 * 列表：POST /site/v1/withdrawal/way/list（site_ui GetwithdrawalList）
 * 菜单：path `/finance/withdrawmoney`，component `/finance/withdrawmoney/index`
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { SITE_FINANCE_WITHDRAWMONEY_PERM } from '#/constants/site-finance-withdrawmoney-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { Button, Switch, Tag, message } from 'ant-design-vue';
import { ref } from 'vue';

import type { WithdrawalWayRow } from './useApi';

import {
  WITHDRAWAL_WAY_METHOD_MAP,
  useWithdrawMoneyColumns,
  useWithdrawMoneyGridFormSchema,
} from './data';
import SetRangeModal from './modules/set-range-modal.vue';
import {
  fetchWithdrawalWayListApi,
  updateWithdrawalWayStatusApi,
} from './useApi';

defineOptions({ name: 'FinanceWithdrawmoney' });

const setRangeOpen = ref(false);
const setRangeRow = ref<null | WithdrawalWayRow>(null);
const statusLoadingId = ref<null | number | string>(null);

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
  if (formValues.name != null && String(formValues.name).trim() !== '') {
    params.name = String(formValues.name).trim();
  }
  if (formValues.code != null && String(formValues.code).trim() !== '') {
    params.code = String(formValues.code).trim();
  }
  return params;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
    },
    schema: useWithdrawMoneyGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useWithdrawMoneyColumns(),
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
            const res = await fetchWithdrawalWayListApi(params);
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载取现管理列表失败');
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
  } as VxeTableGridOptions<WithdrawalWayRow>,
});

function onRefresh() {
  void gridApi.query();
}

function openSetRange(row: WithdrawalWayRow) {
  setRangeRow.value = row;
  setRangeOpen.value = true;
}

function methodDisplay(row: WithdrawalWayRow) {
  if (row.method === null || row.method === undefined) {
    return null;
  }
  const n = Number(row.method);
  return (
    WITHDRAWAL_WAY_METHOD_MAP[n] ?? {
      color: 'default',
      label: '未知',
    }
  );
}

async function onStatusChange(row: WithdrawalWayRow, checked: unknown) {
  const next = Boolean(checked) ? 1 : 2;
  statusLoadingId.value = row.id;
  try {
    await updateWithdrawalWayStatusApi({ id: row.id, status: next });
    message.success('操作成功');
    onRefresh();
  } catch {
    onRefresh();
  } finally {
    statusLoadingId.value = null;
  }
}
</script>

<template>
  <Page auto-content-height>
    <SetRangeModal
      v-model:open="setRangeOpen"
      :row="setRangeRow"
      @success="onRefresh"
    />
    <Grid table-title="取现管理">
      <template #colMethod="{ row }">
        <template v-for="m in [methodDisplay(row)]" :key="`${row.id}-method`">
          <Tag v-if="m" :color="m.color">{{ m.label }}</Tag>
        </template>
      </template>
      <template #colStatus="{ row }">
        <div class="flex justify-center">
          <Switch
            :checked="row.status === 1"
            :loading="statusLoadingId === row.id"
            @change="(c) => onStatusChange(row, c)"
          />
        </div>
      </template>
      <template #colOperation="{ row }">
        <Button
          v-site-permission="SITE_FINANCE_WITHDRAWMONEY_PERM.SET_RANGE"
          size="small"
          type="link"
          @click="openSetRange(row)"
        >
          设置区间
        </Button>
      </template>
    </Grid>
  </Page>
</template>
