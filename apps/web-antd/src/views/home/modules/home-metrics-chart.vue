<script lang="ts" setup>
import type { SiteHomeHistoryRow } from '../useApi';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { IconifyIcon } from '@vben/icons';
import { Card, Checkbox, Tooltip } from 'ant-design-vue';

defineOptions({ name: 'HomeMetricsChart' });

interface MetricConfig {
  checked: boolean;
  color: string;
  description: string;
  key: keyof SiteHomeHistoryRow;
  label: string;
}

const props = withDefaults(
  defineProps<{
    apkDownloadToday?: number;
    apkDownloadYesterday?: number;
    historyList?: SiteHomeHistoryRow[];
  }>(),
  {
    apkDownloadToday: 0,
    apkDownloadYesterday: 0,
    historyList: () => [],
  },
);

const metrics = ref<MetricConfig[]>([
  {
    key: 'ip',
    label: '访问量',
    color: '#00bcd4',
    description: '独立IP数',
    checked: true,
  },
  {
    key: 'register',
    label: '总注册量',
    color: '#9c27b0',
    description: '网页和APK的注册用户数',
    checked: true,
  },
  {
    key: 'fission',
    label: '裂变量',
    color: '#ff9800',
    description: '注册账号中有上级ID的账号数',
    checked: true,
  },
  {
    key: 'online',
    label: '总登陆在线人数',
    color: '#4caf50',
    description: '当前在线用户(网页和APK)数量大致统计',
    checked: true,
  },
  {
    key: 'apk_download',
    label: 'APK 下载次数',
    color: '#2196f3',
    description: '下载接口请求次数',
    checked: true,
  },
  {
    key: 'apk_register',
    label: 'APK注册用户数',
    color: '#f44336',
    description: '在APK的注册次数',
    checked: true,
  },
]);

function formatDate(dateStr: string) {
  if (!dateStr) {
    return '';
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`;
  }
  return dateStr;
}

const chartData = computed(() => {
  const list = props.historyList ?? [];
  if (!list.length) {
    return { dates: [] as string[], data: {} as Record<string, number[]> };
  }
  const dates = list.map((item) => formatDate(item.date));
  const data: Record<string, number[]> = {};
  for (const metric of metrics.value) {
    data[metric.key] = list.map((item) =>
      typeof item[metric.key] === 'number' ? (item[metric.key] as number) : 0,
    );
  }
  return { dates, data };
});

const visibleMetrics = computed(() => metrics.value.filter((m) => m.checked));

const selectedMetric = ref<MetricConfig | null>(null);

const metricTotals = computed(() => {
  const totals: Record<string, number> = {};
  const list = props.historyList ?? [];
  for (const metric of metrics.value) {
    totals[metric.key] = list.reduce((sum, item) => {
      const value =
        typeof item[metric.key] === 'number' ? (item[metric.key] as number) : 0;
      return sum + value;
    }, 0);
  }
  return totals;
});

function selectMetric(metric: MetricConfig) {
  selectedMetric.value = metric;
}

const chartRef = ref<EchartsUIType>();
const { updateData } = useEcharts(chartRef);

function buildSeries() {
  return visibleMetrics.value.map((metric) => ({
    name: metric.label,
    type: 'line' as const,
    smooth: true,
    data: chartData.value.data[metric.key] || [],
    itemStyle: { color: metric.color },
    lineStyle: { color: metric.color },
    areaStyle: {
      color: {
        type: 'linear' as const,
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: `${metric.color}80` },
          { offset: 1, color: `${metric.color}10` },
        ],
      },
    },
    symbol: 'circle',
    symbolSize: 6,
  }));
}

function updateChart() {
  const opt = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: { show: false },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.value.dates,
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed' },
      },
    },
    series: buildSeries(),
  };
  void updateData(opt as never, true);
}

watch(
  () => props.historyList,
  () => {
    void nextTick(() => updateChart());
  },
  { deep: true, flush: 'post' },
);

watch(
  metrics,
  () => {
    void nextTick(() => updateChart());
  },
  { deep: true, flush: 'post' },
);

onMounted(() => {
  void nextTick(() => updateChart());
});
</script>

<template>
  <Card :bordered="false" class="shadow-sm">
    <div class="metrics-chart-container">
      <div class="chart-section">
        <div class="checkbox-section">
          <div
            v-for="metric in metrics"
            :key="metric.key"
            class="checkbox-item"
          >
            <Checkbox v-model:checked="metric.checked">
              <span
                class="color-indicator"
                :style="{ backgroundColor: metric.color }"
              />
              <span class="metric-label">{{ metric.label }}</span>
              <Tooltip :title="metric.description" placement="top">
                <IconifyIcon
                  class="question-icon"
                  icon="ant-design:question-circle-outlined"
                />
              </Tooltip>
            </Checkbox>
          </div>
        </div>
        <EchartsUI ref="chartRef" class="chart-wrapper" height="300px" />
      </div>
      <div class="metrics-panel">
        <div class="metrics-title">近7日数据汇总</div>
        <div class="metrics-list">
          <div
            v-for="metric in metrics"
            :key="metric.key"
            class="metric-item"
            :class="{ active: selectedMetric?.key === metric.key }"
            @click="selectMetric(metric)"
          >
            <span
              class="metric-color"
              :style="{ backgroundColor: metric.color }"
            />
            <span class="metric-name">
              {{ metric.label }}: {{ metricTotals[metric.key] ?? 0 }}
            </span>
          </div>
        </div>
        <div
          v-if="apkDownloadToday || apkDownloadYesterday"
          class="apk-summary text-sm text-[var(--ant-color-text-secondary)]"
        >
          今日 APK 下载 {{ apkDownloadToday }} / 昨日 {{ apkDownloadYesterday }}
        </div>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.metrics-chart-container {
  display: flex;
  gap: 16px;
  min-height: 400px;
}

.chart-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
}

.checkbox-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding: 8px 0;
}

.checkbox-item :deep(.ant-checkbox-wrapper) {
  display: flex;
  gap: 4px;
  align-items: center;
}

.color-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1px solid var(--ant-color-border);
  border-radius: 2px;
}

.metric-label {
  margin-right: 4px;
  font-size: 14px;
}

.question-icon {
  margin-left: 4px;
  font-size: 14px;
  color: #1890ff;
  cursor: pointer;
}

.chart-wrapper {
  flex: 1;
  min-height: 300px;
}

.metrics-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 280px;
}

.metrics-title {
  padding-left: 18px;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  color: #d4380d;
}

.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.metric-item:hover {
  background-color: #f5f5f5;
}

.metric-item.active {
  background-color: #e6f7ff;
}

.metric-color {
  display: inline-block;
  width: 8px;
  height: 8px;
  border: 1px solid var(--ant-color-border);
  border-radius: 50%;
}

.metric-name {
  font-size: 14px;
}

.apk-summary {
  padding-left: 8px;
}
</style>
