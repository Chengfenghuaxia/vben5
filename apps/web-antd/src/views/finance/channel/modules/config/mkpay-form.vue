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

defineOptions({ name: 'FinanceChannelMkpayForm' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{ rowCode: string }>();

const emit = defineEmits<{ success: [] }>();

const model = reactive({
  api: '',
  merchant_no: '',
  private_key: '',
});

const loading = ref(false);
const formRef = ref();

const rules = {
  api: requiredInput,
  merchant_no: requiredInput,
  private_key: requiredInput,
};

watch(
  open,
  async (v) => {
    if (!v) {
      return;
    }
    Object.assign(model, { api: '', merchant_no: '', private_key: '' });
    await nextTick();
    formRef.value?.resetFields?.();
    try {
      const raw = await getFinChannelConfigApi({ code: props.rowCode });
      const data = unwrapFinChannelConfigPayload(raw);
      const mk = data.mk_pay;
      if (mk && typeof mk === 'object') {
        Object.assign(model, mk as object);
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
      code: 'mkpay',
      mk_pay: { ...model },
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
          <FormItem label="请求域名地址" name="api">
            <Input
              v-model:value="model.api"
              class="w-full"
              placeholder="请输入请求域名地址"
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
          <FormItem label="私钥" name="private_key">
            <Input
              v-model:value="model.private_key"
              class="w-full"
              placeholder="请输入私钥"
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
