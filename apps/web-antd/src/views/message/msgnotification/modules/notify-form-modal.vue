<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';

import type { SiteNotifyRow } from '../useApi';
import {
  createSiteNotifyApi,
  fetchMsgTmplAllListApi,
  updateSiteNotifyApi,
} from '../useApi';
import { NOTIFY_TYPE_OPTIONS, SCENE_OPTIONS } from '../data';
import {
  Button,
  Col,
  Form,
  FormItem,
  message,
  Modal,
  Row,
  Select,
  Space,
} from 'ant-design-vue';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row?: SiteNotifyRow | null;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);

const STATUS_OPTIONS = [
  { label: '正常', value: 1 },
  { label: '禁用', value: 2 },
];

const ACTIVE_OPTIONS = [
  { label: '累计充值', value: 'accumulated_deposit' },
  { label: '充值大酬宾', value: 'big_offer' },
  { label: '红包雨', value: 'red_envelope_rain' },
  { label: '刮刮乐', value: 'scratch_card' },
  { label: '超级会员日', value: 'super_member_day' },
  { label: '周补偿金', value: 'weekly_benefit' },
];

const USER_TYPE_FULL = [
  { label: '全体用户', value: 4 },
  { label: '注册30分钟未充值', value: 9 },
  { label: '注册2小时未充值', value: 10 },
  { label: '首充次日未登录', value: 12 },
  { label: '首充3日未登录', value: 13 },
  { label: '首充7日未登录', value: 14 },
  { label: '首充15日未登录', value: 15 },
  { label: '首充30日未登录', value: 16 },
];

const notify_type = ref<number | undefined>(undefined);
const user_type = ref<number | undefined>(undefined);
const scene = ref<number | undefined>(undefined);
const related_code = ref('');
const template_id = ref<number | undefined>(undefined);
const status = ref<number | undefined>(1);
const editId = ref<null | number>(null);

const tmplOptions = ref<{ label: string; value: number }[]>([]);
const userTypeOptions = ref([...USER_TYPE_FULL]);

const filteredSceneOptions = computed(() => {
  if (notify_type.value === 1) {
    return SCENE_OPTIONS;
  }
  return SCENE_OPTIONS.filter((o) => o.value !== 7);
});

const isUserTypeDisabled = computed(() => scene.value === 7);

const showActivitySelect = computed(() => scene.value === 5 || scene.value === 6);

function resetModel() {
  notify_type.value = undefined;
  user_type.value = undefined;
  scene.value = undefined;
  related_code.value = '';
  template_id.value = undefined;
  status.value = 1;
  editId.value = null;
  userTypeOptions.value = [...USER_TYPE_FULL];
  tmplOptions.value = [];
}

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

function onNotifyTypeChange() {
  template_id.value = undefined;
  if (scene.value === 7 && notify_type.value !== 1) {
    scene.value = undefined;
    user_type.value = undefined;
  }
  if (notify_type.value == null) {
    scene.value = undefined;
    user_type.value = undefined;
    tmplOptions.value = [];
    return;
  }
  void loadTmplOptions(notify_type.value);
}

function rebuildUserTypeForScene(sc: number | undefined) {
  if (sc === 7) {
    userTypeOptions.value = [{ label: '全体用户', value: 4 }];
    user_type.value = 4;
    return;
  }
  if (sc == null) {
    user_type.value = undefined;
    return;
  }
  if (sc < 5) {
    userTypeOptions.value = [{ label: '全体用户', value: 4 }];
  } else {
    userTypeOptions.value = [...USER_TYPE_FULL];
  }
  if (!userTypeOptions.value.some((o) => o.value === user_type.value)) {
    user_type.value = undefined;
  }
}

watch(scene, (sc) => {
  rebuildUserTypeForScene(sc);
});

async function initFromRow() {
  await nextTick();
  const row = props.row;
  if (row?.id != null) {
    editId.value = row.id;
    notify_type.value = row.notify_type ?? undefined;
    scene.value = row.scene ?? undefined;
    related_code.value = row.related_code ?? '';
    template_id.value = row.template_id ?? undefined;
    status.value = row.status ?? 1;
    const ut = row.user_type ?? undefined;
    rebuildUserTypeForScene(scene.value);
    if (ut != null && userTypeOptions.value.some((o) => o.value === ut)) {
      user_type.value = ut;
    }
    await loadTmplOptions(notify_type.value);
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
  if (notify_type.value == null) {
    message.warning('请选择通知类型');
    return;
  }
  if (scene.value == null) {
    message.warning('请选择场景');
    return;
  }
  if (user_type.value == null) {
    message.warning('请选择用户类型');
    return;
  }
  if (template_id.value == null) {
    message.warning('请选择消息模板');
    return;
  }
  if (status.value == null) {
    message.warning('请选择状态');
    return;
  }
  if (showActivitySelect.value && !String(related_code.value).trim()) {
    message.warning('请选择活动');
    return;
  }

  const body = {
    notify_type: notify_type.value,
    scene: scene.value,
    user_type: user_type.value,
    template_id: template_id.value,
    status: status.value,
    related_code: related_code.value || '',
  };

  loading.value = true;
  try {
    if (editId.value != null) {
      await updateSiteNotifyApi({ ...body, id: editId.value });
      message.success('修改成功');
    } else {
      await createSiteNotifyApi(body);
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

const title = computed(() => (editId.value != null ? '编辑消息通知' : '新增消息通知'));
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
              v-model:value="notify_type"
              allow-clear
              :options="NOTIFY_TYPE_OPTIONS"
              placeholder="请选择通知类型"
              @change="onNotifyTypeChange"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="场景" required>
            <Select
              v-model:value="scene"
              allow-clear
              :disabled="notify_type == null"
              :options="filteredSceneOptions"
              placeholder="请选择场景"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="用户类型" required>
            <Select
              v-model:value="user_type"
              allow-clear
              :disabled="scene == null || isUserTypeDisabled"
              :options="userTypeOptions"
              placeholder="请选择用户类型"
            />
          </FormItem>
        </Col>
        <Col v-if="showActivitySelect" :span="24">
          <FormItem label="活动" required>
            <Select
              v-model:value="related_code"
              allow-clear
              :options="ACTIVE_OPTIONS"
              placeholder="请选择活动"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="消息模板" required>
            <Select
              v-model:value="template_id"
              allow-clear
              :disabled="notify_type == null"
              :options="tmplOptions"
              placeholder="请选择消息模板"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem label="状态" required>
            <Select
              v-model:value="status"
              :options="STATUS_OPTIONS"
              placeholder="请选择状态"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
    <template #footer>
      <Space :size="12">
        <Button @click="close">取消</Button>
        <Button :loading="loading" type="primary" @click="handleOk">确定</Button>
      </Space>
    </template>
  </Modal>
</template>
