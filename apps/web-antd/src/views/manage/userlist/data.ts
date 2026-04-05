import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

import { fetchDepAllListApi } from '../dep/useApi';

async function depOptionsForForm() {
  const list = await fetchDepAllListApi();
  return list.map((x) => ({ label: x.name, value: x.id }));
}

export function useManageUserGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: depOptionsForForm,
        immediate: true,
      },
      fieldName: 'dept_id',
      label: '部门',
    },
    {
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入用户名' },
      fieldName: 'username',
      label: '用户名',
    },
  ];
}

const AUTH_TAG: Record<number, string> = {
  0: 'default',
  1: 'success',
  2: 'warning',
};

export function useManageUserColumns(): VxeTableGridColumns {
  return [
    { field: 'username', minWidth: 120, title: '用户名' },
    { field: 'dept_name', minWidth: 120, title: '部门名称' },
    {
      field: 'auth_status',
      slots: { default: 'colAuthStatus' },
      title: '授权状态',
      width: 120,
    },
    { field: 'role_name', minWidth: 120, title: '角色名称' },
    { field: 'remark', minWidth: 120, showOverflow: true, title: '备注' },
    {
      field: 'created_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '创建时间',
      width: 170,
    },
    {
      field: 'updated_at',
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatSiteDateTime(cellValue as number | string),
      title: '更新时间',
      width: 170,
    },
    { field: 'operator', title: '操作人', width: 100 },
    {
      align: 'center',
      field: 'operate',
      fixed: 'right',
      slots: { default: 'colOperate' },
      title: '操作',
      width: 320,
    },
  ];
}

export function manageUserAuthStatusDisplay(status: unknown): {
  color: string;
  text: string;
} | null {
  if (status === null || status === undefined) {
    return null;
  }
  const s = Number(status);
  const labels: Record<number, string> = {
    0: '未知',
    1: '启用',
    2: '未启用',
  };
  const text = labels[s];
  if (!text) {
    return null;
  }
  return { color: AUTH_TAG[s] ?? 'default', text };
}
