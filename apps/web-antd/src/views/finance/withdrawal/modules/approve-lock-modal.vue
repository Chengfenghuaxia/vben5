<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  Form,
  FormItem,
  Modal,
  Select,
  Textarea,
  message,
} from 'ant-design-vue';

import { withdrawalLockApi } from '../useApi';

import { usePayOutChannels } from './use-pay-out-channels';

defineOptions({ name: 'FinanceWithdrawalApproveLockModal' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  ids: (number | string)[];
}>();

const emit = defineEmits<{ success: [] }>();

const { channelOptions, ensureChannels } = usePayOutChannels();

const form = reactive({
  channel: undefined as string | undefined,
  remark: '',
});
const loading = ref(false);
const formRef = ref();

watch(open, async (isOpen) => {
  if (!isOpen) {
    return;
  }
  form.remark = '';
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
  if (!props.ids.length) {
    message.warning('未选择订单');
    return;
  }
  loading.value = true;
  try {
    await withdrawalLockApi({
      channel: form.channel,
      ids: props.ids,
      remark: form.remark,
    });
    message.success('审核成功');
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
    title="审核通过并放款"
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
      <FormItem label="备注" name="remark">
        <Textarea
          v-model:value="form.remark"
          :auto-size="{ minRows: 3, maxRows: 5 }"
          placeholder="请输入备注"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
