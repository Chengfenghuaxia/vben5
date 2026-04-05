<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Form, FormItem, InputNumber, Modal, message } from 'ant-design-vue';

import type { FinChannelRow } from '../useApi';

import {
  updateFinChannelPayInWeightApi,
  updateFinChannelPayOutWeightApi,
} from '../useApi';

import { finChannelConfigInputNumberStyle } from './config/required';

defineOptions({ name: 'FinanceChannelPayWeightModal' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row: null | FinChannelRow;
  type: 'in' | 'out';
}>();

const emit = defineEmits<{ success: [] }>();

const form = reactive({
  code: '',
  weight: 0,
});
const loading = ref(false);
const formRef = ref();

const title = computed(() =>
  props.type === 'in' ? '代收权重配置' : '代付权重配置',
);

watch(open, (isOpen) => {
  if (!isOpen || !props.row?.code) {
    return;
  }
  form.code = String(props.row.code);
  if (props.type === 'in') {
    form.weight = Number(props.row.pay_in_weight ?? 0) || 0;
  } else {
    form.weight = Number(props.row.pay_out_weight ?? 0) || 0;
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
    const api =
      props.type === 'in'
        ? updateFinChannelPayInWeightApi
        : updateFinChannelPayOutWeightApi;
    await api({
      code: form.code,
      weight: form.weight,
    });
    message.success('权重配置成功');
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
    :title="title"
    :width="400"
    :confirm-loading="loading"
    destroy-on-close
    @ok="onOk"
  >
    <Form ref="formRef" layout="vertical" :model="form">
      <FormItem
        name="weight"
        :rules="[
          { required: true, message: '请输入权重' },
          {
            type: 'number',
            min: 1,
            max: 100,
            message: '权重必须在1-100之间',
            trigger: 'blur',
          },
        ]"
      >
        <template #label>
          <span
            >权重 <span class="text-[var(--ant-color-error)]">1-100</span></span
          >
        </template>
        <InputNumber
          v-model:value="form.weight"
          class="w-full"
          :style="finChannelConfigInputNumberStyle"
          :max="100"
          :min="1"
          placeholder="请输入权重"
          :step="1"
          addon-after="%"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
