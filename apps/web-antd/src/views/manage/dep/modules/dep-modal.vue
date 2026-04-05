<script lang="ts" setup>
import type { FormProps } from 'ant-design-vue';

import { depAddApi, depUpdateApi } from '#/views/manage/dep/useApi';
import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  Modal,
  Row,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import { computed, nextTick, reactive, ref, watch } from 'vue';

export type ManageDepRow = Record<string, unknown> & {
  id?: number;
  name?: string;
  status?: number;
};

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{ row: ManageDepRow | null }>();
const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const formRef = ref();
const model = reactive({
  id: undefined as number | undefined,
  name: '',
  status: 1 as number,
});

const statusOptions = [
  { label: '开启', value: 1 },
  { label: '关闭', value: 2 },
];

const isEdit = computed(() => model.id != null);
const rules = computed((): FormProps['rules'] => ({
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}));

async function sync() {
  await nextTick();
  if (props.row?.id != null) {
    model.id = Number(props.row.id);
    model.name = String(props.row.name ?? '');
    model.status = Number(props.row.status) === 2 ? 2 : 1;
  } else {
    model.id = undefined;
    model.name = '';
    model.status = 1;
  }
}

watch(open, async (v) => {
  if (!v) {
    return;
  }
  await sync();
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
    if (isEdit.value) {
      await depUpdateApi({
        id: model.id,
        name: model.name,
        status: model.status,
      });
      message.success('修改成功');
    } else {
      await depAddApi({ name: model.name, status: model.status });
      message.success('新增成功');
    }
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
    :title="isEdit ? '编辑部门' : '新增部门'"
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
      <Row :gutter="24">
        <Col :span="24">
          <FormItem label="部门名称" name="name">
            <Input v-model:value="model.name" placeholder="请输入部门名称" />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="状态" name="status">
            <Select
              v-model:value="model.status"
              :options="statusOptions"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
    <template #footer>
      <Space>
        <Button @click="close">取消</Button>
        <Button :loading="loading" type="primary" @click="onOk">确定</Button>
      </Space>
    </template>
  </Modal>
</template>
