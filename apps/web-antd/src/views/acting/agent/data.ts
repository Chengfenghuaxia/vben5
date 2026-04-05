import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import {
  fetchAgentAllListApi,
  fetchTeamAllListApi,
} from '#/api/core/acting-agent';
import { formatSiteDateTime } from '#/utils/datetime';

async function fetchTeamsForForm() {
  const list = await fetchTeamAllListApi();
  return list.map((x) => ({ label: x.name, value: x.id }));
}

async function fetchAgentsForForm(params?: { team_ids?: number[] }) {
  const ids = params?.team_ids?.filter((n) => Number.isFinite(Number(n))) as
    | number[]
    | undefined;
  const list = await fetchAgentAllListApi(
    ids && ids.length > 0 ? { team_ids: ids } : {},
  );
  return list.map((x) => ({ label: x.name, value: x.id }));
}

/** 与 playground 角色列表一致：搜索表单 schema 单独文件维护 */
export function useGridFormSchema(): VbenFormSchema[] {
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
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchAgentsForForm,
        immediate: true,
        maxTagCount: 1,
        mode: 'multiple',
      },
      dependencies: {
        componentProps(values) {
          return {
            params: {
              team_ids: Array.isArray(values.team_ids) ? values.team_ids : [],
            },
          };
        },
        trigger(_values, formApi) {
          void formApi.setFieldValue('agent_ids', undefined);
        },
        triggerFields: ['team_ids'],
      },
      fieldName: 'agent_ids',
      label: '渠道名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: 'h5 官网落地页', value: 1 },
          { label: 'pwa-专属下载页', value: 2 },
        ],
        placeholder: '全部',
      },
      fieldName: 'agent_type',
      label: '推广类型',
    },
  ];
}

async function fetchTeamsSingleSelect() {
  return fetchTeamsForForm();
}

/** 抽屉：新增 / 编辑渠道 */
export function useDrawerFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: false,
        api: fetchTeamsSingleSelect,
        immediate: true,
      },
      fieldName: 'team_id',
      label: '推广总代',
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '渠道名称',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: 'h5 官网落地页', value: 1 },
          { label: 'pwa-专属下载页', value: 2 },
        ],
      },
      fieldName: 'agent_type',
      label: '推广类型',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '开启', value: 1 },
          { label: '关闭', value: 2 },
        ],
      },
      dependencies: {
        show(values) {
          return Number(values.agent_type) !== 2;
        },
        trigger(values, formApi) {
          if (Number(values.agent_type) === 2) {
            void formApi.setFieldValue('pwa_type', 2);
          }
        },
        triggerFields: ['agent_type'],
      },
      fieldName: 'pwa_type',
      label: '强制PWA',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '是', value: 1 },
          { label: '否', value: 2 },
        ],
      },
      fieldName: 'is_single',
      label: '独立域名',
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      fieldName: 'url',
      label: '推广链接',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: 'Facebook (Meta)', value: 'meta' },
          { label: 'Tiktok', value: 'tiktok' },
          { label: 'Kwai', value: 'kwai' },
        ],
      },
      defaultValue: 'meta',
      fieldName: 'ad_platform',
      label: '投放平台',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入像素 id' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'meta';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'meta_pixel_id',
      label: '像素 ID',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入 API Token' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'meta';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'meta_secret_key',
      label: 'API Token',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入测试码 test_code' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'meta';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'meta_test_code',
      label: '测试码 (test_code)',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入像素 id' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'tiktok';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'tiktok_pixel_id',
      label: '像素 ID',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入 API Token' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'tiktok';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'tiktok_secret_key',
      label: 'API Token',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入测试码 test_code' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'tiktok';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'tiktok_test_code',
      label: '测试码 (test_code)',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入像素 id' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'kwai';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'kwai_pixel_id',
      label: '像素 ID',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入 API Token' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'kwai';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'kwai_secret_key',
      label: 'API Token',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入测试码 test_code' },
      dependencies: {
        show(values) {
          return values.ad_platform === 'kwai';
        },
        triggerFields: ['ad_platform'],
      },
      fieldName: 'kwai_test_code',
      label: '测试码 (test_code)',
    },
  ];
}

export function useAgentColumns(): VxeTableGridColumns {
  return [
    { field: 'id', title: '渠道ID', width: 90 },
    { field: 'name', minWidth: 120, title: '渠道名称' },
    { field: 'team_name', minWidth: 120, title: '推广总代' },
    {
      field: 'agent_type',
      slots: { default: 'colAgentType' },
      title: '推广类型',
      width: 150,
    },
    {
      field: 'pwa_type',
      slots: { default: 'colPwaType' },
      title: '强制PWA',
      width: 120,
    },
    {
      field: 'is_single',
      slots: { default: 'colIsSingle' },
      title: '独立域名',
      width: 100,
    },
    {
      field: 'url',
      minWidth: 280,
      showOverflow: true,
      slots: { default: 'colUrl' },
      title: '推广链接',
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
      field: 'operation',
      fixed: 'right',
      slots: { default: 'colOperation' },
      title: '操作',
      width: 200,
    },
  ];
}
