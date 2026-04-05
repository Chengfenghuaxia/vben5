<script lang="ts" setup>
/**
 * 角色权限树 — 对齐 site：`/site/v1/role/authority` 返回 `data.list` 树，
 * 勾选态在节点 `is_auth`；菜单 `id` 在整棵树中可能重复，Tree 的 key 必须用路径保证唯一。
 */
import {
  fetchRoleAuthorityApi,
  updateRoleAuthorityApi,
} from '#/views/manage/role/useApi';
import { Button, Modal, Space, Spin, Tree, message } from 'ant-design-vue';
import type { DataNode } from 'ant-design-vue/es/tree';
import { computed, nextTick, ref, watch } from 'vue';

type TreeKey = string;

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  roleId: null | number;
  roleName?: string;
}>();

const emit = defineEmits<{ success: [] }>();

const loading = ref(false);
const submitLoading = ref(false);
const treeData = ref<DataNode[]>([]);
const checkedKeys = ref<TreeKey[]>([]);
const treeMountKey = ref(0);

const title = computed(() => {
  const n = props.roleName?.trim();
  return n ? `权限分配 — ${n}` : '权限分配';
});

type RawMenu = Record<string, unknown>;

function getChildNodes(n: RawMenu): RawMenu[] | undefined {
  const c =
    n.children ??
    n.child ??
    n.childList ??
    n.subs ??
    n.nodes ??
    n.list ??
    n.routes ??
    n.menuList;
  if (!Array.isArray(c) || c.length === 0) {
    return undefined;
  }
  return c as RawMenu[];
}

/** 唯一 Tree key：`索引路径_菜单id`（与 site 树结构一致，避免 id 重复） */
function menuTreeKey(indexPath: string, rawId: unknown): TreeKey {
  return `${indexPath}_${String(rawId)}`;
}

/** 从 Tree key 还原后端菜单 id（提交 authority 用） */
function menuIdFromTreeKey(key: TreeKey): number | null {
  const u = key.lastIndexOf('_');
  const tail = u >= 0 ? key.slice(u + 1) : key;
  const n = Number(tail);
  return Number.isFinite(n) ? n : null;
}

function mapMenusWithPathKeys(nodes: RawMenu[], path = ''): DataNode[] {
  return nodes.map((n, i) => {
    const indexPath = path === '' ? String(i) : `${path}.${i}`;
    const key = menuTreeKey(indexPath, n.id);
    const titleText = n.name ?? n.title ?? n.label ?? n.menu_name ?? key;
    const childrenRaw = getChildNodes(n);
    return {
      children: childrenRaw?.length
        ? mapMenusWithPathKeys(childrenRaw, indexPath)
        : undefined,
      key,
      title: String(titleText),
    } as DataNode;
  });
}

function isNodeChecked(n: RawMenu): boolean {
  const v = n.is_auth ?? n.checked ?? n.is_check ?? n.isCheck ?? n.selected;
  return v === true || v === 1 || v === '1' || v === 'true';
}

/** 按接口 `is_auth` 收集应勾选的 Tree key */
function collectIsAuthTreeKeys(
  nodes: RawMenu[] | undefined,
  path = '',
): TreeKey[] {
  if (!nodes?.length) {
    return [];
  }
  const out: TreeKey[] = [];
  nodes.forEach((n, i) => {
    const indexPath = path === '' ? String(i) : `${path}.${i}`;
    const key = menuTreeKey(indexPath, n.id);
    if (isNodeChecked(n)) {
      out.push(key);
    }
    const ch = getChildNodes(n);
    if (ch?.length) {
      out.push(...collectIsAuthTreeKeys(ch, indexPath));
    }
  });
  return out;
}

function unwrapPayload(raw: unknown): Record<string, unknown> {
  if (raw == null || typeof raw !== 'object') {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const inner = o.data;
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    return { ...(inner as Record<string, unknown>), ...o };
  }
  return o;
}

function toNumericId(x: unknown): number | null {
  if (typeof x === 'number' && Number.isFinite(x)) {
    return x;
  }
  if (typeof x === 'string' && x.trim() !== '') {
    const n = Number(x.trim());
    return Number.isFinite(n) ? n : null;
  }
  if (typeof x === 'object' && x !== null && 'id' in x) {
    return toNumericId((x as { id: unknown }).id);
  }
  return null;
}

