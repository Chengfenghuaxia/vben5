<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { computed, watch } from 'vue';

import { useVbenForm, z } from '#/adapter/form';

defineOptions({ name: 'FinanceDepositExportRangeModal' });

const props = defineProps<{
  open: boolean;
  total: number;
}>();

const emit = defineEmits<{
  'update:open': [boolean];
  submit: [payload: { begin: number; end: number }];
}>();

const innerOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'vertical',
  schema: [
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 1,
        precision: 0,
        style: { width: '100%' },
      },
      fieldName: 'begin',
      label: '开始',
      rules: z.number().int().min(1),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 1,
        precision: 0,
        style: { width: '100%' },
      },
      fieldName: 'end',
      label: '结束',
      rules: z.number().int().min(1),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[400px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const v = await formApi.getValues<{ begin: number; end: number }>();
    if (v.begin > v.end) {
      message.warning('开始不能大于结束');
      return;
    }
    emit('submit', { begin: v.begin, end: v.end });
    modalApi.close();
  },
  onOpenChange(isOpen) {
    innerOpen.value = isOpen;
    if (!isOpen) {
      formApi.resetForm();
    }
  },
  title: '导出范围',
});

const cap = 1_000_000;

watch(
  () => [props.open, props.total] as const,
  async ([open, total]) => {
    if (!open) {
      modalApi.close();
      return;
    }
    modalApi.open();
    const end = Math.min(Math.max(1, total || 0), cap);
    await formApi.setValues({ begin: 1, end });
  },
);
</script>

<template>
  <Modal>
    <p class="mb-3 text-xs text-[var(--ant-color-error)]">
      * 一次最多导出 100 万条数据，超出部分将分表导出（以后端为准）
    </p>
    <Form />
  </Modal>
</template>
