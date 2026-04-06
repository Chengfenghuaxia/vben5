<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';

import type { MsgTmplRow } from '../useApi';
import { createMsgTmplApi, updateMsgTmplApi } from '../useApi';
import { MSG_TMPL_STATUS_OPTIONS, MSG_TMPL_TYPE_OPTIONS } from '../data';
import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
} from 'ant-design-vue';

const LANGUAGE_OPTIONS = [
  { label: '通用', value: 'system' },
  { label: '中文', value: 'zh' },
  { label: '英文', value: 'en' },
  { label: '葡萄牙语(巴西)', value: 'pt' },
  { label: '印地语(印度)', value: 'hi' },
  { label: '乌尔都语(巴基斯坦)', value: 'ur' },
  { label: '西班牙语', value: 'es' },
];

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row?: MsgTmplRow | null;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const language = ref<string | undefined>(undefined);
const name = ref('');
const title = ref('');
const content = ref('');
const image = ref('');
const url = ref('');
const tmpl_type = ref<number | undefined>(undefined);
const status = ref<number | undefined>(1);
const editId = ref<null | number>(null);

function resetModel() {
  language.value = undefined;
  name.value = '';
  title.value = '';
  content.value = '';
  image.value = '';
  url.value = '';
  tmpl_type.value = undefined;
  status.value = 1;
  editId.value = null;
}

async function initFromRow() {
  await nextTick();
  const row = props.row;
  if (row?.id != null) {
    editId.value = row.id;
    language.value = row.language ?? undefined;
    name.value = row.name ?? '';
    title.value = row.title ?? '';
    content.value = row.content ?? '';
    image.value = row.image ?? '';
    url.value = row.url ?? '';
    tmpl_type.value = row.tmpl_type ?? undefined;
    status.value = row.status ?? 1;
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

async function handleOk() {
  if (language.value == null || String(language.value).trim() === '') {
    message.warning('请选择语言');
    return;
  }
  if (!String(name.value).trim()) {
    message.warning('请填写模板名称');
    return;
  }
  if (!String(image.value).trim()) {
    message.warning('请填写消息图片路径或上传后文件名');
    return;
  }
  if (tmpl_type.value == null) {
    message.warning('请选择类型');
    return;
  }
  if (!String(title.value).trim()) {
    message.warning('请填写标题');
    return;
  }
  if (status.value == null) {
    message.warning('请选择状态');
    return;
  }
  if (!String(content.value).trim()) {
    message.warning('请填写内容');
    return;
  }
  if (!String(url.value).trim()) {
    message.warning('请填写跳转链接');
    return;
  }

  const body = {
    site: 'system',
    language: String(language.value).trim(),
    name: String(name.value).trim(),
    title: String(title.value).trim(),
    content: String(content.value),
    image: String(image.value).trim(),
    url: String(url.value).trim(),
    tmpl_type: tmpl_type.value,
    status: status.value,
  };

  loading.value = true;
  try {
    if (editId.value != null) {
      await updateMsgTmplApi({ ...body, id: editId.value });
      message.success('修改成功');
    } else {
      await createMsgTmplApi(body);
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

const modalTitle = computed(() =>
  editId.value != null ? '编辑消息模板' : '新增消息模板',
);
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="loading"
    :title="modalTitle"
    :width="600"
    destroy-on-close
    @cancel="close"
  >
    <Form layout="vertical" class="pt-1">
      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="语言" required>
            <Select
              v-model:value="language"
              allow-clear
              :options="LANGUAGE_OPTIONS"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="状态" required>
            <Select
              v-model:value="status"
              :options="MSG_TMPL_STATUS_OPTIONS"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="消息类型" required>
            <Select
              v-model:value="tmpl_type"
              allow-clear
              :options="MSG_TMPL_TYPE_OPTIONS"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="模板名称" required>
            <Input v-model:value="name" allow-clear placeholder="名称" />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem
            label="消息图片"
            required
            extra="与 site_ui 一致：填相对路径/文件名；上传走 /site/v1/base/upload 后填入返回的 file_name"
          >
            <Input
              v-model:value="image"
              allow-clear
              placeholder="如 uploads/xxx.png"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="消息标题" required>
            <Input v-model:value="title" allow-clear placeholder="推送标题" />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="跳转链接" required>
            <Input v-model:value="url" allow-clear placeholder="https://..." />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="消息内容" required>
            <Input.TextArea
              v-model:value="content"
              :auto-size="{ minRows: 4, maxRows: 14 }"
              allow-clear
              placeholder="HTML 或占位符，提交体与 site_ui tmplAdd/tmplUpdate 一致"
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
