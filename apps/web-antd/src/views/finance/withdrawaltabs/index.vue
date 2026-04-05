<script lang="ts" setup>
/**
 * 财务管理 / 提现选项 — site_ui `views/finance/withdrawaltabs`
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { SITE_FINANCE_WITHDRAWAL_TABS_PERM } from '#/constants/site-finance-withdrawal-tabs-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { Button, Popconfirm, Switch, message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { WithdrawalTabRow } from './useApi';

import { useWithdrawalTabsColumns } from './data';
import WithdrawalOptionModal from './modules/withdrawal-option-modal.vue';
import {
  delWithdrawalTabApi,
  fetchWithdrawalTabsListApi,
  updateWithdrawalTabApi,
} from './useApi';

defineOptions({ name: 'FinanceWithdrawaltabs' });

const router = useRouter();
const mergedApis = computed(() => getMergedRouteApis(router));

/** 列表状态开关 — 对应 `/site/v1/withdrawal/tabs/update`（prem 需下发 135） */
const canUpdateSwitch = computed(() =>
  checkSiteApiPermission(
    SITE_FINANCE_WITHDRAWAL_TABS_PERM.UPDATE,
    mergedApis.value,
  ),
);

const modalOpen = ref(false);
const modalRow = ref<WithdrawalTabRow | null>(null);
const switchLoadingKey = ref<null | string>(null);

function buildParams(page: {
  currentPage: number;
  pageSize: number;
}): Record<string, unknown> {
  const size = page.pageSize;
  return {
    limit: size,
    page: page.currentPage,
    size,
  };
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useWithdrawalTabsColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { pageSize: 20 },
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          try {
            const res = await fetchWithdrawalTabsListApi(buildParams(page));
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
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
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: false,
      zoom: true,
    },
  } as VxeTableGridOptions<WithdrawalTabRow>,
});

function onRefresh() {
  void gridApi.query();
}

function openAdd() {
  modalRow.value = null;
  modalOpen.value = true;
}

function openEdit(row: WithdrawalTabRow) {
  modalRow.value = row;
  modalOpen.value = true;
}

async function onDelete(row: WithdrawalTabRow) {
  try {
    await delWithdrawalTabApi({ id: row.id });
    message.success('删除成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

function switchBusy(row: WithdrawalTabRow) {
  return switchLoadingKey.value === String(row.id);
}

async function onStatusChange(row: WithdrawalTabRow, checked: unknown) {
  const next = Boolean(checked) ? 1 : 2;
  switchLoadingKey.value = String(row.id);
  try {
    await updateWithdrawalTabApi({ ...row, status: next });
    message.success('操作成功');
    onRefresh();
  } catch {
    onRefresh();
  } finally {
    switchLoadingKey.value = null;
  }
}
</script>

<template>
  <Page auto-content-height>
    <WithdrawalOptionModal
      v-model:open="modalOpen"
      :row="modalRow"
      @success="onRefresh"
    />

    <Grid table-title="提现选项">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_FINANCE_WITHDRAWAL_TABS_PERM.ADD"
          type="primary"
          @click="openAdd"
        >
          新增
        </Button>
      </template>
      <template #colStatus="{ row }">
        <Switch
          :checked="(row.status ?? 2) === 1"
          :disabled="!canUpdateSwitch"
          :loading="switchBusy(row)"
          @change="(c: unknown) => onStatusChange(row, c)"
        />
      </template>
      <template #colOperate="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_FINANCE_WITHDRAWAL_TABS_PERM.EDIT"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
            <Button
              v-site-permission="SITE_FINANCE_WITHDRAWAL_TABS_PERM.DEL"
              danger
              size="small"
              type="link"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      </template>
    </Grid>
  </Page>
</template>
