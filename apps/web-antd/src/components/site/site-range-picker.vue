<script lang="ts" setup>
/**
 * Site 日期范围：与 site_ui 一致按后端时区解释历日；接口侧请用
 * `siteCalendarDateRangeToUtcMillis` 生成 start_at/end_at（毫秒）。
 * ant-design-vue 4.2 的 RangePicker 无官方 timeZone，历日以 valueFormat 字符串为准。
 */
import { RangePicker } from 'ant-design-vue/es/date-picker';
import { computed, useAttrs } from 'vue';

import {
  getSiteDisplayTimezone,
  SITE_FALLBACK_TIMEZONE,
} from '#/utils/datetime';

defineOptions({ inheritAttrs: false, name: 'SiteRangePicker' });

const props = defineProps<{
  /** IANA；默认与 `/site/v1/admin/info` load_location 一致 */
  timeZone?: string;
}>();

const attrs = useAttrs();

const resolvedTz = computed(() => {
  const p = props.timeZone?.trim();
  if (p) {
    return p;
  }
  return getSiteDisplayTimezone() || SITE_FALLBACK_TIMEZONE;
});

const bindProps = computed(() => ({
  allowClear: true,
  valueFormat: 'YYYY-MM-DD',
  ...attrs,
}));
</script>

<template>
  <span
    :data-site-timezone="resolvedTz"
    class="site-range-picker inline-block w-full [&_.ant-picker]:w-full"
  >
    <RangePicker v-bind="bindProps" />
  </span>
</template>
