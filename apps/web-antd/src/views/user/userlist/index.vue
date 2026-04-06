<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { fetchSiteAdminInfoApi } from '#/api/core/site-auth';
import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { SITE_USER_MEMBER_PERM } from '#/constants/site-user-member-perm';
import {
  checkSiteApiPermission,
  getMergedRouteApis,
} from '#/utils/site-permission';
import { siteCalendarDateRangeToUtcMillis } from '#/utils/datetime';
import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  Modal,
  Popconfirm,
  Switch,
  Tag,
  message,
} from 'ant-design-vue';
import { computed, nextTick, onActivated, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useSiteMemberColumns, useSiteMemberGridFormSchema } from './data';
import MemberBalanceModal from './modules/member-balance-modal.vue';
import MemberCreateModal from './modules/member-create-modal.vue';
import MemberDamaModal from './modules/member-dama-modal.vue';
import MemberMsgModal from './modules/member-msg-modal.vue';
import MemberRemarkModal from './modules/member-remark-modal.vue';
import MemberSuperiorModal from './modules/member-superior-modal.vue';
import MemberWithdrawModal from './modules/member-withdraw-modal.vue';
import type { SiteMemberRow } from './useApi';
import {
  addSiteMemberWsAbnormalApi,
  deleteSiteMemberApi,
  fetchActivityListForMemberMapApi,
  fetchSiteMemberListApi,
  resetSiteMemberPwdApi,
  updateSiteMemberStatusApi,
  updateSiteMemberWithdrawalStatusApi,
} from './useApi';

defineOptions({ name: 'UserUserlist' });

const router = useRouter();
const route = useRoute();
const mergedApis = computed(() => getMergedRouteApis(router));

function can(id: number) {
  return checkSiteApiPermission(id, mergedApis.value);
}

const activityMap = ref<Record<string, string>>({});
const withdrawSort = ref<null | number>(null);
const depositSort = ref<null | number>(null);

const createOpen = ref(false);
const balanceOpen = ref(false);
const superiorOpen = ref(false);
const damaOpen = ref(false);
const msgOpen = ref(false);
const withdrawOpen = ref(false);
const remarkOpen = ref(false);
const remarkType = ref<'updatestatus' | 'updatewithdraw' | 'updaterem'>(
  'updaterem',
);
const actionRow = ref<null | SiteMemberRow>(null);

const showMoreMenu = computed(() =>
  [
    SITE_USER_MEMBER_PERM.BALANCE,
    SITE_USER_MEMBER_PERM.DAMA,
    SITE_USER_MEMBER_PERM.SUPERIOR,
    SITE_USER_MEMBER_PERM.RESET_PWD,
    SITE_USER_MEMBER_PERM.STATUS_AND_REMARK,
  ].some((id) => can(id)),
);

