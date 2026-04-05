<script lang="ts" setup>
import { CountTo } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { createReusableTemplate } from '@vueuse/core';
import { Card, Tooltip } from 'ant-design-vue';
import { computed } from 'vue';

defineOptions({ name: 'HomeCardData' });

interface CardItem {
  color: { end: string; start: string };
  footerText: string;
  icon: string;
  key: string;
  tip: string;
  title: string;
  unit: string;
  value: number;
}

const props = defineProps<{
  /** 是否具备运营数据权限（与 site_ui apis 182 一致） */
  showNumbers?: boolean;
  data?: Record<string, number>;
}>();

const safeData = computed(() => props.data ?? {});

const cardItems = computed<CardItem[]>(() => [
  {
    key: 'visitCount',
    title: '访问量',
    value: Number(safeData.value.ip) || 0,
    footerText: '总数据',
    unit: '',
    color: { start: '#ec4786', end: '#b955a4' },
    tip: '独立IP数',
    icon: 'ant-design:bar-chart-outlined',
  },
  {
    key: 'register',
    title: '注册量',
    value: Number(safeData.value.register) || 0,
    footerText: '总数据',
    unit: '',
    color: { start: '#865ec0', end: '#5144b4' },
    tip: '注册账号数',
    icon: 'ant-design:money-collect-outlined',
  },
  {
    key: 'pwa',
    title: '下载量',
    value: Number(safeData.value.pwa) || 0,
    footerText: '总数据',
    unit: '',
    color: { start: '#56cdf3', end: '#719de3' },
    tip: 'PWA下载数',
    icon: 'carbon:document-download',
  },
  {
    key: 'fission',
    title: '裂变量',
    value: Number(safeData.value.fission) || 0,
    footerText: '总数据',
    unit: '',
    color: { start: '#fcbc25', end: '#f68057' },
    tip: '注册账号中有上级ID的账号数',
    icon: 'ant-design:trademark-circle-outlined',
  },
  {
    key: 'online',
    title: '登陆在线人数',
    value: Number(safeData.value.online) || 0,
    footerText: '当前实时在线人数',
    unit: '',
    color: { start: '#10b981', end: '#059669' },
    tip: '当前在线用户数量大致统计',
    icon: 'ant-design:team-outlined',
  },
]);

interface GradientBgProps {
  gradientColor: string;
}

const [DefineGradientBg, GradientBg] =
  createReusableTemplate<GradientBgProps>();

function getGradientColor(color: CardItem['color']) {
  return `linear-gradient(to bottom right, ${color.start}, ${color.end})`;
}
</script>

<template>
  <Card :bordered="false" class="shadow-sm" size="small">
    <DefineGradientBg v-slot="{ $slots, gradientColor }">
      <div
        class="rounded-lg px-4 pb-1 pt-2 text-white"
        :style="{ backgroundImage: gradientColor }"
      >
        <component :is="$slots.default" />
      </div>
    </DefineGradientBg>

    <div v-if="showNumbers" class="flex flex-wrap gap-4">
      <div
        v-for="item in cardItems"
        :key="item.key"
        class="min-h-[120px] min-w-[200px] flex-1"
      >
        <GradientBg :gradient-color="getGradientColor(item.color)" class="flex h-full flex-col">
          <div class="flex justify-between">
            <h3 class="text-base font-medium">{{ item.title }}</h3>
            <Tooltip :title="item.tip">
              <IconifyIcon class="text-base opacity-90" icon="ant-design:question-circle-outlined" />
            </Tooltip>
          </div>
          <div class="mt-auto flex items-center justify-between pt-3">
            <IconifyIcon :icon="item.icon" class="text-[32px] opacity-95" />
            <CountTo
              :decimals="0"
              :duration="1500"
              :end-val="item.value"
              :start-val="0"
              class="text-3xl font-semibold text-white"
              :prefix="item.unit"
            />
          </div>
          <div class="pt-1.5 text-center text-xs text-white/85">
            {{ item.footerText }}
          </div>
        </GradientBg>
      </div>
    </div>
    <div v-else class="flex flex-wrap gap-4">
      <div
        v-for="i in 5"
        :key="`ph-${i}`"
        class="min-h-[120px] min-w-[200px] flex-1 rounded-lg bg-[var(--ant-color-fill-quaternary)]"
      />
    </div>
  </Card>
</template>
