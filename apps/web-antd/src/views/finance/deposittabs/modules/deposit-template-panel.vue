<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { fetchTeamAllListApi } from '#/views/acting/agent/useApi';
import { fetchDepositTemplateListApi } from '#/views/finance/deposit/useApi';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  depositTemplateAddApi,
  depositTemplateConfigUpdateApi,
  depositTemplateDelApi,
  depositTemplateUpdateTeamApi,
} from '../useApi';

defineOptions({ name: 'FinanceDepositTemplatePanel' });

const emit = defineEmits<{
  change: [templateId: null | number];
}>();

type TemplateItem = {
  displayName: string;
  id: number;
  max?: number;
  min?: number;
  name: string;
  raw: Record<string, unknown>;
  team_ids: number[];
  use_default?: number;
};

const templates = ref<TemplateItem[]>([]);
const selectedId = ref<null | number>(null);
const teamOptions = ref<{ label: string; value: number }[]>([]);

const selectedInfo = computed(() => {
  if (selectedId.value == null) {
    return null;
  }
  return templates.value.find((t) => t.id === selectedId.value) ?? null;
});

const isDefaultSelected = computed(() => {
  if (!selectedInfo.value || templates.value.length === 0) {
    return false;
  }
  return (
    selectedInfo.value.use_default === 1 ||
    templates.value[0]?.id === selectedId.value
  );
});

const tableColumns = [
  {
    align: 'center' as const,
    dataIndex: 'name',
    key: 'name',
    title: '模板名称',
  },
  {
    align: 'center' as const,
    dataIndex: 'rechargeRange',
    key: 'rechargeRange',
    title: '充值范围',
  },
  {
    align: 'center' as const,
    key: 'action',
    title: '操作',
    width: 300,
  },
];

const tableData = computed(() => {
  const s = selectedInfo.value;
  if (!s) {
    return [];
  }
  return [
    {
      id: s.id,
      isDefault: isDefaultSelected.value,
      max: s.max,
      min: s.min,
      name: s.name || s.displayName,
    },
  ];
});

function extractTeamIds(item: Record<string, unknown>): number[] {
  const teams = item.teams;
  if (Array.isArray(teams) && teams.length > 0) {
    return teams
      .map((x: unknown) => {
        if (x && typeof x === 'object' && 'id' in x) {
          return Number((x as { id: unknown }).id);
        }
        return NaN;
      })
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  const team_ids = item.team_ids;
  if (Array.isArray(team_ids)) {
    return team_ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  }
  if (item.team_id != null) {
    const n = Number(item.team_id);
    return Number.isFinite(n) && n > 0 ? [n] : [];
  }
  return [];
}

async function displayNameFor(item: Record<string, unknown>): Promise<string> {
  if (item.use_default === 1) {
    return '默认充值模板';
  }
  const ids = extractTeamIds(item);
  if (ids.length === 0 && item.team_name) {
    return String(item.team_name);
  }
  const names = ids
    .map((id) => teamOptions.value.find((o) => o.value === id)?.label ?? '')
    .filter(Boolean);
  if (names.length > 0) {
    return names.join('/');
  }
  return '默认模板';
}

async function processRawList(rawList: Record<string, unknown>[]) {
  if (teamOptions.value.length === 0) {
    try {
      const list = await fetchTeamAllListApi({});
      teamOptions.value = list.map((x) => ({
        label: x.name ?? String(x.id),
        value: x.id,
      }));
    } catch {
      teamOptions.value = [];
    }
  }
  const out: TemplateItem[] = [];
  for (const item of rawList) {
    const id = Number(item.id);
    if (!Number.isFinite(id)) {
      continue;
    }
    const displayName = await displayNameFor(item);
    out.push({
      displayName,
      id,
      max: item.max != null ? Number(item.max) : undefined,
      min: item.min != null ? Number(item.min) : undefined,
      name: String(item.name ?? item.template_name ?? displayName),
      raw: item,
      team_ids: extractTeamIds(item),
      use_default:
        item.use_default != null ? Number(item.use_default) : undefined,
    });
  }
  const defIdx = out.findIndex(
    (t) => t.use_default === 1 || t.displayName === '默认充值模板',
  );
  if (defIdx > 0) {
    const moved = out.splice(defIdx, 1)[0];
    if (moved) {
      moved.displayName = '默认充值模板';
      out.unshift(moved);
    }
  } else if (defIdx === 0 && out[0]) {
    out[0].displayName = '默认充值模板';
  }
  return out;
}

async function loadTemplates() {
  try {
    const raw = await fetchDepositTemplateListApi({});
    const arr = Array.isArray(raw) ? raw : [];
    const asObj = arr.map((r) => ({ ...(r as object) })) as Record<
      string,
      unknown
    >[];
    templates.value = await processRawList(asObj);
    if (templates.value.length === 0) {
      selectedId.value = null;
      emit('change', null);
      return;
    }
    const pick =
      templates.value.find((t) => t.use_default === 1) ?? templates.value[0];
    if (pick) {
      selectedId.value = pick.id;
      emit('change', pick.id);
    }
  } catch {
    templates.value = [];
    message.error('加载充值模板失败');
  }
}

function onPick(id: number) {
  if (selectedId.value === id) {
    return;
  }
  selectedId.value = id;
  emit('change', id);
}

const tplModalOpen = ref(false);
const tplSaving = ref(false);
const cfgSaving = ref(false);
const tplEditingId = ref<null | number>(null);
const tplForm = reactive({
  name: '',
  team_ids: [] as number[],
  use_default: undefined as number | undefined,
});
const tplFormRef = ref();

const useDefaultOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 2 },
];

