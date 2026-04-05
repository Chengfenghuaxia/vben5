<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Form, FormItem, Modal, Select, message } from 'ant-design-vue';

import { withdrawalPayApi } from '../useApi';

import { usePayOutChannels } from './use-pay-out-channels';

defineOptions({ name: 'FinanceWithdrawalPayModal' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  orderId: number | string;
}>();

const emit = defineEmits<{ success: [] }>();

const { channelOptions, ensureChannels } = usePayOutChannels();

const form = reactive({ channel: undefined as string | undefined });
const loading = ref(false);
const formRef = ref();

watch(open, async (isOpen) => {
  if (!isOpen) {
    return;
  }
  form.channel = undefined;
  const def = await ensureChannels(1);
  form.channel = def;
});

async function onOk() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    await withdrawalPayApi({
      channel: form.channel,
      id: props.orderId,
    });
    message.success('代付提现成功');
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
    title="代付提现"
    :width="500"
    @ok="onOk"
  >
    <Form ref="formRef" layout="vertical" :model="form">
      <FormItem
        label="渠道"
        name="channel"
        :rules="[{ required: true, message: '请选择渠道' }]"
      >
        <Select
          v-model:value="form.channel"
          allow-clear
          :options="channelOptions"
          placeholder="请选择渠道"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
