<script lang="ts" setup>
/**
 * 财务管理 / 充值订单 — 接口与字段对齐 site_ui `finance/deposit`，实现为 Vben Grid + Modal。
 * 菜单：`component: /finance/deposit/index`，`path: /finance/deposit`，`name: FinanceDeposit`
 */
import type { FinanceDepositRow } from '#/api/core/finance-deposit';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import {
  exportFinanceDepositListApi,
  fetchFinanceDepositListApi,
} from '#/api/core/finance-deposit';
import { SITE_FINANCE_DEPOSIT_PERM } from '#/constants/site-finance-deposit-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { siteDateTimeWallRangeToUtcMillis } from '#/utils/datetime';
import { Button, message, Tag } from 'ant-design-vue';
import { reactive, ref } from 'vue';

import {
  useFinanceDepositColumns,
  useFinanceDepositGridFormSchema,
} from './data';
import FinanceDepositCreateOrderModal from './modules/create-order-modal.vue';
import FinanceDepositExportRangeModal from './modules/export-range-modal.vue';
import FinanceDepositExportRecordModal from './modules/export-record-modal.vue';
import FinanceDepositSetSuccessModal from './modules/set-success-modal.vue';

defineOptions({ name: 'FinanceDeposit' });

const stats = reactive({
  deposit_amount: '' as number | string,
  deposit_count: 0,
  deposit_user: 0,
  fee: '' as number | string,
  success_rate: 0,
});

const lastListParams = ref<Record<string, unknown>>({});

const setSuccessOpen = ref(false);
const setSuccessRow = ref<FinanceDepositRow | null>(null);

const createOpen = ref(false);
const exportRangeOpen = ref(false);
const exportRecordOpen = ref(false);
const exportLoading = ref(false);
const listTotal = ref(0);

function stripPager(p: Record<string, unknown>) {
  const { limit: _l, page: _p, size: _s, ...rest } = p;
  return rest;
}

function buildListParams(
  page: { currentPage: number; pageSize: number },
  formValues: Record<string, unknown>,
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    page: page.currentPage,
    size: page.pageSize,
  };
  if (
    formValues.order_id != null &&
    String(formValues.order_id).trim() !== ''
  ) {
    params.order_id = String(formValues.order_id).trim();
  }
  if (formValues.uid != null && formValues.uid !== '') {
    params.uid = Number(formValues.uid);
  }
  if (Array.isArray(formValues.team_ids) && formValues.team_ids.length > 0) {
    params.team_ids = formValues.team_ids;
  }
  if (Array.isArray(formValues.agent_ids) && formValues.agent_ids.length > 0) {
    params.agent_ids = formValues.agent_ids;
  }
  if (formValues.sn_id != null && String(formValues.sn_id).trim() !== '') {
    params.sn_id = String(formValues.sn_id).trim();
  }
  if (formValues.status != null && formValues.status !== '') {
    params.status = Number(formValues.status);
  }
  const createR = formValues.createTimeRange;
  if (Array.isArray(createR) && createR.length === 2) {
    const b = siteDateTimeWallRangeToUtcMillis(createR[0], createR[1]);
    if (b) {
      params.start_time = b.start_ms;
      params.end_time = b.end_ms;
    }
  }
  const updateR = formValues.updateTimeRange;
  if (Array.isArray(updateR) && updateR.length === 2) {
    const b = siteDateTimeWallRangeToUtcMillis(updateR[0], updateR[1]);
    if (b) {
      params.start_at = b.start_ms;
      params.end_at = b.end_ms;
    }
  }
  if (formValues.channel != null && String(formValues.channel) !== '') {
    params.channel = formValues.channel;
  }
  if (formValues.template_id != null && formValues.template_id !== '') {
    params.template_id = Number(formValues.template_id);
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
    schema: useFinanceDepositGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useFinanceDepositColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {},
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const params = buildListParams(page, formValues);
          lastListParams.value = params;
          try {
            const res = await fetchFinanceDepositListApi(params);
            listTotal.value = res.total;
            stats.deposit_user = res.deposit_user ?? 0;
            stats.deposit_count = res.deposit_count ?? 0;
            stats.deposit_amount = res.deposit_amount ?? 0;
            stats.fee = res.fee ?? 0;
            const sr = res.success_rate;
            stats.success_rate =
              typeof sr === 'number' && Number.isFinite(sr)
                ? sr
                : Number(sr) || 0;
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
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<FinanceDepositRow>,
});

