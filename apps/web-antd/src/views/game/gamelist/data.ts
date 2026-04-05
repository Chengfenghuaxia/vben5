import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { formatSiteDateTime } from '#/utils/datetime';

export type GameListMode = 'fav' | 'hot' | 'venue';

const STATUS_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '停用', value: 2 },
];

const HOT_FILTER_OPTIONS = [
  { label: '是', value: 1 },
  { label: '否', value: 2 },
];

export function useGameListGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: STATUS_OPTIONS,
        placeholder: '请选择',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: HOT_FILTER_OPTIONS,
        placeholder: '请选择是否热门推荐',
      },
      fieldName: 'is_hot',
      label: '是否推荐',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入游戏名称',
      },
      fieldName: 'game_name',
      label: '游戏名称',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入游戏Code',
      },
      fieldName: 'game_code',
      label: '游戏Code',
    },
  ];
}

export function buildGameListColumns(mode: GameListMode): VxeTableGridColumns {
  const base: VxeTableGridColumns = [
    { type: 'checkbox', width: 48 },
    { field: 'id', showOverflow: true, title: 'ID', width: 150 },
    { field: 'venue_id', showOverflow: true, title: '场馆ID', width: 150 },
    { field: 'venue_code', showOverflow: true, title: '场馆Code', width: 150 },
    { field: 'game_code', showOverflow: true, title: '游戏code', width: 150 },
    {
      field: 'game_name',
      showOverflow: true,
      title: '游戏名称',
      minWidth: 150,
    },
    {
      /** 必须可纵向撑开，与 site_ui 固定宽 100px、高度随比例一致 */
      className: 'game-gamelist-icon-cell',
      field: 'icon',
      showOverflow: false,
      slots: { default: 'colIcon' },
      title: '图片icon',
      width: 120,
    },
  ];

  if (mode === 'fav') {
    base.push({
      field: 'collections',
      sortable: true,
      title: '用户收藏数',
      width: 150,
    });
  }

  base.push(
    { field: 'sort', title: '排序', width: 120 },
    {
      field: 'status',
      slots: { default: 'colStatus' },
      title: '游戏状态',
      width: 150,
    },
    {
      field: 'is_hot',
      slots: { default: 'colIsHot' },
      title: '是否热门',
      width: 150,
    },
  );

  if (mode !== 'fav') {
    base.push(
      { field: 'operator', showOverflow: true, title: '操作人', width: 150 },
      {
        field: 'updated_at',
        formatter: ({ cellValue }: { cellValue: unknown }) =>
          formatSiteDateTime(cellValue as number | string),
        title: '更新时间',
        width: 180,
      },
      {
        align: 'center',
        field: 'operate',
        fixed: 'right',
        slots: { default: 'colOperate' },
        title: '操作',
        width: 120,
      },
    );
  }

  return base;
}
