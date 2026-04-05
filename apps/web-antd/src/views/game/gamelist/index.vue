<script lang="ts" setup>
/**
 * 游戏管理 / 游戏列表 — 对齐 site_ui `views/game/gamelist/index.vue`
 */
import type { GameListRow } from './useApi';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { SITE_GAME_GAMELIST_PERM } from '#/constants/site-game-gamelist-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { Button, Switch, message } from 'ant-design-vue';
import { computed, nextTick, onActivated, ref, shallowRef } from 'vue';
import { useRouter } from 'vue-router';

import { resolveGameAssetUrl } from './asset-url';
import { buildGameListColumns, useGameListGridFormSchema } from './data';
import type { GameListMode } from './data';
import BatchSortModal from './modules/batch-sort-modal.vue';
import SortModal from './modules/sort-modal.vue';
import VendorFilter from './modules/vendor-filter.vue';
import {
  fetchGameFavListApi,
  fetchGameHotListApi,
  fetchGameListApi,
  gameDisableBatchApi,
  updateGameHotApi,
  updateGameStatusApi,
} from './useApi';

defineOptions({ name: 'GameGamelist' });

const router = useRouter();
const mergedApis = computed(() => getMergedRouteApis(router));

const canBatchShelf = computed(() =>
  checkSiteApiPermission(
    SITE_GAME_GAMELIST_PERM.BATCH_SHELF,
    mergedApis.value,
  ),
);
const canBatchSort = computed(() =>
  checkSiteApiPermission(SITE_GAME_GAMELIST_PERM.BATCH_SORT, mergedApis.value),
);
const canRowSort = computed(() =>
  checkSiteApiPermission(SITE_GAME_GAMELIST_PERM.ROW_SORT, mergedApis.value),
);
const canStatus = computed(() =>
  checkSiteApiPermission(SITE_GAME_GAMELIST_PERM.STATUS, mergedApis.value),
);
const canHot = computed(() =>
  checkSiteApiPermission(SITE_GAME_GAMELIST_PERM.HOT, mergedApis.value),
);

const listMode = ref<GameListMode>('hot');
const venueCode = ref<null | string>(null);
const sortField = ref<string | undefined>(undefined);
const sortOrder = ref<number | undefined>(undefined);

const iconShape = ref<number | undefined>(undefined);
const lastListParams = shallowRef<Record<string, unknown>>({});
const lastPageItems = ref<GameListRow[]>([]);
const highlightPageIds = computed(() => lastPageItems.value.map((r) => r.id));

const batchLoadingUp = ref(false);
const batchLoadingDown = ref(false);
const batchDisabled = ref(true);

const statusLoadingId = ref<null | number>(null);
const hotLoadingId = ref<null | number>(null);

const sortOpen = ref(false);
const sortRow = ref<null | GameListRow>(null);

const batchSortOpen = ref(false);

const vendorFilterRef = ref<{ refresh?: () => void | Promise<void> } | null>(
  null,
);

const vendorModel = computed(() => {
  if (listMode.value === 'hot') {
    return 'hot';
  }
  if (listMode.value === 'fav') {
    return 'fav_list';
  }
  return venueCode.value;
});

function applyColumnsAndQuery() {
  sortField.value = undefined;
  sortOrder.value = undefined;
  gridApi.setGridOptions({
    columns: buildGameListColumns(listMode.value),
  });
  void nextTick(() => {
    void gridApi.query();
  });
}

function onVendorChange(v: null | 'fav_list' | 'hot' | string) {
  clearCheckbox();
  if (v === 'hot') {
    listMode.value = 'hot';
    venueCode.value = null;
  } else if (v === 'fav_list') {
    listMode.value = 'fav';
    venueCode.value = null;
  } else if (v) {
    listMode.value = 'venue';
    venueCode.value = v;
  } else {
    listMode.value = 'venue';
    venueCode.value = null;
  }
  applyColumnsAndQuery();
}

function buildListParams(
  page: { currentPage: number; pageSize: number },
  formValues: Record<string, unknown>,
): Record<string, unknown> {
  const size = page.pageSize;
  const params: Record<string, unknown> = {
    category: 5,
    limit: size,
    page: page.currentPage,
    size,
  };
  if (listMode.value === 'venue' && venueCode.value) {
    params.venue_code = venueCode.value;
  }
  for (const key of ['game_code', 'game_name'] as const) {
    const val = formValues[key];
    if (val != null && String(val).trim() !== '') {
      params[key] = String(val).trim();
    }
  }
  const st = formValues.status;
  if (st !== null && st !== undefined && st !== '') {
    params.status = Number(st);
  }
  const ih = formValues.is_hot;
  if (ih !== null && ih !== undefined && ih !== '') {
    params.is_hot = Number(ih);
  }
  if (
    listMode.value === 'fav' &&
    sortField.value &&
    sortOrder.value != null
  ) {
    params.sort_field = sortField.value;
    params.sort_order = sortOrder.value;
  }
  return params;
}

