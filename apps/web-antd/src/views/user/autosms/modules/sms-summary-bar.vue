<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';
import { Button } from 'ant-design-vue';
import { computed, onMounted, ref, watch } from 'vue';

import { SITE_USER_AUTOSMS_PERM } from '#/constants/site-user-autosms-perm';

import {
  fetchSmsBalanceApi,
  fetchSmsRecordApi,
  refreshSmsBalanceApi,
  smsBalanceToRemainingCount,
} from '../useApi';

const dateType = defineModel<number>('dateType', { default: 1 });

const emit = defineEmits<{
  openChannel: [];
}>();

const DATE_BTNS = [
  { name: '今日', value: 1 },
  { name: '昨日', value: 2 },
  { name: '本周', value: 3 },
  { name: '本月', value: 4 },
  { name: '累计', value: 0 },
];

const record = ref({
  submit_num: 0,
  success_num: 0,
  fail_num: 0,
});

const balanceRemaining = ref(0);
const balanceLoading = ref(false);

const successRateText = computed(() => {
  if (!record.value.success_num || !record.value.submit_num) {
    return '0%';
  }
  return `${((record.value.success_num / record.value.submit_num) * 100).toFixed(2)}%`;
});

async function loadRecord(dt: number) {
  try {
    const r = await fetchSmsRecordApi({ date_type: dt });
    record.value = {
      submit_num: r.submit_num,
      success_num: r.success_num,
      fail_num: r.fail_num,
    };
  } catch {
    record.value = { submit_num: 0, success_num: 0, fail_num: 0 };
  }
}

async function loadBalance() {
  try {
    const p = await fetchSmsBalanceApi();
    balanceRemaining.value = smsBalanceToRemainingCount(p);
  } catch {
    balanceRemaining.value = 0;
  }
}

async function onRefreshBalance() {
  balanceLoading.value = true;
  try {
    const p = await refreshSmsBalanceApi();
    balanceRemaining.value = smsBalanceToRemainingCount(p);
  } catch {
    balanceRemaining.value = 0;
  } finally {
    balanceLoading.value = false;
  }
}

function onPickDate(item: (typeof DATE_BTNS)[number]) {
  dateType.value = item.value;
}

watch(dateType, (dt) => {
  void loadRecord(dt);
});

onMounted(() => {
  void loadRecord(dateType.value);
  void loadBalance();
});

defineExpose({
  reloadRecord: () => loadRecord(dateType.value),
  reloadBalance: loadBalance,
  reloadAll() {
    void loadRecord(dateType.value);
    void loadBalance();
  },
});
</script>

<template>
  <div
    v-site-permission="SITE_USER_AUTOSMS_PERM.SUMMARY_BLOCK"
    class="flex flex-col gap-4"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-[#f4f4f7] to-[#e6e9f0] p-4 shadow-md"
    >
      <div class="flex min-w-0 flex-1 flex-wrap gap-3">
        <button
          v-for="item in DATE_BTNS"
          :key="item.value"
          type="button"
          class="min-w-[120px] rounded-lg border-2 border-[#6c7bff] px-4 py-2 text-base font-medium text-[#4058f4] transition hover:bg-[#6c7bff]/10"
          :class="{
            'border-transparent bg-gradient-to-br from-[#6c7bff] to-[#4058f4] text-white shadow-md':
              item.value === dateType,
          }"
          @click="onPickDate(item)"
        >
          {{ item.name }}
        </button>
      </div>

      <div
        class="flex min-w-[200px] flex-shrink-0 items-center justify-center gap-3 rounded-lg bg-[#f8f8fa] px-4 py-2 text-base font-semibold text-neutral-800 shadow-inner"
      >
        <span>剩余可用条数：{{ balanceLoading ? '…' : balanceRemaining }}</span>
        <button
          v-site-permission="SITE_USER_AUTOSMS_PERM.BALANCE_REFRESH"
          type="button"
          class="inline-flex text-[#1890ff] hover:opacity-80"
          title="刷新余额"
          @click="onRefreshBalance"
        >
          <IconifyIcon class="size-[18px]" icon="mdi:refresh" />
        </button>
      </div>

      <div class="flex flex-shrink-0 items-center">
        <Button
          type="primary"
          class="font-semibold"
          @click="emit('openChannel')"
        >
          短信通道管理
        </Button>
      </div>
    </div>

    <div class="flex flex-wrap items-stretch gap-6 px-2">
      <div
        class="min-h-[5.5rem] min-w-[140px] flex-1 rounded-2xl bg-gradient-to-br from-[#6c7bff] to-[#4058f4] px-4 py-3 text-center text-lg font-semibold text-white shadow-lg"
      >
        提交条数：{{ record.submit_num }}
      </div>
      <div
        class="min-h-[5.5rem] min-w-[140px] flex-1 rounded-2xl bg-gradient-to-br from-[#6c7bff] to-[#4058f4] px-4 py-3 text-center text-lg font-semibold text-white shadow-lg"
      >
        成功条数：{{ record.success_num }}
      </div>
      <div
        class="min-h-[5.5rem] min-w-[140px] flex-1 rounded-2xl bg-gradient-to-br from-[#6c7bff] to-[#4058f4] px-4 py-3 text-center text-lg font-semibold text-white shadow-lg"
      >
        失败条数：{{ record.fail_num }}
      </div>
      <div
        class="flex h-[5.5rem] w-[5.5rem] flex-shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#6c7bff] to-[#4058f4] text-center text-sm font-bold text-white shadow-lg"
      >
        <div>成功率</div>
        <div>{{ successRateText }}</div>
      </div>
    </div>
  </div>
</template>
