<script lang="ts" setup>
import type { ActingAgentRow } from '#/api/core/acting-agent';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { fetchActingAgentListApi } from '#/api/core/acting-agent';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { Button, message, Tag } from 'ant-design-vue';
import { ref } from 'vue';
import { SITE_AGENT_PERM } from '#/constants/site-agent-perm';
import { useAgentColumns, useGridFormSchema } from './data';
import AgentForm from './modules/form.vue';
import TestAgentModal from './modules/test-agent-modal.vue';

defineOptions({ name: 'ActingAgent' });

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: AgentForm,
  destroyOnClose: true,
});

const testModalOpen = ref(false);
const testModalRow = ref<ActingAgentRow | null>(null);

const AGENT_TYPE_MAP: Record<number, { color: string; label: string }> = {
  1: { color: 'success', label: 'h5 官网落地页' },
  2: { color: 'warning', label: 'pwa-专属下载页' },
};

const PWA_TYPE_MAP: Record<number, { color: string; label: string }> = {
  1: { color: 'success', label: '开启' },
  2: { color: 'warning', label: '关闭' },
};

const IS_SINGLE_MAP: Record<number, { color: string; label: string }> = {
  1: { color: 'green', label: '是' },
  2: { color: 'orange', label: '否' },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useAgentColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {},
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const teamIds = formValues.team_ids;
          const agentIds = formValues.agent_ids;
          const params: Record<string, unknown> = {
            page: page.currentPage,
            size: page.pageSize,
          };
          if (formValues.agent_type != null && formValues.agent_type !== '') {
            params.agent_type = Number(formValues.agent_type);
          }
          if (Array.isArray(teamIds) && teamIds.length > 0) {
            params.team_ids = teamIds;
          }
          if (Array.isArray(agentIds) && agentIds.length > 0) {
            params.agent_ids = agentIds;
          }
          try {
            const { list, total } = await fetchActingAgentListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载列表失败');
            return {
              items: [],
              page: { total: 0 },
              total: 0,
            };
          }
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<ActingAgentRow>,
});

function onRefresh() {
  gridApi.query();
}

async function copyUrl(text: string | undefined) {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制');
  } catch {
    message.error('复制失败');
  }
}

function openCreate() {
  formDrawerApi.setData({}).open();
}

function openEdit(row: ActingAgentRow) {
  formDrawerApi.setData(row).open();
}

/** 与 site_ui 一致：打开只读弹窗，本地拼接测试链接（非接口） */
function openTest(row: ActingAgentRow) {
  testModalRow.value = row;
  testModalOpen.value = true;
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <TestAgentModal v-model:open="testModalOpen" :row="testModalRow" />
    <Grid table-title="推广代理">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_AGENT_PERM.ADD"
          type="primary"
          @click="openCreate"
        >
          新增
        </Button>
      </template>
      <template #colAgentType="{ row }">
        <Tag
          v-if="row.agent_type != null"
          :color="AGENT_TYPE_MAP[row.agent_type]?.color"
        >
          {{ AGENT_TYPE_MAP[row.agent_type]?.label ?? row.agent_type }}
        </Tag>
      </template>
      <template #colPwaType="{ row }">
        <Tag v-if="row.pwa_type != null" :color="PWA_TYPE_MAP[row.pwa_type]?.color">
          {{ PWA_TYPE_MAP[row.pwa_type]?.label ?? row.pwa_type }}
        </Tag>
      </template>
      <template #colIsSingle="{ row }">
        <Tag
          v-if="row.is_single != null"
          :color="IS_SINGLE_MAP[row.is_single]?.color"
        >
          {{ IS_SINGLE_MAP[row.is_single]?.label ?? row.is_single }}
        </Tag>
      </template>
      <template #colUrl="{ row }">
        <div class="flex items-center justify-center gap-2">
          <span class="max-w-[220px] truncate">{{ row.url }}</span>
          <Button
            v-if="row.url"
            class="shrink-0 px-1"
            size="small"
            type="link"
            @click="copyUrl(row.url)"
          >
            复制
          </Button>
        </div>
      </template>
      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_AGENT_PERM.EDIT"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button size="small" type="link" @click="openTest(row)">
            测试
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