function onRefresh() {
  gridApi.query();
}

function openSetSuccess(row: FinanceDepositRow) {
  setSuccessRow.value = row;
  setSuccessOpen.value = true;
}

function openExportRange() {
  exportRangeOpen.value = true;
}

async function onExportRangeSubmit(payload: { begin: number; end: number }) {
  exportLoading.value = true;
  try {
    await exportFinanceDepositListApi({
      ...stripPager(lastListParams.value),
      begin: payload.begin,
      end: payload.end,
    });
    message.success('导出任务已提交');
    exportRecordOpen.value = true;
  } catch {
    /* 拦截器 */
  } finally {
    exportLoading.value = false;
  }
}

const giftTag = (v: unknown) => {
  if (v === 1) {
    return { color: 'success' as const, text: '赠送' };
  }
  if (v === 2) {
    return { color: 'error' as const, text: '不赠送' };
  }
  return null;
};

const statusTag = (v: unknown) => {
  const m: Record<number, { color: string; text: string }> = {
    1: { color: 'processing', text: '待支付' },
    2: { color: 'success', text: '已成功' },
    3: { color: 'error', text: '已失败' },
    4: { color: 'warning', text: '已取消' },
    5: { color: 'default', text: '已补单' },
    6: { color: 'orange', text: '部分支付' },
  };
  const n = Number(v);
  return Number.isFinite(n) ? m[n] : undefined;
};
</script>

<template>
  <Page auto-content-height>
    <FinanceDepositSetSuccessModal
      v-model:open="setSuccessOpen"
      :row="setSuccessRow"
      @success="onRefresh"
    />
    <FinanceDepositCreateOrderModal
      v-model:open="createOpen"
      @success="onRefresh"
    />
    <FinanceDepositExportRangeModal
      v-model:open="exportRangeOpen"
      :total="listTotal"
      @submit="onExportRangeSubmit"
    />
    <FinanceDepositExportRecordModal v-model:open="exportRecordOpen" />

    <Grid table-title="充值订单列表">
      <template #toolbar-tools>
        <div class="mr-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span>充值人数: {{ stats.deposit_user }}</span>
          <span>充值笔数: {{ stats.deposit_count }}</span>
          <span>总充值金额: {{ stats.deposit_amount }}</span>
          <span>总手续费: {{ stats.fee }}</span>
          <span
            >成功率:
            {{
              `${(Number.isFinite(stats.success_rate) ? stats.success_rate * 100 : 0).toFixed(2)}%`
            }}</span
          >
        </div>
        <Button class="mr-2" @click="exportRecordOpen = true">导出记录</Button>
        <Button
          v-site-permission="SITE_FINANCE_DEPOSIT_PERM.CREATE_ORDER"
          class="mr-2"
          type="primary"
          @click="createOpen = true"
        >
          创建订单
        </Button>
        <Button
          v-site-permission="SITE_FINANCE_DEPOSIT_PERM.EXPORT"
          :loading="exportLoading"
          type="primary"
          ghost
          @click="openExportRange"
        >
          导出
        </Button>
      </template>

      <template #colGiftStatus="{ row }">
        <Tag
          v-if="giftTag(row.gift_status)"
          :color="giftTag(row.gift_status)!.color"
        >
          {{ giftTag(row.gift_status)!.text }}
        </Tag>
      </template>

      <template #colStatus="{ row }">
        <Tag v-if="statusTag(row.status)" :color="statusTag(row.status)!.color">
          {{ statusTag(row.status)!.text }}
        </Tag>
      </template>

      <template #colOperation="{ row }">
        <Button
          v-if="row.status === 1 || row.status === 4"
          v-site-permission="SITE_FINANCE_DEPOSIT_PERM.SET_SUCCESS"
          size="small"
          type="link"
          @click="openSetSuccess(row)"
        >
          设置成功
        </Button>
      </template>
    </Grid>
  </Page>
</template>
