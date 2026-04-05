<script lang="ts" setup>
import type { SiteHomeFinData } from '#/api/core/site-home';

import { computed, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { useStorage } from '@vueuse/core';
import { Card, Col, Row } from 'ant-design-vue';

import { SITE_HOME_PERM } from '#/constants/site-home-perm';

defineOptions({ name: 'HomeHeaderBanner' });

const props = withDefaults(
  defineProps<{
    bannerData?: Partial<SiteHomeFinData>;
    version?: string;
  }>(),
  {
    bannerData: () => ({}),
    version: '',
  },
);

const emit = defineEmits<{ update: [] }>();

const userStore = useUserStore();
const isTipClosed = useStorage('site-home-tip-muted', false);

interface StatItem {
  color?: string;
  fn?: () => void;
  icon: string;
  id: number;
  symbol: string;
  title: string;
  value1: number | string;
  value2: number | string;
}

const statisticData = computed<StatItem[]>(() => [
  {
    id: 0,
    title: '代付通道余额',
    value1: formatMoney(props.bannerData.balance),
    value2: ' ',
    icon: 'tabler:refresh',
    symbol: '¥',
    fn: () => emit('update'),
  },
  {
    id: 1,
    title: '总提现订单数/待审核订单数',
    value1: props.bannerData.withdrawal_total ?? 0,
    value2: props.bannerData.withdrawal_audit ?? 0,
    icon: isTipClosed.value ? 'ion:volume-mute' : 'ion:volume-off',
    color: '#d9031b',
    symbol: '',
    fn: () => {
      isTipClosed.value = !isTipClosed.value;
    },
  },
  {
    id: 2,
    title: '已处理订单数/未处理订单数',
    value1: props.bannerData.withdrawal_processed ?? 0,
    value2: props.bannerData.withdrawal_unprocessed ?? 0,
    icon: 'lucide:inbox',
    symbol: '',
  },
]);

function formatMoney(n: number | undefined) {
  if (n == null || Number.isNaN(n)) {
    return '0.00';
  }
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const displayName = ref('');

onMounted(() => {
  const u = userStore.userInfo;
  displayName.value = u?.username || u?.realName || '用户';
});

function isNumericValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
</script>

<template>
  <Card :bordered="false" class="shadow-sm">
    <Row align="middle" justify="space-between">
      <Col :lg="10" :md="12" :sm="24" :xl="8" :xs="24">
        <div class="flex items-center gap-3">
          <div
            class="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--ant-color-primary)] text-2xl font-semibold text-white"
          >
            {{ displayName.slice(0, 1).toUpperCase() || 'U' }}
          </div>
          <div>
            <div class="text-base font-semibold">你好，{{ displayName }}</div>
            <div class="mt-2 text-sm text-[var(--ant-color-text-secondary)]">
              Version:
              <span class="font-semibold text-[var(--ant-color-text)]">{{ version || '—' }}</span>
            </div>
          </div>
        </div>
      </Col>
      <Col :lg="14" :md="12" :sm="24" :xl="16" :xs="24">
        <Row>
          <Col
            v-for="(item, index) in statisticData"
            v-site-permission="SITE_HOME_PERM.FIN"
            :key="`stat-${index}`"
            :md="8"
            :sm="12"
            :xs="24"
            class="stat-box"
          >
            <div class="stat-inner">
              <div class="stat-text">
                <span class="text-sm font-semibold">{{ item.title }}</span>
                <div class="mt-1">
                  <span class="text-sm">
                    {{ item.symbol ? `${item.symbol} ` : '' }}{{ item.value1 }}
                  </span>
                  <template v-if="isNumericValue(item.value2)">
                    <span class="text-sm"> /</span>
                    <span class="text-xl underline" :style="item.color ? { color: item.color } : {}">
                      {{ item.value2 }}
                    </span>
                  </template>
                </div>
              </div>
              <div class="stat-icon" role="button" @click="item.fn?.()">
                <IconifyIcon :icon="item.icon" class="size-8" />
              </div>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  </Card>
</template>

<style scoped>
.stat-box {
  display: flex;
  min-height: 72px;
  border-left: 1px dashed var(--ant-color-border-secondary, #7f7f7f);
  padding-left: 20px;
  padding-right: 20px;
}

.stat-inner {
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.stat-text {
  display: flex;
  min-height: 72px;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  text-align: center;
}

.stat-icon {
  display: flex;
  cursor: pointer;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 4px;
  color: var(--ant-color-text-secondary);
}
</style>
