<script lang="ts" setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';

import type { FormProps } from 'ant-design-vue';

import {
  Button,
  Col,
  Form,
  FormItem,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  message,
} from 'ant-design-vue';

import type { DepositTabRow } from '../useApi';

import { addDepositTabApi, updateDepositTabApi } from '../useApi';

defineOptions({ name: 'FinanceDepositOptionModal' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row: DepositTabRow | null;
  templateId: null | number;
}>();

const emit = defineEmits<{ success: [] }>();

const model = reactive({
  id: undefined as number | undefined,
  amount: undefined as number | undefined,
  is_hot: undefined as number | undefined,
  status: undefined as number | undefined,
  sort: undefined as number | undefined,
  template_id: undefined as number | undefined,
});

const loading = ref(false);
const formRef = ref();

const hotOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 2 },
];
const statusOptions = [
  { label: '开启', value: 1 },
  { label: '关闭', value: 2 },
];

const rules = computed((): FormProps['rules'] => {
  const r: FormProps['rules'] = {
    amount: [{ required: true, message: '请输入充值金额', trigger: 'blur' }],
    sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  };
  if (model.id == null) {
    r.is_hot = [{ required: true, message: '请选择', trigger: 'change' }];
    r.status = [{ required: true, message: '请选择', trigger: 'change' }];
  }
  return r;
});

const isEditMode = computed(() => model.id != null);

/** 与 site 一致：未选模板时默认 1；`0` 保留 */
function effectiveTemplateId(): number {
  const v = props.templateId;
  if (v !== null && v !== undefined) {
    return v;
  }
  return 1;
}

function resetModel() {
  model.id = undefined;
  model.amount = undefined;
  model.is_hot = undefined;
  model.status = undefined;
  model.sort = undefined;
  model.template_id = effectiveTemplateId();
}

function toOptionalNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') {
    return undefined;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

async function syncFromProps() {
  await nextTick();
  if (props.row?.id != null) {
    Object.assign(model, {
      id: props.row.id,
      amount: toOptionalNumber(props.row.amount),
      is_hot: props.row.is_hot,
      status: props.row.status,
      sort: toOptionalNumber(props.row.sort),
      template_id: props.row.template_id ?? effectiveTemplateId(),
    });
    return;
  }
  resetModel();
}

watch(
  () => open.value,
  async (v) => {
    if (!v) {
      return;
    }
    await syncFromProps();
    await nextTick();
    /** 不可在回显后 resetFields，否则会清空刚写入的 amount/sort（编辑弹窗空白） */
    formRef.value?.clearValidate?.();
  },
  { immediate: true },
);

function close() {
  open.value = false;
}

async function onSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    if (model.id != null) {
      await updateDepositTabApi({ ...model });
      message.success('修改成功');
    } else {
      await addDepositTabApi({ ...model });
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
    :title="isEditMode ? '编辑充值选项' : '新增充值选项'"
    :width="400"
    destroy-on-close
    @cancel="close"
  >
    <Form ref="formRef" layout="vertical" :model="model" :rules="rules">
      <Row :gutter="24">
        <Col :span="24">
          <FormItem label="充值金额" name="amount">
            <InputNumber
              v-model:value="model.amount"
              class="w-full"
              placeholder="请输入充值金额"
              :min="0"
              :style="{ width: '100%' }"
            />
          </FormItem>
        </Col>
      </Row>
      <Row v-if="!isEditMode" :gutter="24">
        <Col :span="24">
          <FormItem label="是否热门推荐" name="is_hot">
            <Select
              v-model:value="model.is_hot"
              allow-clear
              class="w-full"
              :options="hotOptions"
              placeholder="请选择是否热门推荐"
            />
          </FormItem>
        </Col>
      </Row>
      <Row v-if="!isEditMode" :gutter="24">
        <Col :span="24">
          <FormItem label="状态" name="status">
            <Select
              v-model:value="model.status"
              allow-clear
              class="w-full"
              :options="statusOptions"
              placeholder="请选择状态"
            />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="24">
        <Col :span="24">
          <FormItem label="排序" name="sort">
            <InputNumber
              v-model:value="model.sort"
              class="w-full"
              placeholder="请输入排序"
              :min="0"
              :style="{ width: '100%' }"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
    <template #footer>
      <Space :size="16">
        <Button @click="close">取消</Button>
        <Button type="primary" :loading="loading" @click="onSubmit">
          确定
        </Button>
      </Space>
    </template>
  </Modal>
</template>
