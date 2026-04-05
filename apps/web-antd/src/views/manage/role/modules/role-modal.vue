<script lang="ts" setup>
import type { FormProps } from 'ant-design-vue';

import { roleAddApi, roleUpdateApi } from '#/views/manage/role/useApi';
import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  Modal,
  Row,
  Space,
  message,
} from 'ant-design-vue';
import { computed, nextTick, reactive, ref, watch } from 'vue';

export type ManageRoleRow = Record<string, unknown> & {
  id?: number;
  name?: string;
  remark?: string;
};

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{ row: ManageRoleRow | null }>();
const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const formRef = ref();
const model = reactive({
  id: undefined as number | undefined,
  name: '',
  remark: '',
});

const isEdit = computed(() => model.id != null);
const rules = computed((): FormProps['rules'] => ({
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入备注', trigger: 'blur' }],
}));

async function sync() {
  await nextTick();
  if (props.row?.id != null) {
    model.id = Number(props.row.id);
    model.name = String(props.row.name ?? '');
    model.remark = String(props.row.remark ?? '');
  } else {
    model.id = undefined;
    model.name = '';
    model.remark = '';
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
      await roleUpdateApi({
        id: model.id,
        name: model.name,
        remark: model.remark,
      });
      message.success('修改成功');
    } else {
      await roleAddApi({ name: model.name, remark: model.remark });
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
    :title="isEdit ? '编辑角色' : '新增角色'"
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
          <FormItem label="角色名称" name="name">
            <Input v-model:value="model.name" placeholder="请输入角色名称" />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="备注" name="remark">
            <Input.TextArea
              v-model:value="model.remark"
              allow-clear
              placeholder="请输入备注"
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
