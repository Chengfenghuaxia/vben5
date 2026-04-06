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
  Space,
  message,
} from 'ant-design-vue';

import { fetchSmsConfigFirstRowApi, updateSmsConfigApi } from '../useApi';

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);

const model = reactive({
  id: undefined as number | undefined,
  name: '',
  password: '',
  sp_id: undefined as number | undefined,
  trigger: undefined as number | undefined,
  unit_price: undefined as number | undefined,
  url: '',
});

function resetModel() {
  model.id = undefined;
  model.name = '';
  model.password = '';
  model.sp_id = undefined;
  model.trigger = undefined;
  model.unit_price = undefined;
  model.url = '';
}

async function loadConfig() {
  const row = await fetchSmsConfigFirstRowApi();
  resetModel();
  if (!row) {
    return;
  }
  model.id =
    row.id != null && Number.isFinite(Number(row.id))
      ? Number(row.id)
      : undefined;
  model.name = typeof row.name === 'string' ? row.name : String(row.name ?? '');
  model.password =
    typeof row.password === 'string'
      ? row.password
      : String(row.password ?? '');
  model.sp_id =
    row.sp_id != null && Number.isFinite(Number(row.sp_id))
      ? Number(row.sp_id)
      : undefined;
  model.url = typeof row.url === 'string' ? row.url : String(row.url ?? '');
  model.unit_price =
    row.unit_price != null && Number.isFinite(Number(row.unit_price))
      ? Number(row.unit_price)
      : undefined;
  const tr = row.trigger;
  model.trigger =
    tr != null && Number.isFinite(Number(tr)) ? Number(tr) : undefined;
}

watch(open, (v) => {
  if (v) {
    void loadConfig();
  }
});

function close() {
  open.value = false;
}

async function handleOk() {
  if (!String(model.name).trim()) {
    message.warning('请输入通道名称');
    return;
  }
  if (model.sp_id == null || !Number.isFinite(model.sp_id)) {
    message.warning('请输入通道ID');
    return;
  }
  if (!String(model.password).trim()) {
    message.warning('请输入密钥');
    return;
  }
  if (!String(model.url).trim()) {
    message.warning('请输入请求地址');
    return;
  }
  if (model.unit_price == null || !Number.isFinite(model.unit_price)) {
    message.warning('请输入每条单价');
    return;
  }
  if (model.trigger == null || !Number.isFinite(model.trigger)) {
    message.warning('请输入条数预警');
    return;
  }

  loading.value = true;
  try {
    await updateSmsConfigApi({
      id: model.id ?? null,
      name: String(model.name).trim(),
      sp_id: model.sp_id,
      password: String(model.password).trim(),
      url: String(model.url).trim(),
      unit_price: model.unit_price,
      trigger: model.trigger,
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
    title="短信通道配置"
    :width="440"
    destroy-on-close
    :confirm-loading="loading"
    @cancel="close"
  >
    <Form layout="vertical" class="pt-1">
      <Row :gutter="16">
        <Col :span="24">
          <FormItem label="通道名称" required>
            <Input
              v-model:value="model.name"
              allow-clear
              placeholder="通道名称"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="通道ID" required>
            <InputNumber
              v-model:value="model.sp_id"
              style="width: 100%"
              :controls="false"
              placeholder="通道ID"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="密钥" required>
            <Input
              v-model:value="model.password"
              allow-clear
              placeholder="密钥"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="请求地址" required>
            <Input v-model:value="model.url" allow-clear placeholder="URL" />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="每条单价" required>
            <InputNumber
              v-model:value="model.unit_price"
              style="width: 100%"
              :min="0"
              placeholder="单价"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="条数预警" required>
            <InputNumber
              v-model:value="model.trigger"
              style="width: 100%"
              :min="0"
              placeholder="条数预警"
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
