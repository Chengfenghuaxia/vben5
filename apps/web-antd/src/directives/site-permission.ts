/**
 * Site 风格按钮权限：当前路由 `meta.apis` 含指定 id 才渲染（对齐 site_ui `v-permission`）。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { SITE_AGENT_PERM } from '#/constants/site-agent-perm';
 * </script>
 * <Button v-site-permission="SITE_AGENT_PERM.ADD">新增</Button>
 * <Button v-site-permission="{ id: SITE_AGENT_PERM.EDIT }">编辑</Button>
 * <!-- 多 id 且全部满足： -->
 * <Button v-site-permission.all="{ id: [1, 2] }">...</Button>
 * ```
 */
import type { Directive, DirectiveBinding } from 'vue';

import { router } from '#/router';
import { checkSiteApiPermission, normalizeApisArray } from '#/utils/site-permission';

export type SitePermissionValue =
  | number
  | { apis?: number[]; id: number | number[] };

/**
 * 合并当前 URL 匹配到的各级路由的 `meta.apis`（与 site 常见做法一致：权限挂在父级「推广」目录上，子菜单未重复带 apis）。
 */
function resolveApis(explicit?: number[]): number[] {
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  const merged = new Set<number>();
  for (const record of router.currentRoute.value.matched) {
    for (const id of normalizeApisArray(record.meta?.apis)) {
      merged.add(id);
    }
  }
  return [...merged];
}

function parseBinding(binding: DirectiveBinding<SitePermissionValue>): {
  apis: number[];
  id: number | number[];
  mode: 'all' | 'any';
} {
  const v = binding.value;
  const mode = binding.modifiers.all ? 'all' : 'any';
  if (typeof v === 'number') {
    return { apis: resolveApis(), id: v, mode };
  }
  return {
    apis: resolveApis(v.apis),
    id: v.id,
    mode,
  };
}

export const sitePermissionDirective: Directive<HTMLElement, SitePermissionValue> = {
  beforeMount(el) {
    el.style.visibility = 'hidden';
  },
  mounted(el, binding) {
    const { apis, id, mode } = parseBinding(binding);
    const ok = checkSiteApiPermission(id, apis, mode);
    if (!ok) {
      el.parentNode?.removeChild(el);
    } else {
      el.style.visibility = 'visible';
    }
  },
};
