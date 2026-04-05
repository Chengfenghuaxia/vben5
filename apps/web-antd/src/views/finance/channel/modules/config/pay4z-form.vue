<script lang="ts" setup>
import { nextTick, reactive, ref, watch } from 'vue';

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

import {
  getFinChannelConfigApi,
  unwrapFinChannelConfigPayload,
  updateFinChannelConfigApi,
} from '../../useApi';

import { requiredInput } from './required';

defineOptions({ name: 'FinanceChannelPay4zForm' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{ rowCode: string }>();

const emit = defineEmits<{ success: [] }>();

const model = reactive({
  api: '',
  merchant_no: '',
  app_secret: '',
});

const loading = ref(false);
const formRef = ref();

const rules = {
  api: requiredInput,
  merchant_no: requiredInput,
  app_secret: requiredInput,
};

watch(
  open,
  async (v) => {
    if (!v) {
      return;
    }
    Object.assign(model, { api: '', merchant_no: '', app_secret: '' });
    await nextTick();
    formRef.value?.resetFields?.();
    try {
      const raw = await getFinChannelConfigApi({ code: props.rowCode });
      const data = unwrapFinChannelConfigPayload(raw);
      const p = data.pay_4z;
      if (p && typeof p === 'object') {
        const o = p as Record<string, unknown>;
        model.api = o.api != null ? String(o.api) : '';
        model.merchant_no = o.merchant_no != null ? String(o.merchant_no) : '';
        model.app_secret = o.app_secret != null ? String(o.app_secret) : '';
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
      code: 'pay4z',
      pay_4z: {
        api: model.api,
        merchant_no: model.merchant_no,
        app_secret: model.app_secret,
      },
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
    title="Pay4z 通道配置"
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
          <FormItem label="商户号" name="merchant_no">
            <Input
              v-model:value="model.merchant_no"
              class="w-full"
              placeholder="请输入商户号"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="秘钥" name="app_secret">
            <Input
              v-model:value="model.app_secret"
              class="w-full"
              placeholder="请输入秘钥"
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
