<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Form, FormItem, Modal, Textarea, message } from 'ant-design-vue';

import { withdrawalRefundApi } from '../useApi';

defineOptions({ name: 'FinanceWithdrawalRefundModal' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  orderId: number | string;
}>();

const emit = defineEmits<{ success: [] }>();

const remark = ref('');
const loading = ref(false);
const formRef = ref();

watch(open, (isOpen) => {
  if (isOpen) {
    remark.value = '';
  }
});

async function onOk() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    await withdrawalRefundApi({
      id: Number(props.orderId),
      remark: remark.value.trim(),
    });
    message.success('提现退款已提交');
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
    title="提现退款"
    :width="400"
    @ok="onOk"
  >
    <Form ref="formRef" layout="vertical" :model="{ remark }">
      <FormItem
        label="备注"
        name="remark"
        :rules="[{ required: true, message: '请输入备注' }]"
      >
        <Textarea
          v-model:value="remark"
          :auto-size="{ minRows: 3, maxRows: 5 }"
          placeholder="请输入备注"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
