<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { computed, watch } from 'vue';

import {
  createFinanceDepositOrderApi,
  fetchFinChannelAllListApi,
} from '#/api/core/finance-deposit';
import { useVbenForm, z } from '#/adapter/form';

async function fetchPayInChannels() {
  const list = await fetchFinChannelAllListApi();
  return list
    .filter((item) => item.pay_in_status === 1)
    .map((item) => ({ label: item.name, value: item.code }));
}

defineOptions({ name: 'FinanceDepositCreateOrderModal' });

const props = defineProps<{ open: boolean }>();
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
        min: 1,
        precision: 0,
        style: { width: '100%' },
      },
      fieldName: 'uid',
      label: '用户ID',
      rules: z.number().int().min(1, { message: '请输入用户ID' }),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        style: { width: '100%' },
      },
      fieldName: 'amount',
      label: '充值金额',
      rules: z.number().min(0, { message: '请输入充值金额' }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchPayInChannels,
        immediate: true,
        placeholder: '支付通道',
      },
      fieldName: 'channel',
      label: '支付通道',
      rules: z.string().min(1, { message: '请选择支付通道' }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '赠送', value: 1 },
          { label: '不赠送', value: 2 },
        ],
        placeholder: '充值赠送活动状态',
      },
      fieldName: 'gift_status',
      label: '充值赠送活动状态',
      rules: z.coerce
        .number()
        .refine((n) => n === 1 || n === 2, { message: '请选择' }),
    },
    {
      component: 'Input',
      fieldName: 'order_id',
      label: '原订单号',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[440px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = await formApi.getValues<{
      amount: number;
      channel: string;
      gift_status: number;
      order_id?: string;
      uid: number;
    }>();
    modalApi.lock();
    try {
      await createFinanceDepositOrderApi({
        amount: values.amount,
        channel: values.channel,
        gift_status: values.gift_status,
        order_id: values.order_id?.trim() || undefined,
        uid: values.uid,
      });
      message.success('创建订单成功');
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
  () => props.open,
  async (open) => {
    if (!open) {
      modalApi.close();
      return;
    }
    modalApi.open();
    await formApi.resetForm();
  },
);
</script>

<template>
  <Modal title="创建订单">
    <Form />
  </Modal>
</template>
