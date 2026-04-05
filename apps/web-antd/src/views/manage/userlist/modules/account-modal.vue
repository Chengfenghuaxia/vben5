<script lang="ts" setup>
/**
 * 后台用户新增/编辑 — site_ui `manage/userlist/modules/create-user.vue`
 */
import { fetchDepAllListApi } from '#/views/manage/dep/useApi';
import { fetchRoleAllListApi } from '#/views/manage/role/useApi';
import {
  adminAccountAddApi,
  adminAccountUpdateApi,
  fetchAgentAllListApi,
  fetchTeamAllListApi,
} from '#/views/manage/userlist/useApi';
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
  Tooltip,
  message,
} from 'ant-design-vue';
import { computed, nextTick, reactive, ref, watch } from 'vue';

export type ManageAccountRow = Record<string, unknown> & {
  agent_id?: number;
  agent_ids?: number[];
  agent_name?: string;
  dept_id?: number;
  id?: number;
  remark?: string;
  role_id?: number;
  team_id?: number;
  team_ids?: number[];
  username?: string;
};

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row: ManageAccountRow | null;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const formRef = ref();

const model = reactive({
  id: undefined as number | undefined,
  agent_ids: [] as number[],
  auth_status: 1 as number,
  dept_id: undefined as number | undefined,
  remark: '',
  role_id: undefined as number | undefined,
  status: 1 as number,
  team_ids: [] as number[],
  username: '',
});

const depOptions = ref<{ label: string; value: number }[]>([]);
const roleOptions = ref<{ label: string; value: number }[]>([]);
const teamOptions = ref<{ label: string; value: number }[]>([]);
const agentOptions = ref<{ label: string; value: number }[]>([]);

const statusOptions = [
  { label: '开启', value: 1 },
  { label: '关闭', value: 2 },
];
const authOptions = [
  { label: '启用', value: 1 },
  { label: '未启用', value: 2 },
];

const isEdit = computed(() => model.id != null);

const rules = computed((): FormProps['rules'] => ({
  auth_status: [{ required: true, message: '请选择', trigger: 'change' }],
  dept_id: [{ required: true, message: '请选择部门', trigger: 'change' }],
  remark: [{ required: true, message: '请输入备注', trigger: 'blur' }],
  role_id: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  username: [{ required: true, message: '请输入用户名称', trigger: 'blur' }],
}));

async function loadSelects() {
  const [deps, roles, teams] = await Promise.all([
    fetchDepAllListApi(),
    fetchRoleAllListApi(),
    fetchTeamAllListApi(),
  ]);
  depOptions.value = deps.map((x) => ({ label: x.name, value: x.id }));
  roleOptions.value = roles.map((x) => ({ label: x.name, value: x.id }));
  teamOptions.value = teams.map((x) => ({ label: x.name, value: x.id }));
}

async function loadAgents(teamIds: number[]) {
  if (!teamIds.length) {
    agentOptions.value = [];
    return;
  }
  const list = await fetchAgentAllListApi(teamIds);
  agentOptions.value = list.map((x) => ({ label: x.name, value: x.id }));
}

function resetModel() {
  model.id = undefined;
  model.username = '';
  model.dept_id = undefined;
  model.role_id = undefined;
  model.auth_status = 1;
  model.status = 1;
  model.remark = '';
  model.team_ids = [];
  model.agent_ids = [];
  agentOptions.value = [];
}

