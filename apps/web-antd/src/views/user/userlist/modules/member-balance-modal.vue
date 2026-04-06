<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  message,
} from 'ant-design-vue';

import type { SiteMemberRow } from '../useApi';
import { adjustSiteMemberBalanceApi } from '../useApi';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row: null | SiteMemberRow;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);

const model = reactive({
  amount: undefined as number | undefined,
  mode: undefined as number | undefined,
  remark: '',
});

function reset() {
  model.mode = undefined;
  model.amount = undefined;
  model.remark = '';
}

watch(open, (v) => {
  if (v) {
    reset();
  }
});

function close() {
  open.value = false;
}

async function handleOk() {
  if (!props.row) {
    return;
  }
  if (model.mode == null) {
    message.warning('请选择交易类型');
    return;
  }
  if (model.amount == null || !Number.isFinite(model.amount)) {
    message.warning('请输入金额');
    return;
  }
  loading.value = true;
  try {
    await adjustSiteMemberBalanceApi({
      amount: model.amount,
      id: props.row.id,
      mode: model.mode,
      remark: String(model.remark ?? '').trim(),
    });
    message.success('操作成功');
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
    title="余额调整"
    :width="440"
    destroy-on-close
    :confirm-loading="loading"
    @cancel="close"
  >
    <Form layout="vertical" class="pt-1">
      <Row :gutter="16">
        <Col :span="24">
          <FormItem label="交易类型" required>
            <Select
              v-model:value="model.mode"
              allow-clear
              placeholder="请选择"
              :options="[
                { label: '加钱', value: 1 },
                { label: '扣钱', value: 2 },
              ]"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="金额" required>
            <InputNumber
              v-model:value="model.amount"
              class="w-full"
              :min="0"
              placeholder="金额"
              style="width: 100%"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="备注">
            <Input v-model:value="model.remark" allow-clear placeholder="备注" />
          </FormItem>
        </Col>
      </Row>
    </Form>
    <template #footer>
      <Space>
        <Button @click="close">取消</Button>
        <Button type="primary" :loading="loading" @click="handleOk">确认</Button>
      </Space>
    </template>
  </Modal>
</template>
