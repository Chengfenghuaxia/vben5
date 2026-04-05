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

defineOptions({ name: 'FinanceChannelEpayTarspayForm' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{ rowCode: 'epay' | 'tarspay' }>();

const emit = defineEmits<{ success: [] }>();

const modelEpay = reactive({
  api: '',
  app_secret: '',
  app_id: undefined as number | undefined,
  merchant_id: undefined as number | undefined,
  pay_in_code: undefined as number | undefined,
  pay_out_code: undefined as number | undefined,
  code: '',
});

const modelTarspay = reactive({
  api: '',
  mch_no: '',
  public_key: '',
  private_key: '',
  sys_public_key: '',
  code: '',
});

const loading = ref(false);
const formRefEpay = ref();
const formRefTarspay = ref();

const rulesEpay = {
  api: requiredInput,
  app_secret: requiredInput,
  app_id: requiredNumber,
  merchant_id: requiredNumber,
  pay_in_code: requiredNumber,
  pay_out_code: requiredNumber,
};

const rulesTarspay = {
  api: requiredInput,
  mch_no: requiredInput,
  public_key: requiredInput,
  private_key: requiredInput,
  sys_public_key: requiredInput,
};

function resetModels() {
  Object.assign(modelEpay, {
    api: '',
    app_secret: '',
    app_id: undefined,
    merchant_id: undefined,
    pay_in_code: undefined,
    pay_out_code: undefined,
    code: '',
  });
  Object.assign(modelTarspay, {
    api: '',
    mch_no: '',
    public_key: '',
    private_key: '',
    sys_public_key: '',
    code: '',
  });
}

watch(
  open,
  async (v) => {
    if (!v) {
      return;
    }
    resetModels();
    await nextTick();
    formRefEpay.value?.resetFields?.();
    formRefTarspay.value?.resetFields?.();
    try {
      const raw = await getFinChannelConfigApi({ code: props.rowCode });
      const data = unwrapFinChannelConfigPayload(raw);
      if (props.rowCode === 'epay') {
        const block = data.epay;
        if (block && typeof block === 'object') {
          Object.assign(modelEpay, block as object);
        }
      } else {
        const block = data.tars_pay;
        if (block && typeof block === 'object') {
          Object.assign(modelTarspay, block as object);
        }
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
    if (props.rowCode === 'epay') {
      await formRefEpay.value?.validate();
    } else {
      await formRefTarspay.value?.validate();
    }
  } catch {
    return;
  }
  loading.value = true;
  try {
    if (props.rowCode === 'epay') {
      await updateFinChannelConfigApi({
        code: 'epay',
        epay: { ...modelEpay },
      });
    } else {
      modelTarspay.code = 'tarspay';
      await updateFinChannelConfigApi({
        code: 'tarspay',
        tarspay: { ...modelTarspay },
      });
    }
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
    <Form
      v-if="rowCode === 'epay'"
      ref="formRefEpay"
      layout="vertical"
      :model="modelEpay"
      :rules="rulesEpay"
    >
      <Row :gutter="24">
        <Col :span="24">
          <FormItem label="AppID" name="app_id">
            <InputNumber
              v-model:value="modelEpay.app_id"
              :style="finChannelConfigInputNumberStyle"
              placeholder="请输入 AppID"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="秘钥" name="app_secret">
            <Input
              v-model:value="modelEpay.app_secret"
              class="w-full"
              placeholder="请输入秘钥"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="商户号" name="merchant_id">
            <InputNumber
              v-model:value="modelEpay.merchant_id"
              :style="finChannelConfigInputNumberStyle"
              placeholder="请输入商户号"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="代收产品ID" name="pay_in_code">
            <InputNumber
              v-model:value="modelEpay.pay_in_code"
              :style="finChannelConfigInputNumberStyle"
              placeholder="请输入代收产品ID"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="代付产品ID" name="pay_out_code">
            <InputNumber
              v-model:value="modelEpay.pay_out_code"
              :style="finChannelConfigInputNumberStyle"
              placeholder="请输入代付产品ID"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="请求域名地址" name="api">
            <Input
              v-model:value="modelEpay.api"
              class="w-full"
              placeholder="请输入 api"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
    <Form
      v-else
      ref="formRefTarspay"
      layout="vertical"
      :model="modelTarspay"
      :rules="rulesTarspay"
    >
      <Row :gutter="24">
        <Col :span="24">
          <FormItem label="请求域名地址" name="api">
            <Input
              v-model:value="modelTarspay.api"
              class="w-full"
              placeholder="请输入请求域名地址"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="商户号" name="mch_no">
            <Input
              v-model:value="modelTarspay.mch_no"
              class="w-full"
              placeholder="请输入商户号"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="公钥" name="public_key">
            <Input
              v-model:value="modelTarspay.public_key"
              class="w-full"
              placeholder="请输入公钥"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="私钥" name="private_key">
            <Input
              v-model:value="modelTarspay.private_key"
              class="w-full"
              placeholder="请输入私钥"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="系统公钥" name="sys_public_key">
            <Input
              v-model:value="modelTarspay.sys_public_key"
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