async function syncFromRow() {
  await nextTick();
  const row = props.row;
  if (row?.id != null) {
    const teamIds =
      Array.isArray(row.team_ids) && row.team_ids.length > 0
        ? row.team_ids.map(Number)
        : row.team_id != null && row.team_id !== 0
          ? [Number(row.team_id)]
          : [];
    let agentIds =
      Array.isArray(row.agent_ids) && row.agent_ids.length > 0
        ? row.agent_ids.map(Number)
        : row.agent_id != null && row.agent_id !== 0
          ? [Number(row.agent_id)]
          : [];
    if (agentIds.length > 0 && row.agent_name) {
      agentOptions.value = [
        { label: String(row.agent_name), value: agentIds[0]! },
      ];
    } else if (row.agent_id && row.agent_name) {
      agentIds = [Number(row.agent_id)];
      agentOptions.value = [
        { label: String(row.agent_name), value: Number(row.agent_id) },
      ];
    }
    model.id = Number(row.id);
    model.username = String(row.username ?? '');
    model.dept_id = row.dept_id != null ? Number(row.dept_id) : undefined;
    model.role_id = row.role_id != null ? Number(row.role_id) : undefined;
    model.auth_status = row.auth_status != null ? Number(row.auth_status) : 1;
    model.status = row.status != null ? Number(row.status) : 1;
    model.remark = String(row.remark ?? '');
    model.team_ids = teamIds;
    model.agent_ids = agentIds;
    if (teamIds.length > 0) {
      await loadAgents(teamIds);
    }
    return;
  }
  resetModel();
}

watch(open, async (v) => {
  if (!v) {
    return;
  }
  await loadSelects();
  await syncFromRow();
  await nextTick();
  formRef.value?.clearValidate?.();
});

function onTeamChange() {
  model.agent_ids = [];
  void loadAgents(model.team_ids);
}

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
    const body = { ...model };
    if (isEdit.value) {
      await adminAccountUpdateApi(body);
      message.success('修改成功');
    } else {
      await adminAccountAddApi(body);
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
</script>

<template>
  <Modal
    v-model:open="open"
    :title="isEdit ? '编辑用户' : '新增用户'"
    :width="800"
    destroy-on-close
    @cancel="close"
  >
    <Form
      ref="formRef"
      layout="vertical"
      :model="model"
      :rules="rules"
      class="pt-1"
    >
      <Row :gutter="24">
        <Col :span="12">
          <FormItem label="用户名称" name="username">
            <Input
              v-model:value="model.username"
              placeholder="请输入用户名称"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="部门" name="dept_id">
            <Select
              v-model:value="model.dept_id"
              allow-clear
              :options="depOptions"
              placeholder="请选择部门"
            />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="24">
        <Col :span="12">
          <FormItem label="状态" name="status">
            <Select
              v-model:value="model.status"
              allow-clear
              :options="statusOptions"
              placeholder="请选择状态"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="角色" name="role_id">
            <Select
              v-model:value="model.role_id"
              allow-clear
              :options="roleOptions"
              placeholder="请选择角色"
            />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="24">
        <Col :span="12">
          <FormItem label="Google Code" name="auth_status">
            <Select
              v-model:value="model.auth_status"
              allow-clear
              :options="authOptions"
              placeholder="请选择授权状态"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="备注" name="remark">
            <Input.TextArea
              v-model:value="model.remark"
              allow-clear
              placeholder="请输入备注"
            />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="24">
        <Col :span="12">
          <FormItem>
            <template #label>
              <span>推广总代</span>
              <Tooltip
                title="未选择推广总代时，默认该账户可查看全部渠道的信息。"
              >
                <span class="ml-1 cursor-help text-muted-foreground">?</span>
              </Tooltip>
            </template>
            <Select
              v-model:value="model.team_ids"
              allow-clear
              mode="multiple"
              :max-tag-count="2"
              :options="teamOptions"
              placeholder="请选择推广总代"
              @change="onTeamChange"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="渠道名称" name="agent_ids">
            <Select
              v-model:value="model.agent_ids"
              allow-clear
              :disabled="!model.team_ids?.length"
              mode="multiple"
              :max-tag-count="2"
              :options="agentOptions"
              placeholder="请选择渠道名称"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
    <template #footer>
      <Space>
        <span class="text-xs text-[#c7c2c2]">用户默认密码 a123456</span>
        <Button @click="close">取消</Button>
        <Button :loading="loading" type="primary" @click="onSubmit">
          确定
        </Button>
      </Space>
    </template>
  </Modal>
</template>
