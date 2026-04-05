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

defineOptions({ name: 'FinanceChannelSpayForm' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{ rowCode: string }>();

const emit = defineEmits<{ success: [] }>();

const model = reactive({
  api: '',
  merchant_id: '',
  app_secret: '',
  pay_in_code: '',
  pay_out_code: '',
  digits: '',
});

const loading = ref(false);
const formRef = ref();

const rules = {
  api: requiredInput,
  merchant_id: requiredInput,
  app_secret: requiredInput,
  pay_in_code: requiredInput,
  pay_out_code: requiredInput,
  digits: requiredInput,
};

watch(
  open,
  async (v) => {
    if (!v) {
      return;
    }
    Object.assign(model, {
      api: '',
      merchant_id: '',
      app_secret: '',
      pay_in_code: '',
      pay_out_code: '',
      digits: '',
    });
    await nextTick();
    formRef.value?.resetFields?.();
    try {
      const raw = await getFinChannelConfigApi({ code: props.rowCode });
      const data = unwrapFinChannelConfigPayload(raw);
      const s = data.s_pay;
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>;
        model.api = o.api != null ? String(o.api) : '';
        model.merchant_id =
          o.merchant_id != null && o.merchant_id !== undefined
            ? String(o.merchant_id)
            : '';
        model.app_secret = o.app_secret != null ? String(o.app_secret) : '';
        model.pay_in_code =
          o.pay_in_code != null && o.pay_in_code !== undefined
            ? String(o.pay_in_code)
            : '';
        model.pay_out_code =
          o.pay_out_code != null && o.pay_out_code !== undefined
            ? String(o.pay_out_code)
            : '';
        model.digits = o.digits != null ? String(o.digits) : '';
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
      code: 'spay',
      s_pay: {
        api: model.api,
        merchant_id: model.merchant_id,
        app_secret: model.app_secret,
        pay_in_code: model.pay_in_code,
        pay_out_code: model.pay_out_code,
        digits: model.digits,
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
    title="SPay 通道配置"
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
          <FormItem label="商户号" name="merchant_id">
            <Input
              v-model:value="model.merchant_id"
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
        <Col :span="24">
          <FormItem label="代收产品ID" name="pay_in_code">
            <Input
              v-model:value="model.pay_in_code"
              class="w-full"
              placeholder="请输入代收产品ID"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="代付产品ID" name="pay_out_code">
            <Input
              v-model:value="model.pay_out_code"
              class="w-full"
              placeholder="请输入代付产品ID"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="金额保留位数" name="digits">
            <Input
              v-model:value="model.digits"
              class="w-full"
              placeholder="请输入金额保留位数"
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
