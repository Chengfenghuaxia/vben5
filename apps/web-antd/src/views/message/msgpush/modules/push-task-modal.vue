<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';

import type { PushTaskRow, PushTaskSaveBody } from '../useApi';
import { createPushTaskApi, updatePushTaskApi } from '../useApi';
import { fetchMsgTmplAllListApi } from '../../msgnotification/useApi';
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormItem,
  message,
  Modal,
  Row,
  Select,
  Space,
  TimePicker,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row?: PushTaskRow | null;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const push_type = ref<number | undefined>(undefined);
const msg_type = ref<number | undefined>(undefined);
const user_type = ref<number | undefined>(undefined);
const status = ref<number | undefined>(undefined);
const template_id = ref<number | undefined>(undefined);
const send_type = ref<number | undefined>(undefined);
const cycle = ref<number | undefined>(undefined);
const cycle_days = ref<number[]>([]);
const cycle_time = ref<string | undefined>(undefined);
/** 定时发送：日历控件 */
const sendingPicker = ref<Dayjs | undefined>(undefined);
const editId = ref<null | number>(null);

const tmplOptions = ref<{ label: string; value: number }[]>([]);

const PushOptions = [
  { label: '站内推送', value: 1 },
  { label: '浏览器(PWA)推送', value: 2 },
];
const MsgTypeOptions = [
  { label: '正常', value: 1 },
  { label: '静音', value: 2 },
];
const statusOptions = [
  { label: '正常', value: 1 },
  { label: '停用', value: 2 },
];
const UserOptions = [
  { label: '全体用户', value: 4 },
  { label: '注册30分钟未充值', value: 9 },
  { label: '注册2小时未充值', value: 10 },
  { label: '首充次日未登录', value: 12 },
  { label: '首充3日未登录', value: 13 },
  { label: '首充7日未登录', value: 14 },
  { label: '首充15日未登录', value: 15 },
  { label: '首充30日未登录', value: 16 },
];
const SendOptions = [
  { label: '即时', value: 1 },
  { label: '定时', value: 2 },
  { label: '循环', value: 3 },
];
const cycleOptions = [
  { label: '每天', value: 1 },
  { label: '每周', value: 2 },
];
const cycleDaysOptions = [
  { label: '周日', value: 0 },
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
];

const showMsgTypeField = computed(() => push_type.value !== 1);

async function loadTmplOptions(type: number | undefined) {
  if (type == null) {
    tmplOptions.value = [];
    return;
  }
  try {
    const list = await fetchMsgTmplAllListApi({ tmpl_type: type });
    tmplOptions.value = list.map((x) => ({ label: x.name, value: x.id }));
  } catch {
    tmplOptions.value = [];
  }
}

function onPushTypeChange() {
  template_id.value = undefined;
  if (push_type.value === 1) {
    msg_type.value = 1;
  }
  void loadTmplOptions(push_type.value);
}

function resetModel() {
  push_type.value = undefined;
  msg_type.value = undefined;
  user_type.value = undefined;
  status.value = undefined;
  template_id.value = undefined;
  send_type.value = undefined;
  cycle.value = undefined;
  cycle_days.value = [];
  cycle_time.value = undefined;
  sendingPicker.value = undefined;
  editId.value = null;
  tmplOptions.value = [];
}

function parseSendingAt(raw: unknown): Dayjs | undefined {
  if (raw == null || raw === '') {
    return undefined;
  }
  if (typeof raw === 'number') {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    const d = dayjs(ms);
    return d.isValid() ? d : undefined;
  }
  const s = String(raw);
  const d = dayjs(s);
  return d.isValid() ? d : undefined;
}

async function initFromRow() {
  await nextTick();
  const row = props.row;
  if (row?.id != null) {
    editId.value = row.id;
    push_type.value = row.push_type ?? undefined;
    msg_type.value = row.msg_type ?? undefined;
    user_type.value = row.user_type ?? undefined;
    status.value = row.status ?? undefined;
    template_id.value = row.template_id ?? undefined;
    send_type.value = row.send_type ?? undefined;
    cycle.value = row.cycle ?? undefined;
    cycle_days.value = Array.isArray(row.cycle_days) ? [...row.cycle_days] : [];
    cycle_time.value =
      typeof (row as { cycle_time?: string }).cycle_time === 'string'
        ? (row as { cycle_time?: string }).cycle_time
        : undefined;
    sendingPicker.value = parseSendingAt(row.sending_at);
    await loadTmplOptions(push_type.value);
    return;
  }
  resetModel();
}

watch(open, (v) => {
  if (v) {
    void initFromRow();
  }
});

watch(
  () => props.row,
  () => {
    if (open.value) {
      void initFromRow();
    }
  },
);

function close() {
  open.value = false;
}

