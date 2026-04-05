<script lang="ts" setup>
/**
 * 批量拖拽排序 — site_ui `batch-sort.vue`
 */
import type { GameListRow } from '../useApi';

import { resolveGameAssetUrl } from '../asset-url';
import {
  fetchGameHotListApi,
  fetchGameListApi,
  gameHotSortBatchApi,
  gameSortBatchApi,
} from '../useApi';
import { useSortable } from '@vben/hooks';
import { Button, Modal, Spin, message } from 'ant-design-vue';
import { nextTick, onUnmounted, ref, watch } from 'vue';

defineOptions({ name: 'GameListBatchSortModal' });

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  highlightIds?: number[];
  isHotGame?: boolean;
  /** 与列表查询一致的条件（会覆盖 page/size/limit 为大页） */
  listParams: Record<string, unknown>;
}>();

const loading = ref(false);
const submitting = ref(false);
const gameListData = ref<GameListRow[]>([]);
const listRef = ref<HTMLElement | null>(null);
const hoveredGameId = ref<null | number>(null);

let sortableInstance: null | { destroy?: () => void } = null;

function destroySortable() {
  sortableInstance?.destroy?.();
  sortableInstance = null;
}

async function fetchList() {
  loading.value = true;
  try {
    const params = {
      ...props.listParams,
      limit: 10_000,
      page: 1,
      size: 10_000,
    };
    const api = props.isHotGame ? fetchGameHotListApi : fetchGameListApi;
    const res = await api(params);
    const list = [...res.list];
    list.sort((a, b) => {
      if (a.sort != null && b.sort != null) {
        return Number(a.sort) - Number(b.sort);
      }
      if (a.sort != null) {
        return -1;
      }
      if (b.sort != null) {
        return 1;
      }
      return Number(a.id) - Number(b.id);
    });
    gameListData.value = list;
  } catch {
    message.error('获取游戏列表失败');
    gameListData.value = [];
  } finally {
    loading.value = false;
  }
}

async function initSortable() {
  destroySortable();
  await nextTick();
  const el = listRef.value;
  if (!el) {
    return;
  }
  const { initializeSortable } = useSortable(el, {
    animation: 200,
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => {
      const { oldIndex, newIndex } = evt;
      if (
        oldIndex === undefined ||
        newIndex === undefined ||
        oldIndex === newIndex
      ) {
        return;
      }
      const moved = gameListData.value.splice(oldIndex, 1)[0];
      if (moved) {
        gameListData.value.splice(newIndex, 0, moved);
      }
    },
  });
  sortableInstance = await initializeSortable();
}

function iconSrc(row: GameListRow) {
  const path = row.icon || row.rect_icon || '';
  return resolveGameAssetUrl(path);
}

function handleSetTop(gameId: number) {
  const index = gameListData.value.findIndex((g) => g.id === gameId);
  if (index <= 0) {
    return;
  }
  const game = gameListData.value[index]!;
  gameListData.value.splice(index, 1);
  gameListData.value.unshift(game);
  void nextTick(() => {
    destroySortable();
    void initSortable();
  });
}

async function onSubmit() {
  if (gameListData.value.length === 0) {
    message.warning('没有游戏数据');
    return;
  }
  submitting.value = true;
  try {
    const sortList = gameListData.value.map((game, index) => ({
      game_code: game.game_code,
      sort: index + 1,
    }));
    const api = props.isHotGame ? gameHotSortBatchApi : gameSortBatchApi;
    await api({ sort_list: sortList });
    message.success('排序成功');
    open.value = false;
    emit('success');
  } catch {
    message.error('排序失败，请重试');
  } finally {
    submitting.value = false;
  }
}

function onCancel() {
  open.value = false;
}

watch(open, async (v) => {
  if (v) {
    await fetchList();
    await nextTick();
    await initSortable();
    setTimeout(() => scrollToFirstHighlight(), 120);
  } else {
    destroySortable();
  }
});

function scrollToFirstHighlight() {
  const ids = props.highlightIds;
  if (!ids?.length || !listRef.value) {
    return;
  }
  const first = ids[0];
  const el = listRef.value.querySelector(`[data-game-id="${first}"]`);
  if (el && listRef.value) {
    const container = listRef.value;
    const elementTop = (el as HTMLElement).offsetTop;
    const ch = container.clientHeight;
    const eh = (el as HTMLElement).offsetHeight;
    if (ch > 0) {
      container.scrollTo({
        behavior: 'smooth',
        top: Math.max(0, elementTop - ch / 2 + eh / 2),
      });
    }
  }
}

onUnmounted(() => {
  destroySortable();
});
</script>

<template>
  <Modal
    v-model:open="open"
    :body-style="{ height: 'calc(70vh - 110px)', overflow: 'auto' }"
    :style="{ height: '70vh' }"
    :width="'70%'"
    destroy-on-close
    @cancel="onCancel"
  >
    <template #title>
      <div class="flex flex-wrap items-center gap-2">
        <span>游戏排序</span>
        <span class="text-xs font-normal text-[#8c8c8c]">
          下列高亮显示的游戏为当前页面展示的游戏数据
        </span>
      </div>
    </template>

    <div v-if="loading" class="py-10 text-center">
      <Spin size="large" />
    </div>
    <div
      v-else
      ref="listRef"
      class="grid max-h-[55vh] grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-4 overflow-y-auto p-4"
    >
      <div
        v-for="game in gameListData"
        :key="game.id"
        :class="{ 'highlight-game': highlightIds?.includes(game.id) }"
        :data-game-id="game.id"
        class="relative h-[100px] w-[60px] cursor-move overflow-hidden rounded border border-[#d9d9d9] transition-all dark:border-border"
        @mouseenter="
          hoveredGameId = game.id;
          ($event.currentTarget as HTMLElement).style.borderColor = '#1890ff';
        "
        @mouseleave="
          hoveredGameId = null;
          ($event.currentTarget as HTMLElement).style.borderColor =
            highlightIds?.includes(game.id) ? '#52c41a' : '#d9d9d9';
        "
      >
        <img
          :src="iconSrc(game)"
          alt=""
          class="h-[60px] w-full bg-[#f5f5f5] object-contain dark:bg-muted"
        />
        <div
          class="line-clamp-2 h-10 overflow-hidden px-1 pt-1 text-center text-[10px] leading-tight break-all"
          :title="game.game_name"
        >
          {{ game.game_name }}
        </div>
        <div
          v-if="hoveredGameId === game.id && gameListData.indexOf(game) > 0"
          class="absolute right-2 bottom-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#1890ff]/90 text-white shadow-md"
          @click.stop="handleSetTop(game.id)"
        >
          <span class="text-xs">↑</span>
        </div>
      </div>
    </div>

    <template #footer>
      <Button @click="onCancel">取消</Button>
      <Button :loading="submitting" type="primary" @click="onSubmit">
        确定
      </Button>
    </template>
  </Modal>
</template>

<style scoped>
.sortable-ghost {
  background: #f0f0f0;
  opacity: 0.5;
}

.sortable-chosen {
  cursor: move;
}

.sortable-drag {
  opacity: 0.8;
}

.highlight-game {
  background-color: #f6ffed;
  border: 2px solid #52c41a !important;
  box-shadow: 0 0 8px rgb(82 196 26 / 40%);
}
</style>
