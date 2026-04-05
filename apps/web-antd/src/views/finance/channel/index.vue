<script lang="ts" setup>
/**
 * 财务管理 / 渠道列表
 * - 业务与接口：site_ui `views/finance/channel`、`service/api/channel.ts`
 * - 通道配置：按 `code` 打开对应子表单（与 site_ui `changehandecpnfig` 一致）
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { SITE_FINANCE_CHANNEL_PERM } from '#/constants/site-finance-channel-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { Button, Switch, Tag, message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { FinChannelConfigCode } from './modules/config/codes';
import type { FinChannelRow } from './useApi';

import {
  CHANNEL_MODE_TAG,
  useFinanceChannelColumns,
  useFinanceChannelGridFormSchema,
} from './data';
import { isFinChannelConfigCode } from './modules/config/codes';
import ChannelConfigModals from './modules/channel-config-modals.vue';
import PayWeightModal from './modules/pay-weight-modal.vue';
import {
  fetchFinChannelListApi,
  updateFinChannelPayInStatusApi,
  updateFinChannelPayOutStatusApi,
} from './useApi';

defineOptions({ name: 'FinanceChannel' });

const router = useRouter();
const mergedApis = computed(() => getMergedRouteApis(router));
const canPayInSwitch = computed(() =>
  checkSiteApiPermission(
    SITE_FINANCE_CHANNEL_PERM.PAY_IN_STATUS,
    mergedApis.value,
  ),
);
const canPayOutSwitch = computed(() =>
  checkSiteApiPermission(
    SITE_FINANCE_CHANNEL_PERM.PAY_OUT_STATUS,
    mergedApis.value,
  ),
);

const payWeightOpen = ref(false);
const payWeightType = ref<'in' | 'out'>('in');
const payWeightRow = ref<null | FinChannelRow>(null);

const configOpen = ref(false);
const configCode = ref<FinChannelConfigCode | null>(null);

const statusLoadingKey = ref<null | string>(null);

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
  const mode = formValues.mode;
  if (mode !== null && mode !== undefined && mode !== '' && Number(mode) !== 0) {
    params.mode = Number(mode);
  }
  for (const key of ['status', 'pay_in_status', 'pay_out_status'] as const) {
    const v = formValues[key];
    if (v !== null && v !== undefined && v !== '') {
      params[key] = Number(v);
    }
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
    schema: useFinanceChannelGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useFinanceChannelColumns(),
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
            const res = await fetchFinChannelListApi(
              buildListParams(page, formValues),
            );
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载渠道列表失败');
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
  } as VxeTableGridOptions<FinChannelRow>,
});

function onRefresh() {
  void gridApi.query();
}

function modeTag(row: FinChannelRow) {
  if (row.mode === null || row.mode === undefined) {
    return null;
  }
  const n = Number(row.mode);
  return CHANNEL_MODE_TAG[n] ?? null;
}

function openPayWeight(row: FinChannelRow, type: 'in' | 'out') {
  payWeightRow.value = row;
  payWeightType.value = type;
  payWeightOpen.value = true;
}

function openConfig(row: FinChannelRow) {
  const code =
    row.code != null && String(row.code).trim() !== ''
      ? String(row.code).trim()
      : '';
  if (!isFinChannelConfigCode(code)) {
    message.warning('该通道暂不支持可视化配置');
    return;
  }
  configCode.value = code;
  configOpen.value = true;
}

function statusLoading(row: FinChannelRow, kind: 'in' | 'out') {
  return statusLoadingKey.value === `${row.id}-${kind}`;
}

async function onPayInChange(row: FinChannelRow, checked: unknown) {
  const next = Boolean(checked) ? 1 : 2;
  statusLoadingKey.value = `${row.id}-in`;
  try {
    await updateFinChannelPayInStatusApi({ id: row.id, status: next });
    message.success('操作成功');
    onRefresh();
  } catch {
    onRefresh();
  } finally {
    statusLoadingKey.value = null;
  }
}

async function onPayOutChange(row: FinChannelRow, checked: unknown) {
  const next = Boolean(checked) ? 1 : 2;
  statusLoadingKey.value = `${row.id}-out`;
  try {
    await updateFinChannelPayOutStatusApi({ id: row.id, status: next });
    message.success('操作成功');
    onRefresh();
  } catch {
    onRefresh();
  } finally {
    statusLoadingKey.value = null;
  }
}
</script>

<template>
  <Page auto-content-height>
    <PayWeightModal
      v-model:open="payWeightOpen"
      :row="payWeightRow"
      :type="payWeightType"
      @success="onRefresh"
    />
    <ChannelConfigModals
      v-model:open="configOpen"
      :row-code="configCode"
      @success="onRefresh"
    />

    <Grid table-title="渠道列表">
      <template #colMode="{ row }">
        <template v-for="m in [modeTag(row)]" :key="`${row.id}-mode`">
          <Tag v-if="m" :color="m.color">{{ m.text }}</Tag>
        </template>
      </template>
      <template #colPayIn="{ row }">
        <div class="flex items-center justify-center gap-1">
          <Switch
            :checked="(row.pay_in_status ?? 2) === 1"
            :disabled="!canPayInSwitch"
            :loading="statusLoading(row, 'in')"
            @change="(c) => onPayInChange(row, c)"
          />
          <span>/ {{ row.pay_in_weight ?? 0 }}%</span>
        </div>
      </template>
      <template #colPayOut="{ row }">
        <div class="flex items-center justify-center gap-1">
          <Switch
            :checked="(row.pay_out_status ?? 2) === 1"
            :disabled="!canPayOutSwitch"
            :loading="statusLoading(row, 'out')"
            @change="(c) => onPayOutChange(row, c)"
          />
          <span>/ {{ row.pay_out_weight ?? 0 }}%</span>
        </div>
      </template>
      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_FINANCE_CHANNEL_PERM.CONFIG"
            size="small"
            type="link"
            @click="openConfig(row)"
          >
            通道配置
          </Button>
          <Button
            v-site-permission="SITE_FINANCE_CHANNEL_PERM.PAY_OUT_WEIGHT"
            :disabled="(row.pay_out_status ?? 2) !== 1"
            size="small"
            type="link"
            @click="openPayWeight(row, 'out')"
          >
            代付权重
          </Button>
          <Button
            v-site-permission="SITE_FINANCE_CHANNEL_PERM.PAY_IN_WEIGHT"
            :disabled="(row.pay_in_status ?? 2) !== 1"
            size="small"
            type="link"
            @click="openPayWeight(row, 'in')"
          >
            代收权重
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