function normalizeAuthorityIdList(raw: unknown): number[] {
  if (raw == null) {
    return [];
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const t = raw.trim();
    if (t.startsWith('[')) {
      try {
        return normalizeAuthorityIdList(JSON.parse(t) as unknown);
      } catch {
        /* fallthrough */
      }
    }
    return t
      .split(/[,，\s]+/)
      .map((s) => toNumericId(s.trim()))
      .filter((x): x is number => x != null);
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: number[] = [];
  for (const x of raw) {
    const id = toNumericId(x);
    if (id != null) {
      out.push(id);
    }
  }
  return [...new Set(out)];
}

function extractAuthorityIdsFromBody(body: Record<string, unknown>): number[] {
  const candidates: unknown[] = [
    body.authority,
    body.prem,
    body.menu_ids,
    body.menuIds,
    body.checked,
    body.checked_keys,
    body.checkedKeys,
    body.apis,
    body.ids,
    body.auth,
    body.auth_list,
    body.authList,
    (body.role as Record<string, unknown> | undefined)?.authority,
    (body.info as Record<string, unknown> | undefined)?.authority,
  ];
  for (const c of candidates) {
    const ids = normalizeAuthorityIdList(c);
    if (ids.length > 0) {
      return ids;
    }
  }
  return [];
}

/** 将扁平菜单 id 列表映射为当前树上的 key（同一 id 多节点则全部勾选） */
function mapAuthorityIdsToTreeKeys(
  nodes: RawMenu[],
  authorityIds: number[],
): TreeKey[] {
  if (authorityIds.length === 0) {
    return [];
  }
  const want = new Set(authorityIds);
  const out: TreeKey[] = [];
  const walk = (arr: RawMenu[], p: string) => {
    arr.forEach((n, i) => {
      const indexPath = p === '' ? String(i) : `${p}.${i}`;
      const id = toNumericId(n.id);
      const key = menuTreeKey(indexPath, n.id);
      if (id != null && want.has(id)) {
        out.push(key);
      }
      const ch = getChildNodes(n);
      if (ch?.length) {
        walk(ch, indexPath);
      }
    });
  };
  walk(nodes, '');
  return out;
}

function extractMenuListFromBody(
  body: Record<string, unknown>,
): RawMenu[] | undefined {
  const list =
    body.list ??
    body.menus ??
    body.menu ??
    body.menuList ??
    body.tree ??
    body.routes;
  return Array.isArray(list) ? (list as RawMenu[]) : undefined;
}

function dedupeKeys(keys: TreeKey[]): TreeKey[] {
  return [...new Set(keys)];
}

function syncCheckedKeys(val: unknown) {
  if (Array.isArray(val)) {
    checkedKeys.value = val.map((k) => String(k));
    return;
  }
  if (val && typeof val === 'object' && 'checked' in val) {
    const c = (val as { checked?: unknown }).checked;
    if (Array.isArray(c)) {
      checkedKeys.value = c.map((k) => String(k));
    }
  }
}

watch(open, async (v) => {
  if (!v || props.roleId == null) {
    return;
  }
  loading.value = true;
  treeData.value = [];
  checkedKeys.value = [];
  try {
    const raw = await fetchRoleAuthorityApi({ id: props.roleId });
    const body = unwrapPayload(raw);
    const listRaw = extractMenuListFromBody(body);
    treeData.value = listRaw?.length ? mapMenusWithPathKeys(listRaw) : [];

    const fromIsAuth = listRaw?.length ? collectIsAuthTreeKeys(listRaw) : [];
    const flatIds = extractAuthorityIdsFromBody(body);
    const fromFlat =
      listRaw?.length && flatIds.length > 0
        ? mapAuthorityIdsToTreeKeys(listRaw, flatIds)
        : [];

    checkedKeys.value = dedupeKeys([...fromIsAuth, ...fromFlat]);

    await nextTick();
    treeMountKey.value += 1;
  } catch {
    treeData.value = [];
    checkedKeys.value = [];
    message.error('加载权限失败');
  } finally {
    loading.value = false;
  }
});

function close() {
  open.value = false;
}

async function onOk() {
  if (props.roleId == null) {
    return;
  }
  submitLoading.value = true;
  try {
    const authority = [
      ...new Set(
        dedupeKeys(checkedKeys.value)
          .map((k) => menuIdFromTreeKey(k))
          .filter((x): x is number => x != null),
      ),
    ];
    await updateRoleAuthorityApi({ authority, id: props.roleId });
    message.success('保存成功');
    open.value = false;
    emit('success');
  } catch {
    /* 拦截器 */
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="submitLoading"
    :title="title"
    :width="520"
    destroy-on-close
    @cancel="close"
  >
    <Spin :spinning="loading">
      <div class="max-h-[60vh] min-h-[120px] overflow-y-auto py-2">
        <Tree
          :key="treeMountKey"
          :checked-keys="checkedKeys"
          :checkable="true"
          :selectable="false"
          :tree-data="treeData"
          block-node
          @update:checked-keys="syncCheckedKeys"
        />
      </div>
    </Spin>
    <template #footer>
      <Space>
        <Button @click="close">取消</Button>
        <Button :loading="submitLoading" type="primary" @click="onOk">
          确定
        </Button>
      </Space>
    </template>
  </Modal>
</template>
