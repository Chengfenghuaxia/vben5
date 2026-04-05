<script lang="ts" setup>
import type { SiteHomeHourRow } from '../useApi';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Card, Slider } from 'ant-design-vue';

defineOptions({ name: 'HomeLineChart' });

const props = defineProps<{
  data: SiteHomeHourRow[];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const timeVal = ref<number>();

const SERIES_NAMES = [
  '昨日充值',
  '今日充值',
  '昨日提现',
  '今日提现',
  '昨日充提差',
  '今日充提差',
  '昨日盈亏',
  '今日盈亏',
] as const;

const FIELD_LIST = [
  'last_deposit',
  'deposit',
  'last_withdrawal',
  'withdrawal',
  'last_difference',
  'difference',
  'last_wl_amount',
  'wl_amount',
] as const;

const COLORS = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
];

const hours = () => props.data.map((item) => item.hour);

function buildOption(startIndex: number, endIndex: number) {
  const h = hours();
  const currentData = props.data.slice(startIndex, endIndex);
  const hourData = h.slice(startIndex, endIndex).map((hour) => `${hour}:00`);
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: [...SERIES_NAMES],
      left: 'left',
      orient: 'vertical',
      top: 'middle',
    },
    grid: {
      left: '13%',
      right: '4%',
      bottom: '14%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: hourData,
    },
    yAxis: {
      type: 'value',
      position: 'right',
    },
    barCategoryGap: '30%',
    series: FIELD_LIST.map((field, index) => ({
      name: SERIES_NAMES[index],
      type: 'bar' as const,
      barWidth: '10%',
      color: COLORS[index],
      data: currentData.map((item) => {
        const value = Number(item[field as keyof SiteHomeHourRow]) || 0;
        return /deposit|withdrawal|wl_amount/i.test(field)
          ? Number(value.toFixed(2))
          : Math.round(value);
      }),
    })),
  };
}

function refreshSlice(startIndex: number, endIndex: number) {
  void renderEcharts(buildOption(startIndex, endIndex) as never);
}

watch(
  () => props.data,
  async () => {
    if (!props.data.length) {
      return;
    }
    await nextTick();
    const h = hours();
    const len = props.data.length;
    const initLen = Math.min(3, len);
    const start = len - initLen;
    timeVal.value = h[len - 1];
    refreshSlice(start, len);
  },
  { immediate: true },
);

function onAfterChange(val: number | [number, number]) {
  const n = Array.isArray(val) ? val[0] : val;
  if (n == null) {
    return;
  }
  const h = hours();
  const currentIndex = h.findIndex((item) => item === n);
  if (currentIndex < 0) {
    return;
  }
  const startIndex = Math.max(0, currentIndex - 2);
  const endIndex = currentIndex + 1;
  refreshSlice(startIndex, endIndex);
}

function sliderMin() {
  const h = hours();
  return h.length ? h[0]! : 0;
}

function sliderMax() {
  const h = hours();
  return h.length ? h[h.length - 1]! : 23;
}
</script>

<template>
  <Card :bordered="false" class="shadow-sm">
    <div
      v-if="!data.length"
      class="py-16 text-center text-[var(--ant-color-text-secondary)]"
    >
      暂无分时数据
    </div>
    <template v-else>
      <EchartsUI ref="chartRef" height="325px" />
      <div class="flex justify-center pt-2">
        <Slider
          v-model:value="timeVal"
          class="home-op-slider w-[60%]"
          :max="sliderMax()"
          :min="sliderMin()"
          :step="1"
          :tip-formatter="(v) => (v == null ? '' : `${v}:00`)"
          @after-change="onAfterChange"
        />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.home-op-slider :deep(.ant-slider-rail) {
  background-color: rgb(52 155 213 / 35%);
}

.home-op-slider :deep(.ant-slider-track) {
  background-color: #349bd5;
}

.home-op-slider :deep(.ant-slider-handle)::after {
  box-shadow: 0 0 0 2px #349bd5;
}
</style>
