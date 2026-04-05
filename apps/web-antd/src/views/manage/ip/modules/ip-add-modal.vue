<script lang="ts" setup>
import type { FormProps } from 'ant-design-vue';

import { ipAddApi } from '#/views/manage/ip/useApi';
import {
  Button,
  Form,
  FormItem,
  Input,
  Modal,
  Space,
  message,
} from 'ant-design-vue';
import { computed, nextTick, reactive, ref, watch } from 'vue';

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const formRef = ref();
const model = reactive({ ip: '' });

const rules = computed((): FormProps['rules'] => ({
  ip: [{ required: true, message: '请输入 IP', trigger: 'blur' }],
}));

watch(open, async (v) => {
  if (!v) {
    return;
  }
  model.ip = '';
  await nextTick();
  formRef.value?.clearValidate?.();
});

function close() {
  open.value = false;
}

async function onOk() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    await ipAddApi({ ip: model.ip.trim() });
    message.success('新增成功');
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
    title="新增 IP"
    :width="400"
    destroy-on-close
    @cancel="close"
  >
    <Form
      ref="formRef"
      class="pt-2"
      layout="vertical"
      :model="model"
      :rules="rules"
    >
      <FormItem label="IP" name="ip">
        <Input v-model:value="model.ip" allow-clear placeholder="请输入 IP" />
      </FormItem>
    </Form>
    <template #footer>
      <Space>
        <Button @click="close">取消</Button>
        <Button :loading="loading" type="primary" @click="onOk">确定</Button>
      </Space>
    </template>
  </Modal>
</template>
