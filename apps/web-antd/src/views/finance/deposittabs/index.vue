<script lang="ts" setup>
/**
 * 财务管理 / 充值选项 — site_ui `views/finance/deposittabs`
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { SITE_FINANCE_DEPOSIT_TABS_PERM } from '#/constants/site-finance-deposit-tabs-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { Button, Popconfirm, Switch, message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { DepositTabRow } from './useApi';

import { useDepositTabsColumns } from './data';
import DepositOptionModal from './modules/deposit-option-modal.vue';
import DepositTemplatePanel from './modules/deposit-template-panel.vue';
import {
  delDepositTabApi,
  fetchDepositTabsListApi,
  updateDepositTabApi,
} from './useApi';

defineOptions({ name: 'FinanceDeposittabs' });

const router = useRouter();
const mergedApis = computed(() => getMergedRouteApis(router));

/** 列表热门/状态开关 — 对应 `/site/v1/deposit/tabs/update`（prem 需下发 179） */
const canUpdateSwitch = computed(() =>
  checkSiteApiPermission(
    SITE_FINANCE_DEPOSIT_TABS_PERM.UPDATE,
    mergedApis.value,
  ),
);

const templateId = ref<null | number>(null);
const modalOpen = ref(false);
const modalRow = ref<DepositTabRow | null>(null);

const switchLoadingKey = ref<null | string>(null);

function onTemplateChange(id: null | number) {
  templateId.value = id;
  void gridApi.query();
}

/**
 * 与 site_ui `deposittabs` 一致：`apiParams` 默认 `template_id: 1`，面板未就绪前列表也要带参。
 * `0` 为 site 删除当前模板后的占位，需原样传递。
 */
function effectiveTemplateIdForList(): number {
  const v = templateId.value;
  if (v !== null && v !== undefined) {
    return v;
  }
  return 1;
}

function buildParams(
  page: { currentPage: number; pageSize: number },
): Record<string, unknown> {
  const size = page.pageSize;
  return {
    limit: size,
    page: page.currentPage,
    size,
    template_id: effectiveTemplateIdForList(),
  };
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDepositTabsColumns(),
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
            const res = await fetchDepositTabsListApi(buildParams(page));
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
  } as VxeTableGridOptions<DepositTabRow>,
});

function onRefresh() {
  void gridApi.query();
}

function openAdd() {
  modalRow.value = null;
  modalOpen.value = true;
}

function openEdit(row: DepositTabRow) {
  modalRow.value = row;
  modalOpen.value = true;
}

async function onDelete(row: DepositTabRow) {
  try {
    await delDepositTabApi({ id: row.id });
    message.success('删除成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

function switchBusy(row: DepositTabRow, kind: 'hot' | 'status') {
  return switchLoadingKey.value === `${row.id}-${kind}`;
}

async function onIsHotChange(row: DepositTabRow, checked: unknown) {
  const next = Boolean(checked) ? 1 : 2;
  switchLoadingKey.value = `${row.id}-hot`;
  try {
    await updateDepositTabApi({ ...row, is_hot: next });
    message.success('操作成功');
    onRefresh();
  } catch {
    onRefresh();
  } finally {
    switchLoadingKey.value = null;
  }
}

async function onStatusChange(row: DepositTabRow, checked: unknown) {
  const next = Boolean(checked) ? 1 : 2;
  switchLoadingKey.value = `${row.id}-status`;
  try {
    await updateDepositTabApi({ ...row, status: next });
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
    <DepositTemplatePanel @change="onTemplateChange" />

    <DepositOptionModal
      v-model:open="modalOpen"
      :row="modalRow"
      :template-id="templateId"
      @success="onRefresh"
    />

    <Grid table-title="充值选项">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_FINANCE_DEPOSIT_TABS_PERM.ADD"
          type="primary"
          @click="openAdd"
        >
          新增
        </Button>
      </template>
      <template #colIsHot="{ row }">
        <Switch
          :checked="(row.is_hot ?? 2) === 1"
          :disabled="!canUpdateSwitch"
          :loading="switchBusy(row, 'hot')"
          @change="(c: unknown) => onIsHotChange(row, c)"
        />
      </template>
      <template #colStatus="{ row }">
        <Switch
          :checked="(row.status ?? 2) === 1"
          :disabled="!canUpdateSwitch"
          :loading="switchBusy(row, 'status')"
          @change="(c: unknown) => onStatusChange(row, c)"
        />
      </template>
      <template #colOperate="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_FINANCE_DEPOSIT_TABS_PERM.EDIT"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
            <Button
              v-site-permission="SITE_FINANCE_DEPOSIT_TABS_PERM.DEL"
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
