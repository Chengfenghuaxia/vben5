<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Form, FormItem, InputNumber, Modal, message } from 'ant-design-vue';

import type { WithdrawalWayRow } from '../useApi';

import { setWithdrawalWayApi } from '../useApi';

defineOptions({ name: 'FinanceWithdrawMoneySetRangeModal' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row: null | WithdrawalWayRow;
}>();

const emit = defineEmits<{ success: [] }>();

const form = reactive({
  id: '' as number | string,
  max: undefined as number | undefined,
  min: undefined as number | undefined,
});
const loading = ref(false);
const formRef = ref();

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }
  const r = props.row;
  if (r) {
    form.id = r.id;
    form.min = r.min ?? undefined;
    form.max = r.max ?? undefined;
  } else {
    form.id = '';
    form.min = undefined;
    form.max = undefined;
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
    await setWithdrawalWayApi({
      id: form.id,
      max: form.max as number,
      min: form.min as number,
    });
    message.success('设置成功');
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
    title="取现区间"
    :width="400"
    :confirm-loading="loading"
    destroy-on-close
    @ok="onOk"
  >
    <Form ref="formRef" layout="vertical" :model="form">
      <FormItem
        label="单笔最小金额"
        name="min"
        :rules="[{ required: true, message: '请输入单笔最小金额' }]"
      >
        <InputNumber
          v-model:value="form.min"
          class="w-full"
          placeholder="请输入单笔最小金额"
        />
      </FormItem>
      <FormItem
        label="单笔最大金额"
        name="max"
        :rules="[{ required: true, message: '请输入单笔最大金额' }]"
      >
        <InputNumber
          v-model:value="form.max"
          class="w-full"
          placeholder="请输入单笔最大金额"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
