<script lang="ts" setup>
/**
 * 游戏分组（场馆 / 热门 / 收藏）— 对齐 site_ui `gamelist/modules/vendor-filter.vue`
 */
import { SITE_GAME_GAMELIST_PERM } from '#/constants/site-game-gamelist-perm';
import { fetchVenueAllListApi } from '../useApi';
import { onMounted, ref, watch } from 'vue';

defineOptions({ name: 'GameListVendorFilter' });

const emit = defineEmits<{
  change: [value: null | string | 'fav_list' | 'hot'];
}>();

const props = withDefaults(
  defineProps<{
    apis?: number[];
    category?: number;
    modelValue?: null | string | 'fav_list' | 'hot';
  }>(),
  {
    apis: () => [],
    category: undefined,
    modelValue: null,
  },
);

const vendors = ref<{ label: string; value: string }[]>([]);
const selectedVendor = ref<null | string>(props.modelValue ?? null);

function hasFavPermission() {
  return (
    Array.isArray(props.apis) &&
    props.apis.some((id) => Number(id) === SITE_GAME_GAMELIST_PERM.FAV_MENU)
  );
}

async function loadVendors() {
  try {
    const { list } = await fetchVenueAllListApi({});
    let vendorList = list
      .map((item) => ({
        label: item.name,
        value: item.code,
      }))
      .filter((item) => item.value !== 'history' && item.value !== 'fav');

    const hotIndex = vendorList.findIndex((v) => v.value === 'hot');
    if (hotIndex !== -1) {
      vendorList[hotIndex]!.label = '热门';
      const hotItem = vendorList.splice(hotIndex, 1)[0]!;
      vendorList.unshift(hotItem);
    }

    if (hasFavPermission()) {
      const favItem = { label: '收藏', value: 'fav_list' };
      const hotIdx = vendorList.findIndex((v) => v.value === 'hot');
      vendorList.splice(hotIdx >= 0 ? hotIdx + 1 : 1, 0, favItem);
    }

    vendors.value = vendorList;
  } catch {
    vendors.value = [];
  }
}

function handleVendorClick(vendorCode: string) {
  if (selectedVendor.value === vendorCode) {
    return;
  }
  selectedVendor.value = vendorCode;
  emit(
    'change',
    vendorCode === 'hot'
      ? 'hot'
      : vendorCode === 'fav_list'
        ? 'fav_list'
        : vendorCode,
  );
}

watch(
  () => props.modelValue,
  (v) => {
    const n = v ?? null;
    if (selectedVendor.value !== n) {
      selectedVendor.value = n;
    }
  },
  { immediate: true },
);

watch(
  () => [props.category, props.apis],
  async () => {
    await loadVendors();
    if (selectedVendor.value) {
      const exists = vendors.value.some(
        (v) => v.value === selectedVendor.value,
      );
      if (!exists) {
        selectedVendor.value = null;
        emit('change', null);
      }
    }
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  void loadVendors();
});

defineExpose({ refresh: loadVendors });
</script>

<template>
  <div
    class="vendor-filter-wrapper rounded-lg border border-[#f0f0f0] bg-white px-6 py-4 dark:border-border dark:bg-background"
  >
    <div class="flex flex-wrap items-center gap-0">
      <span class="shrink-0 pr-3 font-medium">游戏分组:</span>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="vendor in vendors"
          :key="vendor.value"
          type="button"
          class="vendor-button rounded border border-[#d9d9d9] px-4 py-2 text-sm whitespace-nowrap transition-colors outline-none hover:border-[#1890ff] hover:text-[#1890ff] dark:border-border"
          :class="{
            active: selectedVendor === vendor.value,
          }"
          @click="handleVendorClick(vendor.value)"
        >
          {{ vendor.label }}游戏
        </button>
        <span v-if="vendors.length === 0" class="text-sm text-[#999]">
          暂无场馆数据
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vendor-button.active {
  color: #fff !important;
  background: #1890ff !important;
  border-color: #1890ff !important;
}

.vendor-button.active:hover {
  color: #fff !important;
  background: #40a9ff !important;
  border-color: #40a9ff !important;
}
</style>
