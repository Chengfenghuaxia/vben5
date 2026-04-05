<script lang="ts" setup>
import type { ActingAgentRow } from '#/api/core/acting-agent';

import { computed } from 'vue';

import md5 from '#/utils/md5';

import { Button, Modal, message } from 'ant-design-vue';

/** 与 site_ui `create-agent.vue` 中 transObj 一致 */
const TRANS_OBJ: Record<string, string> = {
  kwai: 'click_id',
  meta: 'fbclid',
  tiktok: 'ttclid',
};

const AGENT_TYPE_LABEL: Record<number, string> = {
  1: 'h5 官网落地页',
  2: 'pwa-专属下载页',
};

const props = defineProps<{
  row: ActingAgentRow | null;
}>();

const open = defineModel<boolean>('open', { default: false });

const platform = computed(() => {
  const code = props.row?.ad_codes;
  if (typeof code === 'string' && code in TRANS_OBJ) {
    return code;
  }
  return 'meta';
});

const pixelId = computed(() => {
  const cfg = props.row?.ad_config?.[platform.value];
  const v = cfg?.pixel_id;
  return typeof v === 'string' ? v : '';
});

/** 与 site_ui 测试弹窗公式一致：url & 参数名 = md5(pixel_id) */
const testLink = computed(() => {
  const url = props.row?.url?.trim();
  if (!url) {
    return '';
  }
  const param = TRANS_OBJ[platform.value];
  if (!param) {
    return '';
  }
  return `${url}&${param}=${md5(pixelId.value || '')}`;
});

const agentTypeText = computed(() => {
  const t = props.row?.agent_type;
  if (t == null) {
    return '—';
  }
  return AGENT_TYPE_LABEL[t] ?? String(t);
});

function close() {
  open.value = false;
}

async function copyLink() {
  const text = testLink.value;
  if (!text) {
    message.warning('暂无测试链接');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制');
  } catch {
    message.error('复制失败');
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    destroy-on-close
    title="测试"
    width="560px"
    :footer="null"
    @cancel="close"
  >
    <template v-if="row">
      <div class="space-y-3 text-sm">
        <div class="flex gap-2">
          <span class="shrink-0 text-gray-500 w-24">总代名称</span>
          <span>{{ row.team_name ?? '—' }}</span>
        </div>
        <div class="flex gap-2">
          <span class="shrink-0 text-gray-500 w-24">渠道名称</span>
          <span>{{ row.name ?? '—' }}</span>
        </div>
        <div class="flex gap-2">
          <span class="shrink-0 text-gray-500 w-24">类型</span>
          <span>{{ agentTypeText }}</span>
        </div>
        <div class="flex gap-2">
          <span class="shrink-0 text-gray-500 w-24">pixel_id</span>
          <span>{{ pixelId || '—' }}</span>
        </div>
        <div class="flex gap-2 items-start">
          <span class="shrink-0 text-gray-500 w-24 pt-0.5">测试链接</span>
          <div class="min-w-0 flex-1 flex items-start gap-2">
            <span class="break-all">{{ testLink || '—' }}</span>
            <Button
              v-if="testLink"
              class="shrink-0 px-1"
              size="small"
              type="link"
              @click="copyLink"
            >
              复制
            </Button>
          </div>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <Button type="primary" @click="close">关闭</Button>
      </div>
    </template>
  </Modal>
</template>
