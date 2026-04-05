<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Button, Form, Input, message, Modal, Space } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const form = reactive({
  auth_code: '',
  password: '',
  username: '',
});

const bindVisible = ref(false);
const bindAuthCode = ref('');
const bindQrcode = ref('');
const bindSecret = ref('');
const bindSubmitting = ref(false);

async function handleSubmit() {
  if (!form.username?.trim()) {
    message.warning('请输入用户名');
    return;
  }
  if (!form.password) {
    message.warning('请输入密码');
    return;
  }

  const result = await authStore.authLogin({
    auth_code: form.auth_code,
    password: form.password,
    username: form.username,
  });

  if (result.needGoogleBind && result.googleBind) {
    bindQrcode.value = result.googleBind.qrcode;
    bindSecret.value = result.googleBind.secret ?? '';
    bindAuthCode.value = '';
    bindVisible.value = true;
  }
}

function copySecret() {
  if (!bindSecret.value) {
    return;
  }
  void navigator.clipboard.writeText(bindSecret.value).then(
    () => message.success('已复制'),
    () => message.error('复制失败'),
  );
}

async function handleBindConfirm() {
  if (!bindAuthCode.value.trim()) {
    message.warning('请输入授权码');
    return;
  }
  bindSubmitting.value = true;
  try {
    await authStore.bindGoogleAuth(bindAuthCode.value.trim());
    bindVisible.value = false;
  } finally {
    bindSubmitting.value = false;
  }
}
</script>

<template>
  <div class="login-form-panel">
    <Form :model="form" class="max-w-md" layout="vertical" @finish="handleSubmit">
      <Form.Item label="用户名" name="username" required>
        <Input
          v-model:value="form.username"
          autocomplete="username"
          placeholder="用户名"
          size="large"
        />
      </Form.Item>
      <Form.Item label="密码" name="password" required>
        <Input.Password
          v-model:value="form.password"
          autocomplete="current-password"
          placeholder="密码"
          size="large"
        />
      </Form.Item>
      <Form.Item label="谷歌验证码" name="auth_code">
        <Input
          v-model:value="form.auth_code"
          placeholder="如有绑定请输入动态码"
          size="large"
        />
      </Form.Item>
      <Button
        :loading="authStore.loginLoading"
        block
        html-type="submit"
        size="large"
        type="primary"
      >
        登录
      </Button>
    </Form>

    <Modal
      v-model:open="bindVisible"
      :closable="false"
      :mask-closable="false"
      destroy-on-close
      title="谷歌验证绑定"
      width="420px"
    >
      <img
        v-if="bindQrcode"
        :src="bindQrcode"
        alt="auth"
        class="mb-4 w-full max-w-[360px]"
      />
      <Form layout="vertical">
        <Form.Item label="绑定授权码" required>
          <Input
            v-model:value="bindAuthCode"
            placeholder="请输入授权码"
          />
        </Form.Item>
      </Form>
      <template #footer>
        <Space>
          <Button :disabled="!bindSecret" @click="copySecret">
            复制谷歌 Key
          </Button>
          <Button
            :loading="bindSubmitting"
            type="primary"
            @click="handleBindConfirm"
          >
            确定
          </Button>
        </Space>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.login-form-panel {
  width: 100%;
}
</style>
