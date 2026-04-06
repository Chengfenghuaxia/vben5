<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  message,
} from 'ant-design-vue';

import {
  addSiteMemberApi,
  fetchAgentAllListApi,
  fetchTeamAllListApi,
} from '../useApi';

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const teamOpts = ref<{ label: string; value: number }[]>([]);
const agentOpts = ref<{ label: string; value: number }[]>([]);

const model = reactive({
  agent_id: undefined as number | undefined,
  area_code: '',
  avatar: '',
  invite: '',
  nickname: '',
  phone: '',
  pid: undefined as number | undefined,
  pwd: '',
  status: undefined as number | undefined,
  team_id: undefined as number | undefined,
});

async function loadTeams() {
  const list = await fetchTeamAllListApi();
  teamOpts.value = list.map((x) => ({ label: x.name, value: x.id }));
}

async function loadAgents(teamId: number | undefined) {
  agentOpts.value = [];
  model.agent_id = undefined;
  if (teamId == null || !Number.isFinite(teamId)) {
    return;
  }
  const list = await fetchAgentAllListApi({ team_ids: [teamId] });
  agentOpts.value = list.map((x) => ({ label: x.name, value: x.id }));
}

watch(open, (v) => {
  if (v) {
    Object.assign(model, {
      agent_id: undefined,
      area_code: '',
      avatar: '',
      invite: '',
      nickname: '',
      phone: '',
      pid: undefined,
      pwd: '',
      status: 1,
      team_id: undefined,
    });
    void loadTeams();
  }
});

function onTeamChange() {
  void loadAgents(model.team_id);
}

function close() {
  open.value = false;
}

async function handleOk() {
  if (!String(model.phone).trim()) {
    message.warning('请输入手机号码');
    return;
  }
  if (!String(model.area_code).trim()) {
    message.warning('请输入电话区号');
    return;
  }
  if (!String(model.pwd).trim()) {
    message.warning('请输入登录密码');
    return;
  }
  if (model.status == null) {
    message.warning('请选择状态');
    return;
  }
  if (!String(model.invite).trim()) {
    message.warning('请输入邀请码');
    return;
  }
  if (model.team_id == null || !Number.isFinite(model.team_id)) {
    message.warning('请选择推广总代');
    return;
  }
  if (model.agent_id == null || !Number.isFinite(model.agent_id)) {
    message.warning('请选择渠道');
    return;
  }
  loading.value = true;
  try {
    await addSiteMemberApi({
      agent_id: model.agent_id,
      area_code: String(model.area_code).trim(),
      avatar: String(model.avatar ?? '').trim(),
      invite: String(model.invite).trim(),
      nickname: String(model.nickname ?? '').trim(),
      phone: String(model.phone).trim(),
      pid: model.pid != null && Number.isFinite(model.pid) ? model.pid : 0,
      pwd: String(model.pwd).trim(),
      status: model.status,
      team_id: model.team_id,
    });
    message.success('添加成功');
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
    title="新增会员"
    :width="720"
    destroy-on-close
    :confirm-loading="loading"
    @cancel="close"
  >
    <Form layout="vertical" class="pt-1">
      <Row :gutter="16">
        <Col :span="12">
          <FormItem label="上级 ID">
            <InputNumber
              v-model:value="model.pid"
              :min="0"
              placeholder="可选"
              style="width: 100%"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="电话区号" required>
            <Input
              v-model:value="model.area_code"
              allow-clear
              placeholder="区号"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="手机号码" required>
            <Input v-model:value="model.phone" allow-clear :maxlength="11" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="昵称">
            <Input v-model:value="model.nickname" allow-clear />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="头像路径">
            <Input
              v-model:value="model.avatar"
              allow-clear
              placeholder="上传后的相对路径，可选"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="登录密码" required>
            <Input.Password v-model:value="model.pwd" allow-clear />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="状态" required>
            <Select
              v-model:value="model.status"
              :options="[
                { label: '正常', value: 1 },
                { label: '禁用', value: 2 },
              ]"
              placeholder="请选择"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="邀请码" required>
            <Input v-model:value="model.invite" allow-clear />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="推广总代" required>
            <Select
              v-model:value="model.team_id"
              allow-clear
              :options="teamOpts"
              placeholder="请选择"
              show-search
              option-filter-prop="label"
              @change="onTeamChange"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="渠道" required>
            <Select
              v-model:value="model.agent_id"
              allow-clear
              :disabled="!model.team_id"
              :options="agentOpts"
              placeholder="请选择渠道"
              show-search
              option-filter-prop="label"
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
