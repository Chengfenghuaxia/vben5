<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  Button,
  Col,
  Form,
  FormItem,
  InputNumber,
  Modal,
  Row,
  Space,
  message,
} from 'ant-design-vue';

import type { SiteMemberRow } from '../useApi';
import { setSiteMemberSuperiorApi } from '../useApi';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row: null | SiteMemberRow;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);

const model = reactive({
  pid: undefined as number | undefined,
});

watch(open, (v) => {
  if (v) {
    model.pid = undefined;
  }
});

function close() {
  open.value = false;
}

async function handleOk() {
  if (!props.row) {
    return;
  }
  if (model.pid == null || !Number.isFinite(model.pid)) {
    message.warning('请输入上级 ID');
    return;
  }
  loading.value = true;
  try {
    await setSiteMemberSuperiorApi({ pid: model.pid, uid: props.row.id });
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
    title="调整上级"
    :width="400"
    destroy-on-close
    :confirm-loading="loading"
    @cancel="close"
  >
    <Form layout="vertical" class="pt-1">
      <Row :gutter="16">
        <Col :span="24">
          <FormItem label="用户 ID">
            <InputNumber
              :value="row?.id"
              disabled
              class="w-full"
              style="width: 100%"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="上级 ID" required>
            <InputNumber
              v-model:value="model.pid"
              :min="0"
              placeholder="上级 ID"
              style="width: 100%"
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
