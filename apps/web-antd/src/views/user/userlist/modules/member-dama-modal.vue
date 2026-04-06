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
import { adjustSiteMemberTaskApi } from '../useApi';

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

watch(open, (v) => {
  if (v) {
    model.mode = undefined;
    model.amount = undefined;
    model.remark = '';
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
  const sub_mode = model.mode === 5 ? 403 : model.mode === 6 ? 404 : undefined;
  if (sub_mode == null) {
    message.warning('交易类型无效');
    return;
  }
  loading.value = true;
  try {
    await adjustSiteMemberTaskApi({
      amount: model.amount,
      id: props.row.id,
      mode: model.mode,
      remark: String(model.remark ?? '').trim(),
      sub_mode,
    });
    message.success('调整成功');
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
    title="打码量调整"
    :width="440"
    destroy-on-close
    :confirm-loading="loading"
    @cancel="close"
  >
    <p v-if="row" class="mb-3 text-sm text-muted-foreground">
      剩余打码量：{{ row.task_amount ?? '—' }}
    </p>
    <Form layout="vertical" class="pt-1">
      <Row :gutter="16">
        <Col :span="24">
          <FormItem label="交易类型" required>
            <Select
              v-model:value="model.mode"
              allow-clear
              placeholder="请选择"
              :options="[
                { label: '打码增加', value: 5 },
                { label: '打码扣减', value: 6 },
              ]"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="金额" required>
            <InputNumber
              v-model:value="model.amount"
              :min="0"
              placeholder="金额"
              style="width: 100%"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="备注">
            <Input
              v-model:value="model.remark"
              allow-clear
              placeholder="备注"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
    <template #footer>
      <Space>
        <Button @click="close">取消</Button>
        <Button type="primary" :loading="loading" @click="handleOk"
          >确认</Button
        >
      </Space>
    </template>
  </Modal>
</template>
