<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  FormItem,
  Input,
  Modal,
  Space,
  message,
} from 'ant-design-vue';

import type { SiteMemberRow } from '../useApi';
import {
  updateSiteMemberRemarkApi,
  updateSiteMemberStatusApi,
  updateSiteMemberWithdrawalStatusApi,
} from '../useApi';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  opentype: 'updatestatus' | 'updatewithdraw' | 'updaterem';
  row: null | SiteMemberRow;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);

const model = reactive({
  remark: '',
});

watch(open, (v) => {
  if (v && props.row) {
    model.remark =
      props.opentype === 'updaterem'
        ? String(props.row.remark ?? '')
        : '';
  }
});

function close() {
  open.value = false;
}

async function handleOk() {
  if (!props.row) {
    return;
  }
  const remark = String(model.remark ?? '').trim();
  if (!remark) {
    message.warning('请输入备注');
    return;
  }
  loading.value = true;
  try {
    if (props.opentype === 'updatestatus') {
      await updateSiteMemberStatusApi({
        id: props.row.id,
        remark,
        status: 2,
      });
    } else if (props.opentype === 'updatewithdraw') {
      await updateSiteMemberWithdrawalStatusApi({
        id: props.row.id,
        remark,
        withdraw_status: 2,
      });
    } else {
      await updateSiteMemberRemarkApi({ id: props.row.id, remark });
    }
    message.success('修改成功');
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
    :title="
      opentype === 'updaterem'
        ? '修改备注'
        : opentype === 'updatewithdraw'
          ? '提现状态备注'
          : '禁用账号备注'
    "
    :width="440"
    destroy-on-close
    :confirm-loading="loading"
    @cancel="close"
  >
    <Form layout="vertical" class="pt-1">
      <FormItem label="备注" required>
        <Input.TextArea
          v-model:value="model.remark"
          :rows="4"
          allow-clear
          placeholder="请输入备注"
        />
      </FormItem>
    </Form>
    <template #footer>
      <Space>
        <Button @click="close">取消</Button>
        <Button type="primary" :loading="loading" @click="handleOk">确认</Button>
      </Space>
    </template>
  </Modal>
</template>