function buildListParams(
  page: { currentPage: number; pageSize: number },
  formValues: Record<string, unknown>,
): Record<string, unknown> {
  const size = page.pageSize;
  const params: Record<string, unknown> = {
    limit: size,
    page: page.currentPage,
    pid: -1,
    size,
  };

  const pv = formValues.pid_display;
  if (pv !== null && pv !== undefined && pv !== '' && Number(pv) >= 0) {
    params.pid = Number(pv);
  }

  const uid = formValues.uid;
  if (uid !== null && uid !== undefined && uid !== '') {
    params.uid = Number(uid);
  }

  const phone = formValues.phone;
  if (phone != null && String(phone).trim() !== '') {
    params.phone = String(phone).trim();
  }

  const team_ids = formValues.team_ids;
  if (Array.isArray(team_ids) && team_ids.length > 0) {
    params.team_ids = team_ids
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
  }

  const agent_ids = formValues.agent_ids;
  if (Array.isArray(agent_ids) && agent_ids.length > 0) {
    params.agent_ids = agent_ids
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
  }

  for (const key of ['status', 'user_status', 'type'] as const) {
    const v = formValues[key];
    if (v !== null && v !== undefined && v !== '') {
      params[key] = Number(v);
    }
  }

  const minD = formValues.min_deposit_amount;
  const maxD = formValues.max_deposit_amount;
  if (minD !== null && minD !== undefined && minD !== '') {
    params.min_deposit_amount = Number(minD);
  }
  if (maxD !== null && maxD !== undefined && maxD !== '') {
    params.max_deposit_amount = Number(maxD);
  }

  const addip = formValues.addip;
  if (addip != null && String(addip).trim() !== '') {
    params.addip = String(addip).trim();
  }

  const acc = formValues.account_no;
  if (acc != null && String(acc).trim() !== '') {
    params.account_no = String(acc).trim();
  }

  const rangePairs: [string, string, string][] = [
    ['registerRange', 'register_start_at', 'register_end_at'],
    ['loginRange', 'login_start_at', 'login_end_at'],
    ['firstDepositRange', 'first_deposit_start_at', 'first_deposit_end_at'],
  ];
  for (const [field, startK, endK] of rangePairs) {
    const range = formValues[field];
    if (Array.isArray(range) && range.length === 2) {
      const b = siteCalendarDateRangeToUtcMillis(range[0], range[1]);
      if (b) {
        params[startK] = b.start_at;
        params[endK] = b.end_at;
      }
    }
  }

  if (withdrawSort.value != null) {
    params.withdrawal_sort = withdrawSort.value;
  }
  if (depositSort.value != null) {
    params.deposit_sort = depositSort.value;
  }

  return params;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    /** 默认收起，只露出首行筛选项；点击「展开」再显示全部 */
    collapsed: true,
    commonConfig: {
      componentProps: { class: 'w-full' },
    },
    schema: useSiteMemberGridFormSchema(),
    submitOnChange: true,
    showCollapseButton: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gridOptions: {
    columns: useSiteMemberColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { pageSize: 20 },
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, unknown>,
        ) => {
          const params = buildListParams(page, formValues);
          try {
            const { list, total } = await fetchSiteMemberListApi(params);
            return {
              items: list,
              page: { total },
              total,
            };
          } catch {
            message.error('加载会员列表失败');
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
    sortConfig: { remote: true },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SiteMemberRow>,
  gridEvents: {
    sortChange(ctx: {
      column: { field?: string };
      order?: 'asc' | 'desc' | null;
    }) {
      const field = ctx.column?.field;
      const order = ctx.order;
      withdrawSort.value = null;
      depositSort.value = null;
      if (field === 'withdrawal' && order) {
        withdrawSort.value = order === 'desc' ? 2 : 1;
      } else if (field === 'deposit' && order) {
        depositSort.value = order === 'desc' ? 2 : 1;
      }
      void gridApi.query();
    },
  },
});

function onRefresh() {
  void gridApi.query();
}

function openRemark(
  row: SiteMemberRow,
  t: 'updatestatus' | 'updatewithdraw' | 'updaterem',
) {
  actionRow.value = row;
  remarkType.value = t;
  remarkOpen.value = true;
}

async function onStatusSwitch(row: SiteMemberRow, checked: boolean) {
  if (!can(SITE_USER_MEMBER_PERM.STATUS_AND_REMARK)) {
    return;
  }
  if (checked) {
    try {
      await updateSiteMemberStatusApi({ id: row.id, status: 1 });
      message.success('操作成功');
      onRefresh();
    } catch {
      /* 拦截器 */
    }
  } else {
    openRemark(row, 'updatestatus');
  }
}

async function onWithdrawSwitch(row: SiteMemberRow, checked: boolean) {
  if (!can(SITE_USER_MEMBER_PERM.WITHDRAW_STATUS)) {
    return;
  }
  if (checked) {
    try {
      await updateSiteMemberWithdrawalStatusApi({
        id: row.id,
        withdraw_status: 1,
      });
      message.success('操作成功');
      onRefresh();
    } catch {
      /* 拦截器 */
    }
  } else {
    openRemark(row, 'updatewithdraw');
  }
}

function openBalance(row: SiteMemberRow) {
  actionRow.value = row;
  balanceOpen.value = true;
}

function openSuperior(row: SiteMemberRow) {
  actionRow.value = row;
  superiorOpen.value = true;
}

function openDama(row: SiteMemberRow) {
  actionRow.value = row;
  damaOpen.value = true;
}

function openMsg(row: SiteMemberRow) {
  actionRow.value = row;
  msgOpen.value = true;
}

function openWithdraw(row: SiteMemberRow) {
  actionRow.value = row;
  withdrawOpen.value = true;
}

async function onResetPwd(id: number) {
  try {
    const data = (await resetSiteMemberPwdApi({
      uid: id,
    })) as unknown;
    const pwd =
      data && typeof data === 'object' && data !== null && 'pwd' in data
        ? String((data as { pwd?: unknown }).pwd ?? '')
        : '';
    Modal.success({
      content: `当前密码：${pwd || '—'}`,
      okText: '关闭',
      title: '成功提示',
    });
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

async function onDelete(id: number) {
  try {
    const data = (await deleteSiteMemberApi({ id })) as unknown;
    const pwd =
      data && typeof data === 'object' && data !== null && 'pwd' in data
        ? String((data as { pwd?: unknown }).pwd ?? '')
        : '';
    if (pwd) {
      Modal.success({
        content: `当前密码：${pwd}`,
        okText: '关闭',
        title: '成功提示',
      });
    } else {
      message.success('删除成功');
    }
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

async function onAddWsAbnormal(id: number) {
  try {
    await addSiteMemberWsAbnormalApi({ id });
    message.success('加入异常WS账户成功');
    onRefresh();
  } catch {
    /* 拦截器 */
  }
}

function inviteLabel(code: string | undefined) {
  if (!code) {
    return '/';
  }
  return activityMap.value[code] ?? code;
}

function goProxyPush(row: SiteMemberRow) {
  void router.push({
    path: '/user/proxypushlist',
    query: { uid: String(row.id) },
  });
}

async function loadActivityMap() {
  try {
    activityMap.value = await fetchActivityListForMemberMapApi();
  } catch {
    activityMap.value = {
      deposit: '充值页面',
      mission_summary: '任务概要页面',
    };
  }
}

async function syncRouteToForm() {
  const q = route.query;
  const uid = q.uid != null && q.uid !== '' ? Number(q.uid) : undefined;
  const ip = typeof q.ip === 'string' ? q.ip : '';
  if (uid != null && Number.isFinite(uid)) {
    await gridApi.formApi.setFieldValue('uid', uid);
  } else {
    await gridApi.formApi.setFieldValue('uid', undefined);
  }
  await gridApi.formApi.setFieldValue('addip', ip || undefined);
}

async function presetAgentFromAdmin() {
  try {
    const raw = await fetchSiteAdminInfoApi();
    const aid = Number(raw.agent_id);
    const tid = Number(raw.team_id);
    if (Number.isFinite(aid) && aid > 0 && Number.isFinite(tid) && tid > 0) {
      await gridApi.formApi.setFieldValue('team_ids', [tid]);
      await gridApi.formApi.setFieldValue('agent_ids', [aid]);
    }
  } catch {
    /* ignore */
  }
}

onMounted(async () => {
  await loadActivityMap();
  await nextTick();
  await presetAgentFromAdmin();
  await syncRouteToForm();
  void gridApi.query();
});

onActivated(async () => {
  await syncRouteToForm();
  if (route.query.uid != null || route.query.ip) {
    void gridApi.query();
  }
});
</script>

<template>
  <Page auto-content-height>
    <MemberCreateModal v-model:open="createOpen" @success="onRefresh" />
    <MemberBalanceModal
      v-model:open="balanceOpen"
      :row="actionRow"
      @success="onRefresh"
    />
    <MemberSuperiorModal
      v-model:open="superiorOpen"
      :row="actionRow"
      @success="onRefresh"
    />
    <MemberDamaModal
      v-model:open="damaOpen"
      :row="actionRow"
      @success="onRefresh"
    />
    <MemberMsgModal v-model:open="msgOpen" :row="actionRow" />
    <MemberWithdrawModal
      v-model:open="withdrawOpen"
      :rows="actionRow?.withdraw_info"
      @success="onRefresh"
    />
    <MemberRemarkModal
      v-model:open="remarkOpen"
      :opentype="remarkType"
      :row="actionRow"
      @success="onRefresh"
    />

    <Grid table-title="会员列表">
      <template #toolbar-tools>
        <Button
          v-site-permission="SITE_USER_MEMBER_PERM.ADD"
          type="primary"
          class="mr-2"
          @click="createOpen = true"
        >
          新增
        </Button>
      </template>

      <template #colInviteSource="{ row }">
        {{ inviteLabel(row.invite_source) }}
      </template>

      <template #colWsStatus="{ row }">
        <Tag
          v-if="row.ws_status != null"
          :color="
            row.ws_status === 1
              ? 'warning'
              : row.ws_status === 2
                ? 'success'
                : row.ws_status === 3
                  ? 'error'
                  : 'default'
          "
        >
          {{
            row.ws_status === 1
              ? '待检测'
              : row.ws_status === 2
                ? '已开通'
                : row.ws_status === 3
                  ? '未开通'
                  : row.ws_status === 4
                    ? '检测失败'
                    : '—'
          }}
        </Tag>
        <span v-else>—</span>
      </template>

      <template #colDirectSub="{ row }">
        <span v-if="!(Number(row.direct_sub_count) > 0)">{{
          row.direct_sub_count ?? 0
        }}</span>
        <Button
          v-else
          type="link"
          size="small"
          class="px-0"
          @click="goProxyPush(row)"
        >
          {{ row.direct_sub_count }}
        </Button>
      </template>

      <template #colUserStatus="{ row }">
        <Tag v-if="row.user_status === 1" color="success">正常</Tag>
        <Tag v-else-if="row.user_status === 2" color="error">异常</Tag>
        <span v-else>—</span>
      </template>

      <template #colWsAbnormal="{ row }">
        <Tag :color="row.ws_abnormal === 1 ? 'error' : 'success'">
          {{ row.ws_abnormal === 1 ? '是' : '否' }}
        </Tag>
      </template>

      <template #colUserType="{ row }">
        <Tag v-if="row.type === 1" color="success">正常用户</Tag>
        <Tag v-else-if="row.type === 2" color="warning">测试用户</Tag>
        <span v-else>—</span>
      </template>

      <template #colRegIp="{ row }">
        <div class="whitespace-pre-line text-left">
          {{ row.addip ?? '—' }}
          <template v-if="row.addr">
            {{ '\n' }}{{ row.addr }}
          </template>
        </div>
      </template>

      <template #colLoginIp="{ row }">
        <div class="whitespace-pre-line text-left">
          {{ row.login_ip ?? '—' }}
          <template v-if="row.login_addr">
            {{ '\n' }}{{ row.login_addr }}
          </template>
        </div>
      </template>

      <template #colStatus="{ row }">
        <Switch
          :checked="row.status === 1"
          :disabled="!can(SITE_USER_MEMBER_PERM.STATUS_AND_REMARK)"
          checked-children="启"
          un-checked-children="禁"
          @change="
            (c: boolean | string | number) =>
              onStatusSwitch(row, c === true || c === 1)
          "
        />
      </template>

      <template #colWithdrawStatus="{ row }">
        <Switch
          :checked="row.withdraw_status === 1"
          :disabled="!can(SITE_USER_MEMBER_PERM.WITHDRAW_STATUS)"
          checked-children="开"
          un-checked-children="关"
          @change="
            (c: boolean | string | number) =>
              onWithdrawSwitch(row, c === true || c === 1)
          "
        />
      </template>

      <template #colOperation="{ row }">
        <div class="flex flex-wrap items-center justify-center gap-1">
          <Button
            v-site-permission="SITE_USER_MEMBER_PERM.MSG"
            size="small"
            type="link"
            @click="openMsg(row)"
          >
            消息
          </Button>

          <Dropdown v-if="showMoreMenu" placement="bottomLeft">
            <Button size="small" type="link">更多</Button>
            <template #overlay>
              <Menu :selectable="false">
                <MenuItem
                  v-if="can(SITE_USER_MEMBER_PERM.BALANCE)"
                  @click="openBalance(row)"
                >
                  余额调整
                </MenuItem>
                <MenuItem
                  v-if="can(SITE_USER_MEMBER_PERM.DAMA)"
                  @click="openDama(row)"
                >
                  打码量调整
                </MenuItem>
                <MenuItem
                  v-if="can(SITE_USER_MEMBER_PERM.SUPERIOR)"
                  @click="openSuperior(row)"
                >
                  调整上级
                </MenuItem>
                <MenuItem v-if="can(SITE_USER_MEMBER_PERM.RESET_PWD)">
                  <Popconfirm
                    title="确定重置密码吗？"
                    @confirm="onResetPwd(row.id)"
                  >
                    <span>重置密码</span>
                  </Popconfirm>
                </MenuItem>
                <MenuItem
                  v-if="can(SITE_USER_MEMBER_PERM.STATUS_AND_REMARK)"
                  @click="openRemark(row, 'updaterem')"
                >
                  修改备注
                </MenuItem>
                <MenuItem
                  v-if="can(SITE_USER_MEMBER_PERM.STATUS_AND_REMARK)"
                  @click="openWithdraw(row)"
                >
                  修改提现信息
                </MenuItem>
                <MenuItem v-if="row.ws_abnormal === 2">
                  <Popconfirm
                    title="确定要加入异常WS账户吗？"
                    @confirm="onAddWsAbnormal(row.id)"
                  >
                    <span>加入异常WS账户</span>
                  </Popconfirm>
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>

          <Popconfirm title="确定删除吗？" @confirm="onDelete(row.id)">
            <Button
              v-if="row.type === 2"
              v-site-permission="SITE_USER_MEMBER_PERM.DEL"
              danger
              size="small"
              type="link"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      </template>
    </Grid>
  </Page>
</template>
