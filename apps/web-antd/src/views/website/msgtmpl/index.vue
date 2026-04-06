<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { SITE_MSG_TMPL_PERM } from '#/constants/site-msg-tmpl-perm';
import { Button, message, Popconfirm } from 'ant-design-vue';
import { ref } from 'vue';

import type { MsgTmplRow } from './useApi';
import { deleteMsgTmplApi, fetchMsgTmplListApi } from './useApi';
import { useMsgTmplColumns, useMsgTmplGridFormSchema } from './data';
import TmplFormModal from './modules/tmpl-form-modal.vue';

defineOptions({ name: 'WebsiteMsgtmpl' });

const formOpen = ref(false);
const editingRow = ref<MsgTmplRow | null>(null);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useMsgTmplGridFormSchema(),
    submitOnChange: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useMsgTmplColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { pageSize: 20 },
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const params: Record<string, unknown> = {
            page: page.currentPage,
            size: page.pageSize,
            limit: page.pageSize,
            site: 'system',
          };
          if (
            formValues.name != null &&
            String(formValues.name).trim() !== ''
          ) {
            params.name = String(formValues.name).trim();
          }
          if (formValues.tmpl_type != null && formValues.tmpl_type !== '') {
            params.tmpl_type = Number(formValues.tmpl_type);
          }
          if (formValues.status != null && formValues.status !== '') {
            params.status = Number(formValues.status);
          }
          try {
            const { list, total } = await fetchMsgTmplListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载消息模板失败');
            return {
              items: [],
              page: { total: 0 },
              total: 0,
            };
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
  } as VxeTableGridOptions<MsgTmplRow>,
});

function onRefresh() {
  gridApi.query();
}

function openCreate() {
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: MsgTmplRow) {
  editingRow.value = row;
  formOpen.value = true;
}

async function onDelete(row: MsgTmplRow) {
  try {
    await deleteMsgTmplApi({ id: row.id });
    message.success('已删除');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <TmplFormModal
      v-model:open="formOpen"
      :row="editingRow"
      @success="onRefresh"
    />
    <Grid table-title="消息模板">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_MSG_TMPL_PERM.ADD"
          type="primary"
          @click="openCreate"
        >
          新增
        </Button>
      </template>
      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_MSG_TMPL_PERM.EDIT"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <span v-site-permission="SITE_MSG_TMPL_PERM.DEL" class="inline-flex">
            <Popconfirm title="确定删除吗？" @confirm="onDelete(row)">
              <Button danger size="small" type="link">删除</Button>
            </Popconfirm>
          </span>
        </div>
      </template>
    </Grid>
  </Page>
</template>
