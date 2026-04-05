<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Input, Modal, message } from 'ant-design-vue';

import { withdrawalRejectApi } from '../useApi';

defineOptions({ name: 'FinanceWithdrawalRejectModal' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  ids: (number | string)[];
}>();

const emit = defineEmits<{ success: [] }>();

const remark = ref('');
const loading = ref(false);

watch(open, (isOpen) => {
  if (isOpen) {
    remark.value = '';
  }
});

async function onOk() {
  if (!remark.value.trim()) {
    message.warning('请填写拒绝原因');
    return;
  }
  if (!props.ids.length) {
    message.warning('未选择订单');
    return;
  }
  loading.value = true;
  try {
    await withdrawalRejectApi({
      ids: props.ids,
      remark: remark.value.trim(),
    });
    message.success('拒绝成功');
    open.value = false;
    emit('success');
  } catch {
    /* 拦截器 */
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="loading"
    title="拒绝提示"
    :width="500"
    @ok="onOk"
  >
    <p class="mb-2 text-sm">
      点击确定后，此条提现信息修改为拒绝状态，
      <span class="text-[var(--ant-color-error)]"
        >您填写的说明信息将在客户端对玩家以提现拒绝说明的方式进行展示。</span
      >
    </p>
    <div class="mt-4">
      <span class="mr-2">拒绝原因:</span>
      <Input v-model:value="remark" />
    </div>
  </Modal>
</template>
