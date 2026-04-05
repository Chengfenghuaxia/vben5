<script lang="ts" setup>
import { nextTick, reactive, ref, watch } from 'vue';

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

import {
  getFinChannelConfigApi,
  unwrapFinChannelConfigPayload,
  updateFinChannelConfigApi,
} from '../../useApi';

import {
  finChannelConfigInputNumberStyle,
  requiredInput,
  requiredNumber,
} from './required';

defineOptions({ name: 'FinanceChannelQqpayForm' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{ rowCode: string }>();

const emit = defineEmits<{ success: [] }>();

const model = reactive({
  api: '',
  mch_id: '',
  type_id: undefined as number | undefined,
  public_key: '',
  private_key: '',
  sys_public_key: '',
});

const loading = ref(false);
const formRef = ref();

const rules = {
  api: requiredInput,
  mch_id: requiredInput,
  type_id: requiredNumber,
  public_key: requiredInput,
  private_key: requiredInput,
  sys_public_key: requiredInput,
};

watch(
  open,
  async (v) => {
    if (!v) {
      return;
    }
    Object.assign(model, {
      api: '',
      mch_id: '',
      type_id: undefined,
      public_key: '',
      private_key: '',
      sys_public_key: '',
    });
    await nextTick();
    formRef.value?.resetFields?.();
    try {
      const raw = await getFinChannelConfigApi({ code: props.rowCode });
      const data = unwrapFinChannelConfigPayload(raw);
      const block = data.qqpay;
      if (block && typeof block === 'object') {
        Object.assign(model, block as object);
      }
    } catch {
      message.error('加载配置失败');
    }
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
    await updateFinChannelConfigApi({
      code: props.rowCode,
      qqpay: { ...model },
    });
    message.success('更新成功');
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
    title="支付通道配置"
    :width="400"
    destroy-on-close
    @cancel="close"
  >
    <Form ref="formRef" layout="vertical" :model="model" :rules="rules">
      <Row :gutter="24">
        <Col :span="24">
          <FormItem label="请求域名" name="api">
            <Input
              v-model:value="model.api"
              class="w-full"
              placeholder="请输入请求域名"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="商户编码" name="mch_id">
            <Input
              v-model:value="model.mch_id"
              class="w-full"
              placeholder="请输入商户号"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="通道ID" name="type_id">
            <InputNumber
              v-model:value="model.type_id"
              :style="finChannelConfigInputNumberStyle"
              placeholder="请输入通道ID"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="公钥" name="public_key">
            <Input
              v-model:value="model.public_key"
              class="w-full"
              placeholder="请输入公钥"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="私钥" name="private_key">
            <Input
              v-model:value="model.private_key"
              class="w-full"
              placeholder="请输入私钥"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="系统公钥" name="sys_public_key">
            <Input
              v-model:value="model.sys_public_key"
              class="w-full"
              placeholder="请输入系统公钥"
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
