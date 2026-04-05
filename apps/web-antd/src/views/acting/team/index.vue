<script lang="ts" setup>
import type { ActingTeamRow } from '#/api/core/acting-team';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { deleteActingTeamApi, fetchActingTeamListApi } from '#/api/core/acting-team';
import { SITE_TEAM_PERM } from '#/constants/site-team-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { Button, message, Popconfirm } from 'ant-design-vue';
import { ref } from 'vue';

import { useTeamColumns, useTeamGridFormSchema } from './data';
import TeamFormModal from './modules/team-form-modal.vue';

defineOptions({ name: 'ActingTeam' });

const formOpen = ref(false);
const editingRow = ref<ActingTeamRow | null>(null);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useTeamGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useTeamColumns(),
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
          const params: Record<string, unknown> = {
            page: page.currentPage,
            size: page.pageSize,
          };
          if (Array.isArray(teamIds) && teamIds.length > 0) {
            params.team_ids = teamIds;
          }
          if (formValues.name != null && String(formValues.name).trim() !== '') {
            params.name = String(formValues.name).trim();
          }
          try {
            const { list, total } = await fetchActingTeamListApi(params);
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
  } as VxeTableGridOptions<ActingTeamRow>,
});

function onRefresh() {
  gridApi.query();
}

function openCreate() {
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: ActingTeamRow) {
  editingRow.value = row;
  formOpen.value = true;
}

async function onDelete(row: ActingTeamRow) {
  try {
    await deleteActingTeamApi({ id: row.id });
    message.success('已删除');
    onRefresh();
  } catch {
    /* request 拦截器 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <TeamFormModal v-model:open="formOpen" :row="editingRow" @success="onRefresh" />
    <Grid table-title="推广总代">
      <template #toolbar-tools>
        <Button v-site-permission="SITE_TEAM_PERM.ADD" type="primary" @click="openCreate">
          新增
        </Button>
      </template>
      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_TEAM_PERM.EDIT"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <!-- 权限挂在包裹层：避免指令直接 removeChild Popconfirm 内的触发节点导致异常 -->
          <span v-site-permission="SITE_TEAM_PERM.DEL" class="inline-flex">
            <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
              <Button danger size="small" type="link">删除</Button>
            </Popconfirm>
          </span>
        </div>
      </template>
    </Grid>
  </Page>
</template>
