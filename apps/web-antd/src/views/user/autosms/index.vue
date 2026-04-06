<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { SITE_USER_AUTOSMS_PERM } from '#/constants/site-user-autosms-perm';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { Button, message, Switch } from 'ant-design-vue';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import type { SmsTaskRow } from './useApi';
import { fetchSmsTaskListApi, updateSmsTaskStatusApi } from './useApi';
import { useAutoSmsColumns } from './data';
import AutoSmsModal from './modules/auto-sms-modal.vue';
import SmsChannelModal from './modules/sms-channel-modal.vue';
import SmsSummaryBar from './modules/sms-summary-bar.vue';

defineOptions({ name: 'UserAutosms' });

const router = useRouter();

const dateType = ref(1);
const summaryBarRef = ref<InstanceType<typeof SmsSummaryBar> | null>(null);
const channelOpen = ref(false);

const formOpen = ref(false);
const modalType = ref<'add' | 'edit'>('add');
const editingRow = ref<SmsTaskRow | null>(null);

const canSwitchStatus = computed(() =>
  checkSiteApiPermission(
    SITE_USER_AUTOSMS_PERM.STATUS_SWITCH,
    getMergedRouteApis(router),
    'any',
  ),
);

const [Grid, gridApi] = useVbenVxeGrid({
  class: 'flex min-h-0 flex-1 flex-col overflow-hidden',
  gridClass: 'user-autosms-vxe-grid min-h-0 flex-1',
  showSearchForm: false,
  formOptions: {
    schema: [],
  },
  gridOptions: {
    columns: useAutoSmsColumns(),
    /** 顶部汇总区占用高度后，由外层 flex 分配剩余空间，表格体内滚动 */
    height: '100%',
    keepSource: true,
    pagerConfig: { pageSize: 20 },
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          const params: Record<string, unknown> = {
            page: page.currentPage,
            size: page.pageSize,
            limit: page.pageSize,
            date_type: dateType.value,
          };
          try {
            const { list, total } = await fetchSmsTaskListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载自动短信失败');
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
  } as VxeTableGridOptions<SmsTaskRow>,
  gridEvents: {
    toolbarToolClick(e: { code: string }) {
      if (e.code === 'reload') {
        summaryBarRef.value?.reloadAll();
      }
    },
  },
});

watch(dateType, () => {
  gridApi.query();
});

function onRefresh() {
  gridApi.query();
  summaryBarRef.value?.reloadAll();
}

function openEdit(row: SmsTaskRow) {
  modalType.value = 'edit';
  editingRow.value = row;
  formOpen.value = true;
}

function isRowIncomplete(row: SmsTaskRow): boolean {
  if (row.mode == null) {
    return true;
  }
  const need = ['config_id', 'start_time', 'end_time', 'content'] as const;
  return need.some((k) => {
    const v = row[k];
    return v === '' || v == null;
  });
}

function successRateText(row: SmsTaskRow) {
  const sub = Number(row.submit_num);
  const suc = Number(row.success_num);
  if (!sub || !Number.isFinite(sub)) {
    return '0%';
  }
  return `${((suc / sub) * 100).toFixed(2)}%`;
}

async function onStatusChange(row: SmsTaskRow, checked: boolean) {
  const target = checked ? 1 : 2;
  if (target === 1 && row.status === 2 && isRowIncomplete(row)) {
    message.warning('请先补全通道、时间段与短信内容');
    openEdit(row);
    return;
  }
  try {
    await updateSmsTaskStatusApi({ id: row.id, status: target });
    message.success('操作成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

function onChannelSaved() {
  summaryBarRef.value?.reloadBalance();
}
</script>

<template>
  <Page auto-content-height content-class="flex h-full min-h-0 flex-col gap-4">
    <SmsSummaryBar
      ref="summaryBarRef"
      class="shrink-0"
      v-model:date-type="dateType"
      @open-channel="channelOpen = true"
    />
    <SmsChannelModal v-model:open="channelOpen" @success="onChannelSaved" />
    <AutoSmsModal
      v-model:open="formOpen"
      :opentype="modalType"
      :row="editingRow"
      @success="onRefresh"
    />
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Grid table-title="自动短信">
        <template #colSuccessRate="{ row }">
          {{ successRateText(row) }}
        </template>
        <template #colStatus="{ row }">
          <Switch
            :checked="row.status === 1"
            :disabled="!canSwitchStatus"
            checked-children="开"
            un-checked-children="关"
            @change="
              (c: boolean | string | number) =>
                onStatusChange(row, c === true || c === 1)
            "
          />
        </template>
        <template #colOperation="{ row }">
          <Button
            v-site-permission="SITE_USER_AUTOSMS_PERM.OPERATE"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            操作
          </Button>
        </template>
      </Grid>
    </div>
  </Page>
</template>

<style scoped>
/* 顶栏汇总 + 表格：让 vxe 占满 flex 剩余高度，表格体内滚动，避免整页被撑出滚动条 */
:deep(.user-autosms-vxe-grid.vxe-grid) {
  flex: 1 1 0%;
  height: 100% !important;
  min-height: 0;
}

:deep(.user-autosms-vxe-grid .vxe-grid--layout-wrapper) {
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
  min-height: 0;
}

:deep(.user-autosms-vxe-grid .vxe-grid--layout-body-wrapper) {
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
}

:deep(.user-autosms-vxe-grid .vxe-grid--layout-body-content-wrapper) {
  flex: 1 1 0%;
  min-height: 0;
}
</style>
