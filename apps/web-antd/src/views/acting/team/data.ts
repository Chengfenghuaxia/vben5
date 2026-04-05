import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { fetchTeamAllListApi } from '#/views/acting/agent/useApi';
import { formatSiteDateTime } from '#/utils/datetime';

async function fetchTeamsForForm() {
  const list = await fetchTeamAllListApi();
  return list.map((x) => ({ label: x.name, value: x.id }));
}

export function useTeamGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchTeamsForForm,
        immediate: true,
        maxTagCount: 1,
        mode: 'multiple',
      },
      fieldName: 'team_ids',
      label: '推广总代',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '总代名称',
    },
  ];
}

export function useTeamColumns(): VxeTableGridColumns {
  return [
    { field: 'name', minWidth: 140, title: '总代名称' },
    { field: 'id', title: '总代ID', width: 90 },
    { field: 'url', minWidth: 160, showOverflow: true, title: '推广域名' },
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
      field: 'operation',
      fixed: 'right',
      slots: { default: 'colOperation' },
      title: '操作',
      width: 160,
    },
  ];
}
