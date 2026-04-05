<script lang="ts" setup>
/**
 * 系统管理 / 角色管理 — site_ui `views/manage/role`
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { SITE_MANAGE_ROLE_PERM } from '#/constants/site-manage-perm';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { fetchRoleListApi, roleDelApi } from '#/views/manage/role/useApi';
import { Button, Popconfirm, message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useManageRoleColumns } from './data';
import type { ManageRoleRow } from './modules/role-modal.vue';
import RoleAuthorityModal from './modules/role-authority-modal.vue';
import RoleModal from './modules/role-modal.vue';

defineOptions({ name: 'ManageRole' });

const router = useRouter();
const mergedApis = computed(() => getMergedRouteApis(router));

function can(id: number) {
  return checkSiteApiPermission(id, mergedApis.value);
}

const modalOpen = ref(false);
const modalRow = ref<ManageRoleRow | null>(null);

const authOpen = ref(false);
const authRoleId = ref<null | number>(null);
const authRoleName = ref('');

function isSuper(row: ManageRoleRow) {
  return Number(row.is_super) === 1;
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useManageRoleColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { pageSize: 20 },
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          try {
            const size = page.pageSize;
            const res = await fetchRoleListApi({
              limit: size,
              page: page.currentPage,
              size,
            });
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载角色列表失败');
            return { items: [], page: { total: 0 }, total: 0 };
          }
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: false,
      zoom: true,
    },
  } as VxeTableGridOptions<ManageRoleRow>,
});

function onRefresh() {
  void gridApi.query();
}

function openAdd() {
  modalRow.value = null;
  modalOpen.value = true;
}

function openEdit(row: ManageRoleRow) {
  modalRow.value = row;
  modalOpen.value = true;
}

function openAuth(row: ManageRoleRow) {
  authRoleId.value = Number(row.id);
  authRoleName.value = String(row.name ?? '');
  authOpen.value = true;
}

async function onDelete(row: ManageRoleRow) {
  try {
    await roleDelApi({ id: row.id });
    message.success('删除成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <RoleModal v-model:open="modalOpen" :row="modalRow" @success="onRefresh" />
    <RoleAuthorityModal
      v-model:open="authOpen"
      :role-id="authRoleId"
      :role-name="authRoleName"
      @success="onRefresh"
    />

    <Grid table-title="角色管理">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_MANAGE_ROLE_PERM.ADD"
          :disabled="!can(SITE_MANAGE_ROLE_PERM.ADD)"
          type="primary"
          @click="openAdd"
        >
          新增
        </Button>
      </template>

      <template #colOperate="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-if="!isSuper(row)"
            v-site-permission="SITE_MANAGE_ROLE_PERM.AUTH"
            :disabled="!can(SITE_MANAGE_ROLE_PERM.AUTH)"
            ghost
            size="small"
            type="primary"
            @click="openAuth(row)"
          >
            权限分配
          </Button>
          <Button
            v-if="!isSuper(row)"
            v-site-permission="SITE_MANAGE_ROLE_PERM.EDIT"
            :disabled="!can(SITE_MANAGE_ROLE_PERM.EDIT)"
            ghost
            size="small"
            type="primary"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Popconfirm
            v-if="!isSuper(row)"
            title="确定删除吗？"
            @confirm="() => onDelete(row)"
          >
            <Button
              v-site-permission="SITE_MANAGE_ROLE_PERM.DEL"
              :disabled="!can(SITE_MANAGE_ROLE_PERM.DEL)"
              danger
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      </template>
    </Grid>
  </Page>
</template>
