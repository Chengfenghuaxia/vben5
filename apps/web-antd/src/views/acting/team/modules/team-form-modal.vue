<script lang="ts" setup>
import type { ActingTeamRow } from '../useApi';

import { computed, ref, watch } from 'vue';

import {
  createActingTeamApi,
  fetchDomainAllListApi,
  updateActingTeamApi,
} from '../useApi';
import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Select,
  Space,
} from 'ant-design-vue';

const props = defineProps<{
  row?: ActingTeamRow | null;
}>();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{ success: [] }>();

type DomainItem = { domain: string; used: 1 | 2 };

const name = ref('');
const domainListWithUsed = ref<DomainItem[]>([]);
const addDomainValue = ref<string | undefined>(undefined);
const domainOptions = ref<{ label: string; value: string }[]>([]);
const loading = ref(false);

const isEdit = computed(() => Boolean(props.row?.id));

const selectedDomains = computed(() =>
  domainListWithUsed.value.map((d) => d.domain),
);

const title = computed(() => (isEdit.value ? '推广总代编辑' : '推广总代新增'));

async function loadDomainOptions() {
  try {
    const list = await fetchDomainAllListApi();
    domainOptions.value = list.map((x) => ({
      label: x.domain,
      value: x.domain,
    }));
  } catch {
    domainOptions.value = [];
  }
}

function initFromRow() {
  const row = props.row;
  name.value = row?.name ?? '';
  const domains = row?.domains;
  if (Array.isArray(domains) && domains.length > 0) {
    domainListWithUsed.value = domains.map((d) => {
      const dom =
        typeof d === 'string'
          ? d
          : String((d as { domain?: string }).domain ?? '');
      const used =
        typeof d === 'object' &&
        d != null &&
        (d as { used?: number }).used === 1
          ? 1
          : 2;
      return { domain: dom, used: used as 1 | 2 };
    });
    return;
  }
  const url = row?.url;
  if (typeof url === 'string' && url.trim()) {
    domainListWithUsed.value = url
      .split(/[,，]\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((domain) => ({ domain, used: 2 as const }));
    return;
  }
  domainListWithUsed.value = [];
}

function reset() {
  name.value = '';
  domainListWithUsed.value = [];
  addDomainValue.value = undefined;
}

function removeDomain(index: number) {
  const item = domainListWithUsed.value[index];
  if (!item || item.used === 1) {
    return;
  }
  domainListWithUsed.value.splice(index, 1);
}

function onAddDomainSelect(val: unknown) {
  const domain = typeof val === 'string' ? val : '';
  if (domain && !selectedDomains.value.includes(domain)) {
    domainListWithUsed.value.push({ domain, used: 2 });
  }
  addDomainValue.value = undefined;
}

async function handleOk() {
  const n = name.value.trim();
  const domain = domainListWithUsed.value.map((d) => d.domain).filter(Boolean);
  if (!n) {
    message.warning('请输入名称');
    return;
  }
  if (domain.length === 0) {
    message.warning('请至少选择一个推广域名');
    return;
  }
  loading.value = true;
  try {
    if (isEdit.value && props.row?.id != null) {
      await updateActingTeamApi({ id: props.row.id, name: n, domain });
      message.success('修改成功');
    } else {
      await createActingTeamApi({ name: n, domain });
      message.success('新增成功');
    }
    open.value = false;
    emit('success');
  } catch {
    /* 错误由 request 拦截器提示 */
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  open.value = false;
}

watch(open, (v) => {
  if (v) {
    void loadDomainOptions();
    if (props.row) {
      initFromRow();
    } else {
      reset();
    }
  }
});

watch(
  () => props.row,
  () => {
    if (open.value && props.row) {
      initFromRow();
    }
  },
);
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="loading"
    :title="title"
    :width="420"
    destroy-on-close
    @cancel="handleCancel"
  >
    <Form layout="vertical" class="pt-2">
      <FormItem label="名称" required>
        <Input v-model:value="name" placeholder="请输入名称" />
      </FormItem>
      <FormItem label="推广域名" required>
        <div class="domain-list-wrap">
          <div
            v-for="(item, index) in domainListWithUsed"
            :key="`${item.domain}-${index}`"
            class="domain-item"
          >
            <span class="domain-text">{{ item.domain }}</span>
            <Button
              v-if="item.used === 2"
              class="domain-remove"
              danger
              size="small"
              type="link"
              @click="removeDomain(index)"
            >
              删除
            </Button>
            <span v-else class="domain-fixed">不可删除</span>
          </div>
          <Select
            v-model:value="addDomainValue"
            :options="
              domainOptions.filter(
                (opt) => !selectedDomains.includes(opt.value),
              )
            "
            allow-clear
            class="w-full"
            placeholder="选择域名添加"
            @change="onAddDomainSelect"
          />
        </div>
      </FormItem>
    </Form>
    <template #footer>
      <Space :size="16">
        <Button @click="handleCancel">取消</Button>
        <Button :loading="loading" type="primary" @click="handleOk"
          >确定</Button
        >
      </Space>
    </template>
  </Modal>
</template>

<style scoped>
.domain-list-wrap {
  width: 100%;
}

.domain-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  margin-bottom: 8px;
  background: var(--ant-color-fill-quaternary, rgb(0 0 0 / 4%));
  border-radius: 6px;
}

.domain-item:last-of-type {
  margin-bottom: 8px;
}

.domain-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.domain-remove {
  flex-shrink: 0;
  padding: 0 4px;
}

.domain-fixed {
  flex-shrink: 0;
  font-size: 12px;
  color: rgb(0 0 0 / 45%);
}
</style>
