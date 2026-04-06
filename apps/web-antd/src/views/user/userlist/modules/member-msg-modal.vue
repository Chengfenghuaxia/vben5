<script lang="ts" setup>
import { Button, Modal, Popconfirm, Table, message } from 'ant-design-vue';
import { ref, watch } from 'vue';

import { formatSiteDateTime } from '#/utils/datetime';

import type { SiteMemberRow } from '../useApi';
import { deleteSiteMsgApi, fetchSiteMsgListApi } from '../useApi';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  row: null | SiteMemberRow;
}>();

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const MSG_STATUS: Record<number, string> = {
  0: '未知',
  1: '未读',
  2: '已读',
  3: '删除',
  4: '删除',
};

async function load() {
  if (!props.row) {
    return;
  }
  loading.value = true;
  try {
    const { list: rows, total: t } = await fetchSiteMsgListApi({
      page: page.value,
      size: pageSize.value,
      uid: props.row.id,
    });
    list.value = rows;
    total.value = t;
  } catch {
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function onPageChange(p: number, ps?: number) {
  page.value = p;
  if (ps != null) {
    pageSize.value = ps;
  }
  void load();
}

watch(open, (v) => {
  if (v) {
    page.value = 1;
    void load();
  }
});

function statusLabel(s: unknown) {
  const n = Number(s);
  return MSG_STATUS[n] ?? String(s ?? '—');
}

async function onDel(id: unknown) {
  const n = Number(id);
  if (!Number.isFinite(n)) {
    return;
  }
  try {
    await deleteSiteMsgApi({ id: n });
    message.success('已删除');
    void load();
  } catch {
    /* 拦截器 */
  }
}

const columns = [
  { dataIndex: 'uid', key: 'uid', title: '用户ID', width: 100 },
  {
    dataIndex: 'title',
    ellipsis: true,
    key: 'title',
    title: '标题',
    width: 140,
  },
  {
    dataIndex: 'content',
    ellipsis: true,
    key: 'content',
    title: '内容',
    width: 200,
  },
  { key: 'status', title: '状态', width: 88 },
  { key: 'created_at', title: '创建时间', width: 170 },
  { key: 'action', title: '操作', width: 88 },
];
</script>

<template>
  <Modal
    v-model:open="open"
    title="站内消息"
    width="900px"
    :footer="null"
    destroy-on-close
  >
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        onChange: onPageChange,
        onShowSizeChange: onPageChange,
      }"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          {{ statusLabel(record.status) }}
        </template>
        <template v-else-if="column.key === 'created_at'">
          {{
            record.created_at
              ? formatSiteDateTime(record.created_at as number | string)
              : '—'
          }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Popconfirm title="确定删除？" @confirm="onDel(record.id)">
            <Button danger size="small" type="link">删除</Button>
          </Popconfirm>
        </template>
      </template>
    </Table>
  </Modal>
</template>
