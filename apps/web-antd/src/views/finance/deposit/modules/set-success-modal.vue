<script lang="ts" setup>
import type { FinanceDepositRow } from '#/api/core/finance-deposit';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { computed, nextTick, watch } from 'vue';

import { setFinanceDepositSuccessApi } from '#/api/core/finance-deposit';
import { useVbenForm, z } from '#/adapter/form';

defineOptions({ name: 'FinanceDepositSetSuccessModal' });

const props = defineProps<{
  open: boolean;
  row: FinanceDepositRow | null;
}>();

const emit = defineEmits<{
  'update:open': [boolean];
  success: [];
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
        style: { width: '100%' },
      },
      fieldName: 'fee',
      label: '通道费',
      rules: z.number({ message: '请输入通道费' }),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      rules: z.string().min(1, { message: '请输入备注' }),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[400px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !props.row?.id) {
      return;
    }
    const values = await formApi.getValues<{ fee: number; remark: string }>();
    modalApi.lock();
    try {
      await setFinanceDepositSuccessApi({
        fee: values.fee,
        id: props.row.id,
        remark: values.remark,
      });
      message.success('操作成功');
      modalApi.close();
      emit('success');
    } catch {
      /* 拦截器 */
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    innerOpen.value = isOpen;
    if (!isOpen) {
      formApi.resetForm();
    }
  },
});

watch(
  () => [props.open, props.row] as const,
  async ([open, r]) => {
    if (!open) {
      modalApi.close();
      return;
    }
    modalApi.open();
    await nextTick();
    if (r) {
      await formApi.setValues({
        fee: r.fee ?? undefined,
        remark: r.remark ?? '',
      });
    }
  },
);
</script>

<template>
  <Modal title="设置成功">
    <Form />
  </Modal>
</template>
