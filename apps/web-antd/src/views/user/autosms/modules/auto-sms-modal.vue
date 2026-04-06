<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';

import type { SmsTaskRow, SmsTaskSaveBody } from '../useApi';
import {
  createSmsTaskApi,
  fetchSmsConfigListApi,
  updateSmsTaskApi,
} from '../useApi';
import { SMS_MODE_OPTIONS } from '../data';
import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Radio,
  RadioGroup,
  Row,
  Select,
  Space,
  TimeRangePicker,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  opentype: 'add' | 'edit';
  row?: SmsTaskRow | null;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const mode = ref<number | undefined>(undefined);
const status = ref<number>(2);
const config_id = ref<number | string | undefined>(undefined);
const content = ref('');
const dayType = ref(1);
const timeRange = ref<[Dayjs, Dayjs] | undefined>(undefined);
const configOptions = ref<{ label: string; value: number }[]>([]);

async function loadConfigs() {
  try {
    const list = await fetchSmsConfigListApi();
    configOptions.value = list.map((x) => ({ label: x.name, value: x.id }));
  } catch {
    configOptions.value = [];
  }
}

function resetModel() {
  mode.value = undefined;
  status.value = 2;
  config_id.value = undefined;
  content.value = '';
  dayType.value = 1;
  timeRange.value = undefined;
}

async function initFromRow() {
  await nextTick();
  if (props.opentype === 'edit' && props.row?.id != null) {
    const r = props.row;
    mode.value = r.mode ?? undefined;
    status.value = r.status ?? 2;
    config_id.value =
      r.config_id === 0 || r.config_id == null ? undefined : r.config_id;
    content.value = r.content ?? '';
    if (r.start_time === '00:00:00' && r.end_time === '23:59:59') {
      dayType.value = 1;
      timeRange.value = undefined;
    } else {
      dayType.value = 2;
      if (r.start_time && r.end_time) {
        timeRange.value = [
          dayjs(r.start_time, 'HH:mm:ss'),
          dayjs(r.end_time, 'HH:mm:ss'),
        ];
      } else {
        timeRange.value = undefined;
      }
    }
    return;
  }
  resetModel();
}

watch(open, (v) => {
  if (v) {
    void loadConfigs();
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

const title = computed(() =>
  props.opentype === 'edit' ? '编辑自动短信' : '新增自动短信',
);

async function handleOk() {
  let start_time = '00:00:00';
  let end_time = '23:59:59';
  if (dayType.value === 2) {
    if (!timeRange.value || timeRange.value.length !== 2) {
      message.warning('请选择发送时间段');
      return;
    }
    start_time = timeRange.value[0].format('HH:mm:ss');
    end_time = timeRange.value[1].format('HH:mm:ss');
  }

  if (mode.value == null) {
    message.warning('请选择用户类型');
    return;
  }
  if (config_id.value == null || config_id.value === '') {
    message.warning('请选择通道名称');
    return;
  }
  if (!String(content.value).trim()) {
    message.warning('请填写短信内容');
    return;
  }

  const body: SmsTaskSaveBody = {
    mode: mode.value,
    status: status.value,
    config_id: config_id.value,
    start_time,
    end_time,
    content: String(content.value).trim(),
  };

  loading.value = true;
  try {
    if (props.opentype === 'edit' && props.row?.id != null) {
      await updateSmsTaskApi({ ...body, id: props.row.id });
      message.success('操作成功');
    } else {
      await createSmsTaskApi(body);
      message.success('操作成功');
    }
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
    :confirm-loading="loading"
    :title="title"
    :width="440"
    destroy-on-close
    @cancel="close"
  >
    <Form layout="vertical" class="pt-1">
      <Row :gutter="16">
        <Col :span="24">
          <FormItem label="用户类型" required>
            <Select
              v-model:value="mode"
              allow-clear
              :disabled="opentype === 'edit'"
              :options="SMS_MODE_OPTIONS"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="通道名称" required>
            <Select
              v-model:value="config_id"
              allow-clear
              :options="configOptions"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="发送时间段">
            <RadioGroup v-model:value="dayType">
              <Radio :value="1">全天</Radio>
              <Radio :value="2">自定义</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
        <Col v-if="dayType === 2" :span="24">
          <FormItem label=" " :colon="false">
            <TimeRangePicker
              v-model:value="timeRange"
              class="w-full"
              format="HH:mm:ss"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="短信内容" required>
            <Input.TextArea
              v-model:value="content"
              :auto-size="{ minRows: 3, maxRows: 8 }"
              allow-clear
              placeholder="短信正文"
            />
          </FormItem>
        </Col>
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
