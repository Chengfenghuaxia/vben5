<script lang="ts" setup>
/**
 * 与 E:\备份\游戏后台管理\site_ui\src\views\finance\withdraworder\index.vue 行为、权限 id、接口一致。
 * 菜单 path 多为 `/finance/withdraworder`；prem 常下发 component `/finance/withdraworder/index`，由该目录下入口转发至本页。
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { addAccountBlacklistApi, exportFinanceWithdrawalListApi, fetchFinanceWithdrawalListApi, withdrawalRejectSuccessApi, withdrawalSuccessApi, withdrawalUnlockApi } from './useApi';
import type { FinanceWithdrawalRow } from './useApi';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { SITE_FINANCE_WITHDRAWAL_PERM } from '#/constants/site-finance-withdrawal-perm';
import { siteDateTimeWallRangeToUtcMillis } from '#/utils/datetime';
import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  Modal,
  Popconfirm,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import { nextTick, reactive, ref } from 'vue';

import FinanceDepositExportRangeModal from '../deposit/modules/export-range-modal.vue';
import FinanceDepositExportRecordModal from '../deposit/modules/export-record-modal.vue';
import ApproveLockModal from './modules/approve-lock-modal.vue';
import PayModal from './modules/pay-modal.vue';
import RefundModal from './modules/refund-modal.vue';
import RejectModal from './modules/reject-modal.vue';
import ReorderModal from './modules/reorder-modal.vue';
import {
  WITHDRAWAL_STATUS_TAG,
  useFinanceWithdrawalColumns,
  useFinanceWithdrawalGridFormSchema,
} from './data';

defineOptions({ name: 'FinanceWithdrawal' });

const stats = reactive({
  channel_fee: '' as number | string,
  fee: '' as number | string,
  success_rate: 0,
  withdrawal_amount: '' as number | string,
  withdrawal_count: 0,
  withdrawal_real_amount: '' as number | string,
  withdrawal_user: 0,
});

const lastListParams = ref<Record<string, unknown>>({});
const amountSort = ref<null | number>(null);

const exportRangeOpen = ref(false);
const exportRecordOpen = ref(false);
const exportLoading = ref(false);
const listTotal = ref(0);
/** 无勾选时禁用批量操作下拉（对齐 site_ui） */
const batchDisabled = ref(true);

const approveOpen = ref(false);
const approveLockIds = ref<(number | string)[]>([]);

const rejectOpen = ref(false);
const rejectIds = ref<(number | string)[]>([]);

const payOpen = ref(false);
const payId = ref<number | string>('');

const reorderOpen = ref(false);
const reorderId = ref<number | string>('');

const refundOpen = ref(false);
const refundId = ref<number | string>('');

const successLoadingId = ref<null | number | string>(null);

function stripPager(p: Record<string, unknown>) {
  const { limit: _l, page: _p, size: _s, amount_sort: _a, ...rest } = p;
  return rest;
}

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
  if (amountSort.value != null) {
    params.amount_sort = amountSort.value;
  }
  if (
    formValues.order_id != null &&
    String(formValues.order_id).trim() !== ''
  ) {
    params.order_id = String(formValues.order_id).trim();
  }
  if (formValues.uid != null && formValues.uid !== '') {
    params.uid = Number(formValues.uid);
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
  if (
    formValues.account_no != null &&
    String(formValues.account_no).trim() !== ''
  ) {
    params.account_no = String(formValues.account_no).trim();
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
    schema: useFinanceWithdrawalGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridEvents: {
    checkboxAll: () => syncBatchDisabledFromGrid(),
    checkboxChange: () => syncBatchDisabledFromGrid(),
    sortChange: (ctx: { column: { field?: string }; order?: string }) => {
      if (ctx.column.field === 'real_amount') {
        amountSort.value =
          ctx.order === 'desc' ? 2 : ctx.order === 'asc' ? 1 : null;
      } else {
        amountSort.value = null;
      }
      void gridApi.query();
    },
  },
  gridOptions: {
    columns: useFinanceWithdrawalColumns(),
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
            const res = await fetchFinanceWithdrawalListApi(params);
            listTotal.value = res.total;
            stats.withdrawal_user = res.withdrawal_user ?? 0;
            stats.withdrawal_count = res.withdrawal_count ?? 0;
            stats.withdrawal_amount = res.withdrawal_amount ?? 0;
            stats.withdrawal_real_amount = res.withdrawal_real_amount ?? 0;
            stats.fee = res.fee ?? 0;
            stats.channel_fee = res.channel_fee ?? 0;
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
  } as VxeTableGridOptions<FinanceWithdrawalRow>,
});

