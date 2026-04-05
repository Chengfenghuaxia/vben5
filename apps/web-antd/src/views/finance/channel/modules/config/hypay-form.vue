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

defineOptions({ name: 'FinanceChannelHypayForm' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{ rowCode: string }>();

const emit = defineEmits<{ success: [] }>();

const model = reactive({
  api: '',
  app_id: '',
  app_secret: '',
  pay_id: '',
});

const loading = ref(false);
const formRef = ref();

const rules = {
  api: requiredInput,
  app_id: requiredInput,
  app_secret: requiredInput,
  pay_id: requiredInput,
};

watch(
  open,
  async (v) => {
    if (!v) {
      return;
    }
    Object.assign(model, { api: '', app_id: '', app_secret: '', pay_id: '' });
    await nextTick();
    formRef.value?.resetFields?.();
    try {
      const raw = await getFinChannelConfigApi({ code: props.rowCode });
      const data = unwrapFinChannelConfigPayload(raw);
      const h = data.hy_pay;
      if (h && typeof h === 'object') {
        const o = h as Record<string, unknown>;
        model.api = o.api != null ? String(o.api) : '';
        model.app_id = o.app_id != null ? String(o.app_id) : '';
        model.app_secret = o.app_secret != null ? String(o.app_secret) : '';
        model.pay_id =
          o.pay_id != null && o.pay_id !== undefined ? String(o.pay_id) : '';
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
      code: 'hypay',
      hy_pay: {
        api: model.api,
        app_id: model.app_id,
        app_secret: model.app_secret,
        pay_id: model.pay_id,
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
    title="HyPay 通道配置"
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
          <FormItem label="AppID (商户号)" name="app_id">
            <Input
              v-model:value="model.app_id"
              class="w-full"
              placeholder="请输入 AppID"
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
        <Col :span="24">
          <FormItem label="支付ID" name="pay_id">
            <Input
              v-model:value="model.pay_id"
              class="w-full"
              placeholder="请输入支付ID"
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
