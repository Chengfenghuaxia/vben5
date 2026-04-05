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

import type { WithdrawalTabRow } from '../useApi';

import { addWithdrawalTabApi, updateWithdrawalTabApi } from '../useApi';

defineOptions({ name: 'FinanceWithdrawalOptionModal' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row: WithdrawalTabRow | null;
}>();

const emit = defineEmits<{ success: [] }>();

const model = reactive({
  id: undefined as number | undefined,
  amount: undefined as number | undefined,
  sort: undefined as number | undefined,
  status: undefined as number | undefined,
});

const loading = ref(false);
const formRef = ref();

const statusOptions = [
  { label: '开启', value: 1 },
  { label: '关闭', value: 2 },
];

const rules = computed((): FormProps['rules'] => {
  const r: FormProps['rules'] = {
    amount: [{ required: true, message: '请输入提现金额', trigger: 'blur' }],
    sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  };
  if (model.id == null) {
    r.status = [{ required: true, message: '请选择状态', trigger: 'change' }];
  }
  return r;
});

const isEditMode = computed(() => model.id != null);

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
      sort: toOptionalNumber(props.row.sort),
      status: props.row.status,
    });
    return;
  }
  Object.assign(model, {
    id: undefined,
    amount: undefined,
    sort: undefined,
    status: undefined,
  });
}

watch(
  () => open.value,
  async (v) => {
    if (!v) {
      return;
    }
    await syncFromProps();
    await nextTick();
    /** 回显后 resetFields 会清空 amount/sort */
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
      await updateWithdrawalTabApi({ ...model });
      message.success('修改成功');
    } else {
      await addWithdrawalTabApi({ ...model });
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
    :title="isEditMode ? '编辑提现选项' : '新增提现选项'"
    :width="400"
    destroy-on-close
    @cancel="close"
  >
    <Form ref="formRef" layout="vertical" :model="model" :rules="rules">
      <Row :gutter="24">
        <Col :span="24">
          <FormItem label="提现金额" name="amount">
            <InputNumber
              v-model:value="model.amount"
              class="w-full"
              placeholder="请输入提现金额"
              :min="0"
              :style="{ width: '100%' }"
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
