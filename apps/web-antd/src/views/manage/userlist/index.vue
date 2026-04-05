<script lang="ts" setup>
/**
 * 系统管理 / 后台用户 — site_ui `views/manage/userlist`
 */
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { SITE_MANAGE_USER_PERM } from '#/constants/site-manage-perm';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import {
  adminAccountAuthSecretResetApi,
  adminAccountDeleteApi,
  adminAccountPwdResetApi,
  fetchAdminAccountListApi,
} from '#/views/manage/userlist/useApi';
import { Button, Modal, Popconfirm, Tag, message } from 'ant-design-vue';
import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  manageUserAuthStatusDisplay,
  useManageUserColumns,
  useManageUserGridFormSchema,
} from './data';
import type { ManageAccountRow } from './modules/account-modal.vue';
import AccountModal from './modules/account-modal.vue';

defineOptions({ name: 'ManageUserlist' });

const router = useRouter();
const mergedApis = computed(() => getMergedRouteApis(router));

function can(id: number) {
  return checkSiteApiPermission(id, mergedApis.value);
}

const modalOpen = ref(false);
const modalRow = ref<ManageAccountRow | null>(null);

function buildParams(
  page: { currentPage: number; pageSize: number },
  formValues: Record<string, unknown>,
): Record<string, unknown> {
  const size = page.pageSize;
  const params: Record<string, unknown> = {
    limit: size,
    page: page.currentPage,
    size,
  };
  const dept = formValues.dept_id;
  if (dept !== null && dept !== undefined && dept !== '') {
    params.dept_id = Number(dept);
  }
  if (
    formValues.username != null &&
    String(formValues.username).trim() !== ''
  ) {
    params.username = String(formValues.username).trim();
  }
  return params;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    commonConfig: {
      componentProps: { class: 'w-full' },
    },
    schema: useManageUserGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useManageUserColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { pageSize: 20 },
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          try {
            const res = await fetchAdminAccountListApi(
              buildParams(page, formValues),
            );
            return {
              items: res.list,
              page: { total: res.total },
              total: res.total,
            };
          } catch {
            message.error('加载用户列表失败');
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
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<ManageAccountRow>,
});

function onRefresh() {
  void gridApi.query();
}

function openAdd() {
  modalRow.value = null;
  modalOpen.value = true;
}

function openEdit(row: ManageAccountRow) {
  modalRow.value = row;
  modalOpen.value = true;
}

async function onDelete(row: ManageAccountRow) {
  try {
    await adminAccountDeleteApi({ id: row.id });
    message.success('删除成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

async function onResetAuth(id: number) {
  try {
    await adminAccountAuthSecretResetApi({ id });
    message.success('重置成功');
  } catch {
    /* 拦截器 */
  }
}

async function onResetPwd(id: number) {
  try {
    await adminAccountPwdResetApi({ id });
    Modal.success({
      title: '成功提示',
      okText: '关闭',
      content: h('div', {}, [h('p', '默认密码：a123456')]),
    });
  } catch {
    /* 拦截器 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <AccountModal
      v-model:open="modalOpen"
      :row="modalRow"
      @success="onRefresh"
    />

    <Grid table-title="用户管理">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_MANAGE_USER_PERM.ADD"
          :disabled="!can(SITE_MANAGE_USER_PERM.ADD)"
          type="primary"
          @click="openAdd"
        >
          新增
        </Button>
      </template>

      <template #colAuthStatus="{ row }">
        <template
          v-for="st in [manageUserAuthStatusDisplay(row.auth_status)]"
          :key="`a-${row.id}`"
        >
          <Tag v-if="st" :color="st.color">{{ st.text }}</Tag>
        </template>
      </template>

      <template #colOperate="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_MANAGE_USER_PERM.EDIT"
            :disabled="!can(SITE_MANAGE_USER_PERM.EDIT)"
            ghost
            size="small"
            type="primary"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定重置吗？"
            @confirm="() => onResetAuth(Number(row.id))"
          >
            <Button
              v-site-permission="SITE_MANAGE_USER_PERM.RESET_AUTH"
              :disabled="!can(SITE_MANAGE_USER_PERM.RESET_AUTH)"
              ghost
              size="small"
              type="primary"
            >
              重置授权
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确定重置吗？"
            @confirm="() => onResetPwd(Number(row.id))"
          >
            <Button
              v-site-permission="SITE_MANAGE_USER_PERM.RESET_PWD"
              :disabled="!can(SITE_MANAGE_USER_PERM.RESET_PWD)"
              ghost
              size="small"
              type="primary"
            >
              重置密码
            </Button>
          </Popconfirm>
          <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
            <Button
              v-site-permission="SITE_MANAGE_USER_PERM.DEL"
              :disabled="!can(SITE_MANAGE_USER_PERM.DEL)"
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