function syncBatchDisabledFromGrid() {
  void nextTick(() => {
    const n = (gridApi.grid?.getCheckboxRecords?.() ?? []).length;
    batchDisabled.value = n === 0;
  });
}

function getCheckboxIds(): number[] {
  const grid = gridApi.grid;
  if (!grid || typeof grid.getCheckboxRecords !== 'function') {
    return [];
  }
  const rows = grid.getCheckboxRecords() as FinanceWithdrawalRow[];
  return rows.map((r) => Number(r.id)).filter((id) => Number.isFinite(id));
}

function clearSelection() {
  const g = gridApi.grid as { clearCheckboxRow?: () => void };
  g.clearCheckboxRow?.();
  syncBatchDisabledFromGrid();
}

function onRefresh() {
  void gridApi.query();
}

function openExportRange() {
  exportRangeOpen.value = true;
}

async function onExportRangeSubmit(payload: { begin: number; end: number }) {
  exportLoading.value = true;
  try {
    await exportFinanceWithdrawalListApi({
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

function openApproveLock(ids: (number | string)[]) {
  approveLockIds.value = ids;
  approveOpen.value = true;
}

function onApproveLockSuccess() {
  clearSelection();
  onRefresh();
}

function openReject(ids: (number | string)[]) {
  rejectIds.value = ids;
  rejectOpen.value = true;
}

function onRejectSuccess() {
  clearSelection();
  onRefresh();
}

function batchApproveLock() {
  const ids = getCheckboxIds();
  if (ids.length === 0) {
    message.warning('请先勾选订单');
    return;
  }
  openApproveLock(ids);
}

function batchUnlock() {
  const ids = getCheckboxIds();
  if (ids.length === 0) {
    message.warning('请先勾选订单');
    return;
  }
  void unlockByIds(ids);
}

function batchReject() {
  const ids = getCheckboxIds();
  if (ids.length === 0) {
    message.warning('请先勾选订单');
    return;
  }
  openReject(ids);
}

function batchRejectSuccessOrders() {
  const ids = getCheckboxIds();
  if (ids.length === 0) {
    message.warning('请先勾选订单');
    return;
  }
  Modal.confirm({
    content: `确定对已勾选的 ${ids.length} 笔订单执行该操作吗？`,
    title: '批量拒绝成功订单',
    async onOk() {
      await withdrawalRejectSuccessApi({ ids });
      message.success('操作成功');
      clearSelection();
      onRefresh();
    },
  });
}

async function unlockByIds(ids: (number | string)[]) {
  try {
    await withdrawalUnlockApi({ ids });
    message.success('解锁订单成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

function openPay(record: FinanceWithdrawalRow) {
  payId.value = record.id;
  payOpen.value = true;
}

function openReorder(record: FinanceWithdrawalRow) {
  reorderId.value = record.id;
  reorderOpen.value = true;
}

function openRefund(record: FinanceWithdrawalRow) {
  refundId.value = record.id;
  refundOpen.value = true;
}

async function onSetSuccess(record: FinanceWithdrawalRow) {
  successLoadingId.value = record.id;
  try {
    await withdrawalSuccessApi({ order_id: record.order_id });
    message.success('已置为成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  } finally {
    successLoadingId.value = null;
  }
}

async function onAddBlacklist(id: number) {
  try {
    await addAccountBlacklistApi({ id });
    message.success('加入黑名单成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

function statusRowTag(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    return null;
  }
  return WITHDRAWAL_STATUS_TAG[n] ?? null;
}
</script>

<template>
  <Page auto-content-height>
    <FinanceDepositExportRangeModal
      v-model:open="exportRangeOpen"
      :total="listTotal"
      @submit="onExportRangeSubmit"
    />
    <FinanceDepositExportRecordModal v-model:open="exportRecordOpen" />

    <ApproveLockModal
      v-model:open="approveOpen"
      :ids="approveLockIds"
      @success="onApproveLockSuccess"
    />
    <RejectModal
      v-model:open="rejectOpen"
      :ids="rejectIds"
      @success="onRejectSuccess"
    />
    <PayModal v-model:open="payOpen" :order-id="payId" @success="onRefresh" />
    <ReorderModal
      v-model:open="reorderOpen"
      :order-id="reorderId"
      @success="onRefresh"
    />
    <RefundModal
      v-model:open="refundOpen"
      :order-id="refundId"
      @success="onRefresh"
    />

    <Grid table-title="提现订单列表">
      <template #toolbar-tools>
        <div class="mr-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span>提现人数: {{ stats.withdrawal_user }}</span>
          <span>提现笔数: {{ stats.withdrawal_count }}</span>
          <span>总提现金额: {{ stats.withdrawal_amount }}</span>
          <span>总转账金额: {{ stats.withdrawal_real_amount }}</span>
          <span>总玩家手续费: {{ stats.fee }}</span>
          <span>总三方手续费: {{ stats.channel_fee }}</span>
          <span
            >成功率:
            {{
              `${(Number.isFinite(stats.success_rate) ? stats.success_rate * 100 : 0).toFixed(2)}%`
            }}</span
          >
        </div>
        <Button class="mr-2" @click="exportRecordOpen = true">导出记录</Button>
        <Button
          :loading="exportLoading"
          class="mr-2"
          type="primary"
          ghost
          @click="openExportRange"
        >
          导出
        </Button>
        <Dropdown :disabled="batchDisabled">
          <template #overlay>
            <Menu>
              <MenuItem key="1">
                <Button
                  v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.APPROVE_LOCK"
                  :disabled="batchDisabled"
                  class="w-full"
                  type="link"
                  size="small"
                  @click="batchApproveLock"
                >
                  批量审核
                </Button>
              </MenuItem>
              <MenuItem key="2">
                <Button
                  v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.UNLOCK"
                  :disabled="batchDisabled"
                  class="w-full"
                  type="link"
                  size="small"
                  @click="batchUnlock"
                >
                  批量解锁
                </Button>
              </MenuItem>
              <MenuItem key="3">
                <Button
                  v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.REJECT"
                  :disabled="batchDisabled"
                  class="w-full"
                  type="link"
                  size="small"
                  @click="batchReject"
                >
                  批量拒绝
                </Button>
              </MenuItem>
              <MenuItem key="4">
                <Button
                  v-site-permission="
                    SITE_FINANCE_WITHDRAWAL_PERM.BATCH_REJECT_SUCCESS
                  "
                  :disabled="batchDisabled"
                  class="w-full"
                  type="link"
                  size="small"
                  @click="batchRejectSuccessOrders"
                >
                  批量拒绝成功订单
                </Button>
              </MenuItem>
            </Menu>
          </template>
          <Button type="primary" ghost class="mr-2">批量操作</Button>
        </Dropdown>
      </template>

      <template #colBlackStatus="{ row }">
        <Tag v-if="row.black_status === 2" color="error">是</Tag>
        <Tag v-else-if="row.black_status === 1" color="default">否</Tag>
        <span v-else>-</span>
      </template>

      <template #colStatus="{ row }">
        <Tag
          v-if="statusRowTag(row.status)"
          :color="statusRowTag(row.status)!.color"
        >
          {{ statusRowTag(row.status)!.text }}
        </Tag>
      </template>

      <template #colOperation="{ row }">
        <Space size="small" wrap>
          <Button
            v-if="row.status === 1"
            v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.APPROVE_LOCK"
            size="small"
            type="primary"
            ghost
            @click="openApproveLock([row.id])"
          >
            通过
          </Button>
          <Popconfirm
            v-if="row.status === 1 || row.status === 4 || row.status === 6"
            title="确定将该订单置为成功吗？"
            @confirm="onSetSuccess(row)"
          >
            <Button
              v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.SET_SUCCESS"
              size="small"
              type="primary"
              ghost
              :loading="successLoadingId === row.id"
            >
              置为成功
            </Button>
          </Popconfirm>
          <Button
            v-if="row.status === 2"
            v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.PAY"
            size="small"
            type="primary"
            ghost
            @click="openPay(row)"
          >
            代付提现
          </Button>
          <Button
            v-if="row.status === 11"
            v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.REFUND"
            size="small"
            type="primary"
            ghost
            @click="openRefund(row)"
          >
            提现退款
          </Button>
          <Button
            v-if="row.status === 6"
            v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.REORDER"
            size="small"
            type="primary"
            ghost
            @click="openReorder(row)"
          >
            重新下单
          </Button>
          <Button
            v-if="row.status === 6 || row.status === 2"
            v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.UNLOCK"
            size="small"
            type="primary"
            ghost
            @click="unlockByIds([row.id])"
          >
            解锁订单
          </Button>
          <Button
            v-if="row.status === 1 || row.status === 2 || row.status === 6"
            v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.REJECT"
            danger
            size="small"
            @click="openReject([row.id])"
          >
            拒绝
          </Button>
          <Popconfirm
            v-if="
              row.black_status === 1 && (row.status === 1 || row.status === 3)
            "
            title="确定加入黑名单吗？"
            @confirm="onAddBlacklist(row.id)"
          >
            <Button
              v-site-permission="SITE_FINANCE_WITHDRAWAL_PERM.BLACKLIST"
              danger
              size="small"
            >
              加入黑名单
            </Button>
          </Popconfirm>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