function buildSubmitBody(): PushTaskSaveBody | null {
  if (push_type.value == null) {
    message.warning('请选择通知类型');
    return null;
  }
  const effectiveMsgType = push_type.value === 1 ? 1 : msg_type.value;
  if (effectiveMsgType == null) {
    message.warning('请选择消息类型');
    return null;
  }
  if (user_type.value == null) {
    message.warning('请选择用户类型');
    return null;
  }
  if (status.value == null) {
    message.warning('请选择任务状态');
    return null;
  }
  if (template_id.value == null) {
    message.warning('请选择消息模版');
    return null;
  }
  if (send_type.value == null) {
    message.warning('请选择发送类型');
    return null;
  }

  let sending_at: null | string = null;
  if (send_type.value === 2) {
    if (!sendingPicker.value?.isValid?.()) {
      message.warning('请选择发送时间');
      return null;
    }
    sending_at = sendingPicker.value.format('YYYY-MM-DD HH:mm:ss');
  }

  let cycle_time_out: null | string = null;
  if (send_type.value === 3) {
    if (cycle.value == null) {
      message.warning('请选择循环类型');
      return null;
    }
    if (
      cycle.value === 2 &&
      (!cycle_days.value || cycle_days.value.length === 0)
    ) {
      message.warning('请选择循环周期');
      return null;
    }
    if (!cycle_time.value || String(cycle_time.value).trim() === '') {
      message.warning('请选择发送时间');
      return null;
    }
    cycle_time_out =
      typeof cycle_time.value === 'string'
        ? cycle_time.value
        : dayjs(cycle_time.value as string).format('HH:mm:ss');
  }

  const body: PushTaskSaveBody = {
    push_type: push_type.value,
    msg_type: effectiveMsgType,
    user_type: user_type.value,
    status: status.value,
    template_id: template_id.value,
    send_type: send_type.value,
    sending_at,
    cycle: send_type.value === 3 ? cycle.value : null,
    cycle_days: send_type.value === 3 ? [...cycle_days.value] : [],
    cycle_time: cycle_time_out,
  };

  return body;
}

async function handleOk() {
  const body = buildSubmitBody();
  if (!body) {
    return;
  }

  loading.value = true;
  try {
    if (editId.value != null) {
      await updatePushTaskApi({ ...body, id: editId.value });
      message.success('修改成功');
    } else {
      await createPushTaskApi(body);
      message.success('新增成功');
    }
    open.value = false;
    emit('success');
  } catch {
    /* 拦截器 */
  } finally {
    loading.value = false;
  }
}

const title = computed(() =>
  editId.value != null ? '编辑推送任务' : '新增推送任务',
);
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="loading"
    :title="title"
    :width="440"
    destroy-on-close
    @cancel="close"
  >
    <Form layout="vertical" class="pt-1">
      <Row :gutter="16">
        <Col :span="24">
          <FormItem label="通知类型" required>
            <Select
              v-model:value="push_type"
              allow-clear
              :options="PushOptions"
              placeholder="请选择"
              @change="onPushTypeChange"
            />
          </FormItem>
        </Col>
        <Col v-if="showMsgTypeField" :span="24">
          <FormItem label="消息类型" required>
            <Select
              v-model:value="msg_type"
              allow-clear
              :options="MsgTypeOptions"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="用户类型" required>
            <Select
              v-model:value="user_type"
              allow-clear
              :options="UserOptions"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="任务状态" required>
            <Select
              v-model:value="status"
              allow-clear
              :options="statusOptions"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="消息模版" required>
            <Select
              v-model:value="template_id"
              allow-clear
              :disabled="push_type == null"
              :options="tmplOptions"
              placeholder="请选择消息模版"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="发送类型" required>
            <Select
              v-model:value="send_type"
              allow-clear
              :options="SendOptions"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col v-if="send_type === 2" :span="24">
          <FormItem label="发送时间" required>
            <DatePicker
              v-model:value="sendingPicker"
              class="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              show-time
            />
          </FormItem>
        </Col>
        <template v-if="send_type === 3">
          <Col :span="24">
            <FormItem label="循环类型" required>
              <Select
                v-model:value="cycle"
                allow-clear
                :options="cycleOptions"
                placeholder="请选择"
              />
            </FormItem>
          </Col>
          <Col v-if="cycle === 2" :span="24">
            <FormItem label="循环周期" required>
              <Select
                v-model:value="cycle_days"
                allow-clear
                mode="multiple"
                :max-tag-count="2"
                :options="cycleDaysOptions"
                placeholder="请选择"
              />
            </FormItem>
          </Col>
          <Col :span="24">
            <FormItem label="每日发送时刻" required>
              <TimePicker
                v-model:value="cycle_time"
                class="w-full"
                format="HH:mm:ss"
                value-format="HH:mm:ss"
              />
            </FormItem>
          </Col>
        </template>
      </Row>
    </Form>
    <template #footer>
      <Space :size="12">
        <Button @click="close">取消</Button>
        <Button :loading="loading" type="primary" @click="handleOk"
          >确定</Button
        >
      </Space>
    </template>
  </Modal>
</template>