async function runListQuery(params: Record<string, unknown>) {
  if (listMode.value === 'hot') {
    return fetchGameHotListApi(params);
  }
  if (listMode.value === 'fav') {
    return fetchGameFavListApi(params);
  }
  return fetchGameListApi(params);
}

const [Grid, gridApi] = useVbenVxeGrid({
  class: 'flex min-h-0 flex-1 flex-col overflow-hidden',
  gridClass: 'game-gamelist-vxe-grid min-h-0 flex-1',
  formOptions: {
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
    },
    schema: useGameListGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridEvents: {
    checkboxAll: () => syncBatchDisabled(),
    checkboxChange: () => syncBatchDisabled(),
    sortChange: (ctx: { column: { field?: string }; order?: string }) => {
      if (listMode.value !== 'fav') {
        return;
      }
      if (ctx.column.field !== 'collections') {
        return;
      }
      if (!ctx.order) {
        sortField.value = undefined;
        sortOrder.value = undefined;
      } else {
        sortField.value = ctx.column.field;
        sortOrder.value = ctx.order === 'desc' ? 2 : 1;
      }
      void gridApi.query();
    },
  },
  gridOptions: {
    columns: buildGameListColumns('hot'),
    /** 与顶部 VendorFilter 共存时由外层 flex 撑满剩余高度，表格体内滚动 */
    height: '100%',
    keepSource: true,
    /**
     * 全局 true 时单元格 overflow:hidden + 单行，图片列会被压成一条细条（与 site_ui 完整展示不符）
     * 本页关全局，仅在需要省略的文本列上单独 showOverflow: true
     */
    showOverflow: false,
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
          lastListParams.value = { ...params };
          try {
            const res = await runListQuery(params);
            iconShape.value = res.iconShape;
            lastPageItems.value = res.list;
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载游戏列表失败');
            lastPageItems.value = [];
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
  } as VxeTableGridOptions<GameListRow>,
});

function syncBatchDisabled() {
  void nextTick(() => {
    const n = (gridApi.grid?.getCheckboxRecords?.() ?? []).length;
    batchDisabled.value = n === 0;
  });
}

function clearCheckbox() {
  const g = gridApi.grid as { clearCheckboxRow?: () => void };
  g.clearCheckboxRow?.();
  syncBatchDisabled();
}

function getCheckboxRows(): GameListRow[] {
  const grid = gridApi.grid;
  if (!grid || typeof grid.getCheckboxRecords !== 'function') {
    return [];
  }
  return grid.getCheckboxRecords() as GameListRow[];
}

function rowIconSrc(row: GameListRow) {
  const useSquareIcon = iconShape.value === 1;
  const rel = useSquareIcon
    ? row.icon
    : row.rect_icon || row.icon || '';
  return resolveGameAssetUrl(String(rel ?? ''));
}

async function onStatusChange(row: GameListRow, checked: unknown) {
  const next = Boolean(checked) ? 1 : 2;
  statusLoadingId.value = row.id;
  try {
    await updateGameStatusApi({ id: row.id, status: next });
    message.success('操作成功');
    await gridApi.query();
  } catch {
    message.error('操作失败，请重试');
    await gridApi.query();
  } finally {
    statusLoadingId.value = null;
  }
}

async function onHotChange(row: GameListRow, checked: unknown) {
  hotLoadingId.value = row.id;
  try {
    let sendVal: number;
    if (listMode.value === 'hot') {
      sendVal = 2;
    } else {
      sendVal = Boolean(checked) ? 1 : 2;
    }
    await updateGameHotApi({ id: row.id, is_hot: sendVal });
    message.success('操作成功');
    await gridApi.query();
  } catch {
    message.error('操作失败，请重试');
    await gridApi.query();
  } finally {
    hotLoadingId.value = null;
  }
}

async function gameBatch(status: number) {
  const rows = getCheckboxRows();
  const gameCodes = rows
    .map((r) => r.game_code)
    .filter((c) => c !== undefined && c !== null && String(c) !== '') as string[];
  if (gameCodes.length === 0) {
    message.warning('请先勾选游戏');
    return;
  }
  const loadingRef = status === 1 ? batchLoadingUp : batchLoadingDown;
  loadingRef.value = true;
  try {
    await gameDisableBatchApi({ game_codes: gameCodes, status });
    message.success('操作成功');
    clearCheckbox();
    await gridApi.query();
  } catch {
    /* 拦截器 */
  } finally {
    loadingRef.value = false;
  }
}

function openSort(row: GameListRow) {
  sortRow.value = row;
  sortOpen.value = true;
}

function openBatchSort() {
  batchSortOpen.value = true;
}

function onRefresh() {
  void gridApi.query();
}

onActivated(() => {
  vendorFilterRef.value?.refresh?.();
});
</script>

<template>
  <Page
    auto-content-height
    content-class="flex h-full min-h-0 flex-col gap-4"
  >
    <VendorFilter
      ref="vendorFilterRef"
      class="shrink-0"
      :apis="mergedApis"
      :model-value="vendorModel"
      @change="onVendorChange"
    />

    <SortModal
      v-model:open="sortOpen"
      :is-hot-game="listMode === 'hot'"
      :row="sortRow"
      @success="onRefresh"
    />
    <BatchSortModal
      v-model:open="batchSortOpen"
      :highlight-ids="highlightPageIds"
      :is-hot-game="listMode === 'hot'"
      :list-params="lastListParams"
      @success="onRefresh"
    />

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <Grid table-title="游戏列表">
      <template #toolbar-tools>
        <template v-if="listMode !== 'fav'">
          <Button
            v-site-permission="SITE_GAME_GAMELIST_PERM.BATCH_SHELF"
            :disabled="batchDisabled || !canBatchShelf"
            :loading="batchLoadingDown"
            class="mr-2"
            ghost
            size="small"
            type="primary"
            @click="gameBatch(2)"
          >
            批量下架
          </Button>
          <Button
            v-site-permission="SITE_GAME_GAMELIST_PERM.BATCH_SHELF"
            :disabled="batchDisabled || !canBatchShelf"
            :loading="batchLoadingUp"
            class="mr-2"
            ghost
            size="small"
            type="primary"
            @click="gameBatch(1)"
          >
            批量上架
          </Button>
          <Button
            v-site-permission="SITE_GAME_GAMELIST_PERM.BATCH_SORT"
            :disabled="!canBatchSort"
            class="mr-2"
            ghost
            size="small"
            type="primary"
            @click="openBatchSort"
          >
            批量排序
          </Button>
        </template>
      </template>

      <template #colStatus="{ row }">
        <Switch
          :checked="row.status === 1"
          :disabled="!canStatus"
          :loading="statusLoadingId === row.id"
          @change="(c) => onStatusChange(row, c)"
        />
      </template>
      <template #colIsHot="{ row }">
        <Switch
          :checked="row.is_hot === 1"
          :disabled="!canHot"
          :loading="hotLoadingId === row.id"
          @change="(c) => onHotChange(row, c)"
        />
      </template>
      <template #colOperate="{ row }">
        <Button
          v-site-permission="SITE_GAME_GAMELIST_PERM.ROW_SORT"
          :disabled="!canRowSort"
          ghost
          size="small"
          type="primary"
          @click="openSort(row)"
        >
          排序
        </Button>
      </template>
      <template #colIcon="{ row }">
        <div class="flex justify-center py-1">
          <img
            v-if="rowIconSrc(row)"
            :src="rowIconSrc(row)"
            alt=""
            class="block h-auto w-[100px] max-w-[100px] object-contain align-middle"
          />
        </div>
      </template>
    </Grid>
    </div>
  </Page>
</template>

<style scoped>
/* 插件全局 .vxe-grid { height: auto !important } 在「顶栏 + 表格」布局下会导致整页被撑高，此处强制跟随 flex 剩余高度 */
:deep(.game-gamelist-vxe-grid.vxe-grid) {
  height: 100% !important;
  min-height: 0;
  flex: 1 1 0%;
}
:deep(.game-gamelist-vxe-grid .vxe-grid--layout-wrapper) {
  min-height: 0;
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
}
:deep(.game-gamelist-vxe-grid .vxe-grid--layout-body-wrapper) {
  min-height: 0;
  flex: 1 1 0%;
  overflow: hidden;
}
:deep(.game-gamelist-vxe-grid .vxe-grid--layout-body-content-wrapper) {
  min-height: 0;
  flex: 1 1 0%;
}

/* 图片列：取消单元格单行裁切，行高随图片完整高度撑开（对齐 site_ui 列表效果） */
:deep(.game-gamelist-vxe-grid .game-gamelist-icon-cell .vxe-cell) {
  overflow: visible !important;
  white-space: normal !important;
  line-height: normal !important;
  padding-block: 8px;
}
</style>