const filteredTeamOptions = computed(() => {
  const used = new Set<number>();
  for (const t of templates.value) {
    if (t.id === tplEditingId.value) {
      continue;
    }
    for (const id of t.team_ids) {
      used.add(id);
    }
  }
  const cur = new Set(tplForm.team_ids);
  return teamOptions.value.filter(
    (o) => !used.has(o.value) || cur.has(o.value),
  );
});

function openAddTemplate() {
  tplEditingId.value = null;
  tplForm.name = '';
  tplForm.team_ids = [];
  tplForm.use_default = undefined;
  tplModalOpen.value = true;
}

function openEditTeam() {
  const s = selectedInfo.value;
  if (!s) {
    message.warning('请先选择模板');
    return;
  }
  tplEditingId.value = s.id;
  tplForm.name = s.name;
  tplForm.team_ids = [...s.team_ids];
  tplForm.use_default = s.use_default;
  tplModalOpen.value = true;
}

async function saveTemplate() {
  try {
    await tplFormRef.value?.validate();
  } catch {
    return;
  }
  tplSaving.value = true;
  try {
    if (tplEditingId.value != null) {
      await depositTemplateUpdateTeamApi({
        id: tplEditingId.value,
        name: tplForm.name || undefined,
        team_ids: tplForm.team_ids,
      });
      message.success('更新成功');
    } else {
      await depositTemplateAddApi({
        name: tplForm.name || undefined,
        team_ids: tplForm.team_ids,
        use_default: tplForm.use_default,
      });
      message.success('新增成功');
    }
    tplModalOpen.value = false;
    await loadTemplates();
  } catch {
    /* 拦截器 */
  } finally {
    tplSaving.value = false;
  }
}

const cfgOpen = ref(false);
const cfgForm = reactive({
  max: undefined as number | undefined,
  min: undefined as number | undefined,
});
const cfgFormRef = ref();

function openConfig() {
  const s = selectedInfo.value;
  if (!s) {
    return;
  }
  cfgForm.min = s.min;
  cfgForm.max = s.max;
  cfgOpen.value = true;
}

async function saveConfig() {
  try {
    await cfgFormRef.value?.validate();
  } catch {
    return;
  }
  const s = selectedInfo.value;
  if (!s) {
    return;
  }
  cfgSaving.value = true;
  try {
    await depositTemplateConfigUpdateApi({
      id: s.id,
      max: cfgForm.max,
      min: cfgForm.min,
    });
    message.success('修改成功');
    cfgOpen.value = false;
    await loadTemplates();
  } catch {
    /* 拦截器 */
  } finally {
    cfgSaving.value = false;
  }
}

function confirmDeleteTemplate() {
  const s = selectedInfo.value;
  if (!s || isDefaultSelected.value) {
    return;
  }
  Modal.confirm({
    onOk: async () => {
      await depositTemplateDelApi({ id: s.id });
      message.success('删除成功');
      await loadTemplates();
    },
    title: '确定删除该模板吗？',
  });
}

onMounted(() => {
  void loadTemplates();
});

defineExpose({
  reload: loadTemplates,
});
</script>

