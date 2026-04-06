<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import { updateSiteMemberWithdrawalInfoApi } from '../useApi';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  /** withdraw_info 数组 */
  rows: Record<string, unknown>[] | null | undefined;
}>();

const emit = defineEmits<{ success: [] }>();

const editOpen = ref(false);
const saving = ref(false);

const model = reactive({
  account_name: '',
  account_no: '',
  account_type: '' as string,
  id: undefined as number | undefined,
  identify_num: '',
  identify_type: '' as string,
});

const ACCOUNT_TYPE_OPTS = [
  { label: 'CPF', value: 'CPF' },
  { label: 'CNPJ', value: 'CNPJ' },
  { label: 'EMAIL', value: 'EMAIL' },
  { label: 'PHONE', value: 'PHONE' },
];

const ID_TYPE_OPTS = [
  { label: 'CPF', value: 'CPF' },
  { label: 'CNPJ', value: 'CNPJ' },
];

function openEdit(row: Record<string, unknown>) {
  model.id =
    row.id != null && Number.isFinite(Number(row.id))
      ? Number(row.id)
      : undefined;
  model.account_type = String(row.account_type ?? '');
  model.account_no = String(row.account_no ?? '');
  model.account_name = String(row.account_name ?? '');
  model.identify_type = String(row.identify_type ?? '');
  model.identify_num = String(row.identify_num ?? '');
  editOpen.value = true;
}

function closeEdit() {
  editOpen.value = false;
}

async function saveEdit() {
  if (model.id == null) {
    message.warning('缺少记录 ID');
    return;
  }
  saving.value = true;
  try {
    await updateSiteMemberWithdrawalInfoApi({ ...model });
    message.success('修改成功');
    editOpen.value = false;
    open.value = false;
    emit('success');
  } catch {
    /* 拦截器 */
  } finally {
    saving.value = false;
  }
}

const columns = [
  { dataIndex: 'account_no', key: 'account_no', title: '银行卡号', width: 160 },
  { dataIndex: 'account_type', key: 'account_type', title: '账号类型', width: 100 },
  {
    dataIndex: 'account_name',
    key: 'account_name',
    title: '账户名',
    width: 120,
  },
  { key: 'action', title: '操作', width: 88 },
];

const dataSource = ref<Record<string, unknown>[]>([]);

watch(
  () => [open.value, props.rows] as const,
  ([isOpen, rows]) => {
    if (isOpen) {
      dataSource.value = Array.isArray(rows) ? [...rows] : [];
    }
  },
  { immediate: true },
);
</script>

<template>
  <Modal
    v-model:open="open"
    title="提现信息"
    width="720px"
    :footer="null"
    destroy-on-close
  >
    <Table
      :columns="columns"
      :data-source="dataSource"
      :pagination="false"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Button size="small" type="link" @click="openEdit(record)">
            编辑
          </Button>
        </template>
      </template>
    </Table>
  </Modal>

  <Modal
    v-model:open="editOpen"
    title="编辑提现信息"
    :width="440"
    destroy-on-close
    :confirm-loading="saving"
    @cancel="closeEdit"
  >
    <Form layout="vertical" class="pt-1">
      <FormItem label="账号类型" required>
        <Select
          v-model:value="model.account_type"
          allow-clear
          :options="ACCOUNT_TYPE_OPTS"
          placeholder="请选择"
        />
      </FormItem>
      <FormItem label="银行卡号" required>
        <Input v-model:value="model.account_no" allow-clear />
      </FormItem>
      <FormItem label="银行卡账户名" required>
        <Input v-model:value="model.account_name" allow-clear />
      </FormItem>
      <FormItem label="证件类型">
        <Select
          v-model:value="model.identify_type"
          allow-clear
          :options="ID_TYPE_OPTS"
          placeholder="请选择"
        />
      </FormItem>
      <FormItem label="证件号码">
        <Input v-model:value="model.identify_num" allow-clear />
      </FormItem>
    </Form>
    <template #footer>
      <Space>
        <Button @click="closeEdit">取消</Button>
        <Button type="primary" :loading="saving" @click="saveEdit">
          确认
        </Button>
      </Space>
    </template>
  </Modal>
</template>
