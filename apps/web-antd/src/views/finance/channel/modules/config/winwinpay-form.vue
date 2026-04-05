<script lang="ts" setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';

import type { FormProps } from 'ant-design-vue';

import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Textarea,
  message,
} from 'ant-design-vue';

import {
  getFinChannelConfigApi,
  unwrapFinChannelConfigPayload,
  updateFinChannelConfigApi,
} from '../../useApi';

import { requiredInput, requiredNumber } from './required';

defineOptions({ name: 'FinanceChannelWinwinpayForm' });

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{ rowCode: string }>();

const emit = defineEmits<{ success: [] }>();

const model = reactive({
  api: '',
  mch_id: '',
  sign_mode: 2 as 1 | 2,
  app_secret: '',
  public_key: '',
  private_key: '',
  sys_public_key: '',
});

const loading = ref(false);
const formRef = ref();

const rules = computed((): FormProps['rules'] => {
  const base: Record<string, typeof requiredInput | typeof requiredNumber> = {
    api: requiredInput,
    mch_id: requiredInput,
    sign_mode: requiredNumber,
  };
  if (model.sign_mode === 1) {
    base.public_key = requiredInput;
    base.private_key = requiredInput;
    base.sys_public_key = requiredInput;
  } else {
    base.app_secret = requiredInput;
  }
  return base;
});

const signModeOptions = [
  { label: 'RSA', value: 1 },
  { label: 'MD5', value: 2, disabled: true },
];

watch(
  open,
  async (v) => {
    if (!v) {
      return;
    }
    Object.assign(model, {
      api: '',
      mch_id: '',
      sign_mode: 2,
      app_secret: '',
      public_key: '',
      private_key: '',
      sys_public_key: '',
    });
    await nextTick();
    formRef.value?.resetFields?.();
    try {
      const raw = await getFinChannelConfigApi({ code: props.rowCode });
      const data = unwrapFinChannelConfigPayload(raw);
      const w = data.win_win_pay;
      if (w && typeof w === 'object') {
        const o = w as Record<string, unknown>;
        model.api = o.api != null ? String(o.api) : '';
        model.mch_id = o.mch_id != null ? String(o.mch_id) : '';
        model.sign_mode = o.sign_mode === 2 ? 2 : 1;
        model.app_secret = o.app_secret != null ? String(o.app_secret) : '';
        model.public_key = o.public_key != null ? String(o.public_key) : '';
        model.private_key = o.private_key != null ? String(o.private_key) : '';
        model.sys_public_key =
          o.sys_public_key != null ? String(o.sys_public_key) : '';
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
    const win_win_pay: Record<string, unknown> = {
      api: model.api,
      mch_id: model.mch_id,
      sign_mode: model.sign_mode,
    };
    if (model.sign_mode === 1) {
      win_win_pay.public_key = model.public_key;
      win_win_pay.private_key = model.private_key;
      win_win_pay.sys_public_key = model.sys_public_key;
    } else {
      win_win_pay.app_secret = model.app_secret;
    }
    await updateFinChannelConfigApi({
      code: 'winwinpay',
      win_win_pay,
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
    title="WinWinPay 通道配置"
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
          <FormItem label="商户号" name="mch_id">
            <Input
              v-model:value="model.mch_id"
              class="w-full"
              placeholder="请输入商户号"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="签名方式" name="sign_mode">
            <Select
              v-model:value="model.sign_mode"
              class="w-full"
              disabled
              :options="signModeOptions"
              placeholder="请选择签名方式"
            />
          </FormItem>
        </Col>
        <template v-if="model.sign_mode === 1">
          <Col :span="24">
            <FormItem label="公钥" name="public_key">
              <Textarea
                v-model:value="model.public_key"
                class="w-full"
                :rows="3"
                placeholder="请输入公钥"
              />
            </FormItem>
          </Col>
          <Col :span="24">
            <FormItem label="私钥" name="private_key">
              <Textarea
                v-model:value="model.private_key"
                class="w-full"
                :rows="3"
                placeholder="请输入私钥"
              />
            </FormItem>
          </Col>
          <Col :span="24">
            <FormItem label="系统公钥" name="sys_public_key">
              <Textarea
                v-model:value="model.sys_public_key"
                class="w-full"
                :rows="3"
                placeholder="请输入系统公钥"
              />
            </FormItem>
          </Col>
        </template>
        <Col v-else :span="24">
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