<template>
  <div
    class="border-border mb-4 rounded-lg border bg-[var(--ant-color-bg-container)] p-4"
  >
    <div class="mb-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="font-medium">充值模板列表</span>
        <Tooltip
          title="温馨提示:若总代未设置专属充值模板,系统将自动使用平台默认充值模板。"
        >
          <span
            class="text-muted-foreground inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-current text-xs"
            >?</span
          >
        </Tooltip>
      </div>
      <Button size="small" type="primary" @click="openAddTemplate">
        + 添加充值模板
      </Button>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <button
        v-for="t in templates"
        :key="t.id"
        class="template-chip"
        :class="
          selectedId === t.id
            ? 'template-chip--selected'
            : 'template-chip--plain'
        "
        type="button"
        @click="onPick(t.id)"
      >
        {{
          (t.displayName || t.name).length > 8
            ? `${(t.displayName || t.name).slice(0, 8)}...`
            : t.displayName || t.name
        }}
      </button>
    </div>

    <div v-if="selectedInfo">
      <div class="mb-3 font-medium">
        【{{ selectedInfo.name || selectedInfo.displayName }}】基础配置
      </div>
      <Table
        bordered
        :columns="tableColumns"
        :data-source="tableData"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'rechargeRange'">
            <span class="text-muted-foreground">
              <template v-if="record.min != null">{{ record.min }}</template>
              <template v-if="record.min != null && record.max != null">
                -
              </template>
              <template v-if="record.max != null">{{ record.max }}</template>
            </span>
          </template>
          <template v-if="column.key === 'action'">
            <div class="flex flex-wrap justify-center gap-2">
              <Button
                v-if="!record.isDefault"
                size="small"
                type="link"
                @click="openEditTeam"
              >
                更改总代
              </Button>
              <span
                v-else
                class="text-muted-foreground cursor-not-allowed text-sm"
              >
                更改总代
              </span>
              <Button size="small" type="link" @click="openConfig">
                修改配置
              </Button>
              <Button
                v-if="!record.isDefault"
                danger
                size="small"
                type="link"
                @click="confirmDeleteTemplate"
              >
                删除模板
              </Button>
              <span
                v-else
                class="text-muted-foreground cursor-not-allowed text-sm"
              >
                删除模板
              </span>
            </div>
          </template>
        </template>
      </Table>
    </div>

    <Modal
      v-model:open="tplModalOpen"
      :title="tplEditingId ? '编辑模板' : '添加充值模板'"
      :width="420"
      destroy-on-close
    >
      <Form ref="tplFormRef" layout="vertical" :model="tplForm">
        <FormItem
          label="模板名称"
          name="name"
          :rules="[{ required: true, message: '请输入模板名称' }]"
        >
          <Input
            v-model:value="tplForm.name"
            allow-clear
            placeholder="模板名称"
          />
        </FormItem>
        <FormItem
          label="推广总代"
          name="team_ids"
          :rules="[
            { required: true, message: '请选择推广总代', type: 'array' },
          ]"
        >
          <Select
            v-model:value="tplForm.team_ids"
            allow-clear
            class="w-full"
            :max-tag-count="2"
            mode="multiple"
            :options="filteredTeamOptions"
            placeholder="请选择推广总代"
          />
        </FormItem>
        <FormItem
          v-if="!tplEditingId"
          label="是否复用【默认充值模板】配置项"
          name="use_default"
          :rules="[{ required: true, message: '请选择' }]"
        >
          <Select
            v-model:value="tplForm.use_default"
            allow-clear
            class="w-full"
            :options="useDefaultOptions"
            placeholder="请选择是否复用"
          />
          <div class="text-muted-foreground mt-1 text-xs">
            建议复用「默认充值模板」以便配置；若未复用，请确保已自行完成充值选项配置。
          </div>
        </FormItem>
      </Form>
      <template #footer>
        <Space>
          <Button @click="tplModalOpen = false">取消</Button>
          <Button type="primary" :loading="tplSaving" @click="saveTemplate">
            确定
          </Button>
        </Space>
      </template>
    </Modal>

    <Modal
      v-model:open="cfgOpen"
      title="修改配置"
      :width="400"
      destroy-on-close
    >
      <Form ref="cfgFormRef" layout="vertical" :model="cfgForm">
        <div class="mb-2 font-medium">充值区间范围</div>
        <FormItem
          label="最小值"
          name="min"
          :rules="[
            { required: true, message: '请输入最小值' },
            { type: 'number', message: '请输入数字' },
          ]"
        >
          <InputNumber
            v-model:value="cfgForm.min"
            class="w-full"
            :min="0"
            placeholder="最小值"
            :style="{ width: '100%' }"
          />
        </FormItem>
        <FormItem
          label="最大值"
          name="max"
          :rules="[
            { required: true, message: '请输入最大值' },
            { type: 'number', message: '请输入数字' },
          ]"
        >
          <InputNumber
            v-model:value="cfgForm.max"
            class="w-full"
            :min="0"
            placeholder="最大值"
            :style="{ width: '100%' }"
          />
        </FormItem>
      </Form>
      <template #footer>
        <Space>
          <Button @click="cfgOpen = false">取消</Button>
          <Button type="primary" :loading="cfgSaving" @click="saveConfig">
            确定
          </Button>
        </Space>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.template-chip {
  padding: 8px 16px;
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  border-radius: 4px;
  transition:
    color 0.2s,
    background-color 0.2s,
    border-color 0.2s;
}

.template-chip--plain {
  color: var(--ant-color-text);
  background-color: var(--ant-color-fill-tertiary, rgb(0 0 0 / 6%));
  border: 1px solid var(--ant-color-border);
}

.template-chip--plain:hover {
  color: #1890ff;
  border-color: #1890ff;
}

/**
 * 与 site_ui `template-filter.vue` 一致：选中用固定高饱和主色底 + 白字，
 * 不跟随时下主题的 `--ant-color-primary`（深色主题里 token 可能与背景拉不开）
 */
.template-chip--selected {
  font-weight: 600;
  color: #fff;
  background-color: #1890ff;
  border: 1px solid #1890ff;
}

.template-chip--selected:hover {
  color: #fff;
  background-color: #40a9ff;
  border-color: #40a9ff;
}
</style>
