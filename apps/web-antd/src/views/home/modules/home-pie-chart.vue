<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Card } from 'ant-design-vue';

defineOptions({ name: 'HomePieChart' });

const props = defineProps<{
  data: Record<string, unknown>;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function buildPieOption() {
  const d = props.data ?? {};
  return {
    tooltip: { trigger: 'item' },
    legend: {
      bottom: '1%',
      left: 'center',
      itemStyle: { borderWidth: 0 },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        avoidLabelOverlap: false,
        color: ['#4285f4', '#ea4335', '#f9bc05', '#35a853'],
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        label: {
          show: true,
          position: 'inner',
          formatter: '{per|{d}%}',
          rich: {
            per: { color: '#000', fontSize: 16, fontWeight: 'bold' },
          },
        },
        emphasis: {
          label: { show: true, fontSize: 12 },
        },
        labelLine: { show: false },
        data: [
          { name: '首充人数', value: Number(d.first_deposit) || 0 },
          { name: '一级首充人数', value: Number(d.one_first_deposit) || 0 },
          { name: '新充人数', value: Number(d.new_deposit) || 0 },
          { name: '一级新充人数', value: Number(d.one_new_deposit) || 0 },
        ],
      },
    ],
  };
}

watch(
  () => props.data,
  () => {
    void nextTick(() => renderEcharts(buildPieOption() as never));
  },
  { deep: true, immediate: true, flush: 'post' },
);
</script>

<template>
  <Card :bordered="false" class="shadow-sm">
    <EchartsUI ref="chartRef" height="360px" />
  </Card>
</template>
