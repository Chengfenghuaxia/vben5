<script lang="ts" setup>
import type { ActingDataTrackingRow } from '#/api/core/acting-data-tracking';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { computed, nextTick, ref, watch } from 'vue';

import {
  createActingDataTrackingApi,
  updateActingDataTrackingApi,
} from '#/api/core/acting-data-tracking';
import { useVbenForm, z } from '#/adapter/form';

import {
  WEBSITE_DATATRACKING_EVENT_OPTIONS,
  WEBSITE_DATATRACKING_REDIRECT_OPTIONS,
} from '../data';

function parseRowEvents(row: ActingDataTrackingRow): number[] {
  const ev = row.events;
  if (Array.isArray(ev)) {
    return ev;
  }
  if (typeof ev === 'string') {
    try {
      const parsed = JSON.parse(ev) as unknown;
      return Array.isArray(parsed) ? (parsed as number[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

defineOptions({ name: 'WebsiteDatatrackingFormModal' });

const props = defineProps<{
  open: boolean;
  row: null | ActingDataTrackingRow;
}>();

const emit = defineEmits<{
  'update:open': [boolean];
  success: [];
}>();

const innerOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

const isEdit = computed(() => !!props.row?.id);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '埋点名称',
      rules: z.string().min(1, { message: '请输入埋点名称' }),
    },
    {
      component: 'Input',
      fieldName: 'url',
      label: '推广地址',
      rules: z.string().min(1, { message: '请输入推广地址' }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: WEBSITE_DATATRACKING_REDIRECT_OPTIONS,
        placeholder: '请选择跳转页面',
      },
      fieldName: 'redirect',
      label: '跳转页面',
      rules: z.coerce.number().int().min(1, { message: '请选择跳转页面' }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        options: [...WEBSITE_DATATRACKING_EVENT_OPTIONS],
        placeholder: '请选择埋点事件',
      },
      fieldName: 'events',
      label: '埋点事件',
      rules: z
        .array(z.number())
        .min(1, { message: '请至少选择一项埋点事件' })
        .refine((arr) => arr.every((n) => n >= 1 && n <= 5), {
          message: '埋点事件取值无效',
        }),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[520px]',
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    innerOpen.value = isOpen;
    if (!isOpen) {
      formApi.resetForm();
    }
  },
});

const submitting = ref(false);

watch(
  () => [props.open, props.row] as const,
  async ([open, row]) => {
    if (!open) {
      modalApi.close();
      return;
    }
    modalApi.open();
    modalApi.setState({
      title: row?.id ? '编辑' : '新增',
    });
    await nextTick();
    if (row?.id) {
      await formApi.setValues({
        events: parseRowEvents(row),
        name: row.name,
        redirect: row.redirect,
        url: row.url ?? row.domain ?? '',
      });
    } else {
      await formApi.resetForm();
    }
  },
);

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  const values = await formApi.getValues();
  submitting.value = true;
  modalApi.lock();
  try {
    if (isEdit.value && props.row?.id) {
      await updateActingDataTrackingApi({
        domain: String(values.url),
        events: values.events as number[],
        id: props.row.id,
        name: String(values.name),
        redirect: Number(values.redirect),
      });
      message.success('保存成功');
    } else {
      await createActingDataTrackingApi({
        domain: String(values.url),
        events: values.events as number[],
        name: String(values.name),
        redirect: Number(values.redirect),
      });
      message.success('创建成功');
    }
    modalApi.close();
    emit('success');
  } catch {
    /* 拦截器 */
  } finally {
    submitting.value = false;
    modalApi.lock(false);
  }
}
</script>

<template>
  <Modal :confirm-loading="submitting">
    <Form />
  </Modal>
</template>
