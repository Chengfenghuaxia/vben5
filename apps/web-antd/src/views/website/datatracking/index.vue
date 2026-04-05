<script lang="ts" setup>
/**
 * 对应后端菜单 `component: /website/datatracking/index`，`path: /website/datatracking`
 * 与 site_ui `views/website/dataTracking` 路径一致
 */
import type { ActingDataTrackingRow } from './useApi';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import {
  deleteActingDataTrackingApi,
  fetchActingDataTrackingListApi,
} from './useApi';
import { SITE_DATA_TRACKING_PERM } from '#/constants/site-data-tracking-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { siteCalendarDateRangeToUtcMillis } from '#/utils/datetime';
import { Button, message, Popconfirm } from 'ant-design-vue';
import { ref } from 'vue';

import {
  useWebsiteDatatrackingColumns,
  useWebsiteDatatrackingGridFormSchema,
} from './data';
import WebsiteDatatrackingDetailModal from './modules/detail-modal.vue';
import type { WebsiteDatatrackingDetailPayload } from './modules/detail-modal.vue';
import WebsiteDatatrackingFormModal from './modules/form-modal.vue';

defineOptions({ name: 'WebsiteDatatracking' });

const formOpen = ref(false);
const editingRow = ref<null | ActingDataTrackingRow>(null);

const detailOpen = ref(false);
const detailRow = ref<null | WebsiteDatatrackingDetailPayload>(null);

/** 与 site_ui 一致：详情接口要带列表筛选项里的统计时间 */
const lastQueryRange = ref<{ end_at?: number; start_at?: number }>({});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useWebsiteDatatrackingGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useWebsiteDatatrackingColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {},
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
            formValues.name != null &&
            String(formValues.name).trim() !== ''
          ) {
            params.name = String(formValues.name).trim();
          }
          if (formValues.url != null && String(formValues.url).trim() !== '') {
            params.url = String(formValues.url).trim();
          }
          const range = formValues.statRange;
          lastQueryRange.value = {};
          if (Array.isArray(range) && range.length === 2) {
            const bounds = siteCalendarDateRangeToUtcMillis(range[0], range[1]);
            if (bounds) {
              params.start_at = bounds.start_at;
              params.end_at = bounds.end_at;
              lastQueryRange.value = bounds;
            }
          }
          try {
            const { list, total } =
              await fetchActingDataTrackingListApi(params);
            return {
              items: list,
              page: { total },
              total,
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
  } as VxeTableGridOptions<ActingDataTrackingRow>,
});

function onRefresh() {
  gridApi.query();
}

function openCreate() {
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: ActingDataTrackingRow) {
  editingRow.value = row;
  formOpen.value = true;
}

async function onDelete(row: ActingDataTrackingRow) {
  try {
    await deleteActingDataTrackingApi({ id: row.id });
    message.success('已删除');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

async function copyUrl(text: string | undefined) {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制');
  } catch {
    message.error('复制失败');
  }
}

function openDetail(
  row: ActingDataTrackingRow,
  eventType: number,
  Btnid: number,
) {
  detailRow.value = {
    ...row,
    Btnid,
    eventType,
    start_at: lastQueryRange.value.start_at,
    end_at: lastQueryRange.value.end_at,
  };
  detailOpen.value = true;
}

function statClickable(n: unknown) {
  return typeof n === 'number' && n > 0;
}
</script>

<template>
  <Page auto-content-height>
    <WebsiteDatatrackingFormModal
      v-model:open="formOpen"
      :row="editingRow"
      @success="onRefresh"
    />
    <WebsiteDatatrackingDetailModal
      v-model:open="detailOpen"
      :row="detailRow"
    />

    <Grid table-title="数据埋点">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_DATA_TRACKING_PERM.ADD"
          type="primary"
          @click="openCreate"
        >
          新增
        </Button>
      </template>

      <template #colUrl="{ row }">
        <div class="flex items-center justify-center gap-2">
          <span class="max-w-[220px] truncate">{{ row.url }}</span>
          <Button
            v-if="row.url"
            class="shrink-0 px-1"
            size="small"
            type="link"
            @click="copyUrl(row.url)"
          >
            复制
          </Button>
        </div>
      </template>

      <template #colRegister="{ row }">
        <span
          :class="
            statClickable(row.register)
              ? 'cursor-pointer text-[#2395f1]'
              : 'text-[var(--ant-color-text-secondary)]'
          "
          @click="
            statClickable(row.register)
              ? openDetail(row, 3, SITE_DATA_TRACKING_PERM.EXPORT_REGISTER)
              : undefined
          "
        >
          {{ row.register ?? 0 }}
        </span>
      </template>

      <template #colLogin="{ row }">
        <span
          :class="
            statClickable(row.login)
              ? 'cursor-pointer text-[#2395f1]'
              : 'text-[var(--ant-color-text-secondary)]'
          "
          @click="
            statClickable(row.login)
              ? openDetail(row, 4, SITE_DATA_TRACKING_PERM.EXPORT_LOGIN)
              : undefined
          "
        >
          {{ row.login ?? 0 }}
        </span>
      </template>

      <template #colDeposit="{ row }">
        <span
          :class="
            statClickable(row.deposit)
              ? 'cursor-pointer text-[#2395f1]'
              : 'text-[var(--ant-color-text-secondary)]'
          "
          @click="
            statClickable(row.deposit)
              ? openDetail(row, 5, SITE_DATA_TRACKING_PERM.EXPORT_DEPOSIT)
              : undefined
          "
        >
          {{ row.deposit ?? 0 }}
        </span>
      </template>

      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_DATA_TRACKING_PERM.EDIT"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <span
            v-site-permission="SITE_DATA_TRACKING_PERM.DELETE"
            class="inline-flex"
          >
            <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
              <Button danger size="small" type="link">删除</Button>
            </Popconfirm>
          </span>
        </div>
      </template>
    </Grid>
  </Page>
</template>
