<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { Button, message, Popconfirm, Progress, Table, Tag } from 'ant-design-vue';
import { computed, h, reactive, ref, watch } from 'vue';

import {
  deleteExportRecordApi,
  fetchExportRecordApi,
} from '#/api/core/acting-data-tracking';
import { formatSiteDateTime } from '#/utils/datetime';

defineOptions({ name: 'FinanceDepositExportRecordModal' });

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [boolean] }>();

const innerOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

const loading = ref(false);
const dataSource = ref<
  {
    create_at?: number;
    file_name?: string;
    id?: number;
    operator?: string;
    progress?: number;
    status?: number;
    url?: string;
  }[]
>([]);

const EXPORT_TYPE_DEPOSIT = 2;

const pagination = reactive({
  current: 1,
  onChange: (p: number, ps: number) => {
    pagination.current = p;
    pagination.pageSize = ps;
    void load();
  },
  pageSize: 20,
  pageSizeOptions: ['20', '30', '50', '100'],
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
  total: 0,
});

async function load() {
  loading.value = true;
  try {
    const { list, total: t } = await fetchExportRecordApi({
      export_type: EXPORT_TYPE_DEPOSIT,
      page: pagination.current,
      size: pagination.pageSize,
    });
    dataSource.value = list;
    pagination.total = t;
  } catch {
    message.error('加载导出记录失败');
  } finally {
    loading.value = false;
  }
}

async function onDelete(id: number) {
  try {
    await deleteExportRecordApi({ id });
    message.success('已删除');
    await load();
  } catch {
    /* 拦截器 */
  }
}

function download(url: string | undefined) {
  if (!url) {
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
}

const columns = [
  {
    customRender: ({ record }: { record: { create_at?: number } }) =>
      formatSiteDateTime(record.create_at),
    dataIndex: 'create_at',
    key: 'create_at',
    title: '创建时间',
    width: 170,
  },
  { dataIndex: 'operator', key: 'operator', title: '操作人', width: 120 },
  { dataIndex: 'file_name', ellipsis: true, key: 'file_name', title: '文件名称' },
  {
    customRender: ({ record }: { record: { status?: number } }) => {
      const m: Record<number, { color: string; text: string }> = {
        1: { color: 'warning', text: '导出中' },
        2: { color: 'success', text: '成功' },
        3: { color: 'error', text: '失败' },
      };
      const s = record.status;
      if (s == null) {
        return '';
      }
      const x = m[s];
      return x ? h(Tag, { color: x.color }, () => x.text) : String(s);
    },
    dataIndex: 'status',
    key: 'status',
    title: '状态',
    width: 100,
  },
  {
    customRender: ({ record }: { record: { progress?: number; status?: number } }) =>
      h(Progress, {
        percent: Math.floor(Number(record.progress ?? 0) * 100),
        showInfo: true,
        size: 'small',
        status:
          record.status === 3 ? 'exception' : record.status === 2 ? 'success' : 'active',
        strokeColor: record.status === 3 ? '#f5222d' : undefined,
      }),
    dataIndex: 'progress',
    key: 'progress',
    title: '导出进度',
    width: 160,
  },
  {
    customRender: ({ record }: { record: { id?: number; status?: number; url?: string } }) => {
      if (record.status === 2) {
        return h(
          Button,
          { ghost: true, size: 'small', type: 'primary', onClick: () => download(record.url) },
          () => '下载',
        );
      }
      if (record.status === 3 && record.id != null) {
        return h(
          Popconfirm,
          {
            title: '确定删除吗？',
            onConfirm: () => onDelete(record.id!),
          },
          {
            default: () =>
              h(Button, { danger: true, size: 'small' }, () => '删除'),
          },
        );
      }
      return h(Button, { disabled: true, ghost: true, size: 'small' }, () => '导出中');
    },
    key: 'operate',
    title: '操作',
    width: 120,
  },
];

const [Modal, modalApi] = useVbenModal({
  class: 'w-[960px]',
  footer: false,
  onOpenChange(isOpen) {
    innerOpen.value = isOpen;
  },
  title: '导出记录',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      modalApi.close();
      return;
    }
    modalApi.open();
    pagination.current = 1;
    void load();
  },
);
</script>

<template>
  <Modal>
    <p class="mb-2 text-xs text-[var(--ant-color-error)]">
      * 单表最多导出 100 万条数据，超出部分将分表导出（以后端为准）
    </p>
    <div class="mb-2 flex justify-end">
      <Button :loading="loading" size="small" type="primary" ghost @click="load">刷新</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      size="small"
      :scroll="{ x: 900, y: 360 }"
    />
  </Modal>
</template>
