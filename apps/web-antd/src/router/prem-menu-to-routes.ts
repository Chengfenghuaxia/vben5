import type { RouteRecordStringComponent } from '@vben/types';

/**
 * 权限接口 `GET /site/v1/admin/prem` 返回的菜单树节点（字段以后端实际为准，含常见别名）。
 */
export interface PremMenuNode {
  apis?: unknown;
  children?: PremMenuNode[];
  childList?: PremMenuNode[];
  component?: string;
  icon?: string;
  list?: PremMenuNode[];
  menuList?: PremMenuNode[];
  menu_path?: string;
  name?: string;
  path?: string;
  route_path?: string;
  routes?: PremMenuNode[];
  sort?: number;
  title?: string;
  /** 后端给出的路由 name，合法时直接用作 Vue Router name */
  url?: string;
  [key: string]: unknown;
}

function isPremApiSuccessCode(code: unknown): boolean {
  if (code === undefined || code === null || code === '') {
    return true;
  }
  const n = Number(code);
  return (
    code === 0 ||
    code === '0' ||
    code === '0000' ||
    n === 0 ||
    code === 200 ||
    code === '200' ||
    n === 200 ||
    code === 1 ||
    code === '1' ||
    n === 1
  );
}

/** 从 prem 载荷中取出菜单数组（兼容多种包装与字段名） */
export function normalizePremMenus(inner: unknown): PremMenuNode[] {
  if (inner == null) {
    return [];
  }
  if (Array.isArray(inner)) {
    return inner as PremMenuNode[];
  }
  if (typeof inner !== 'object') {
    return [];
  }
  const o = inner as Record<string, unknown>;
  const keys = ['menus', 'menuList', 'routes', 'list', 'items', 'children'] as const;
  for (const key of keys) {
    const v = o[key];
    if (Array.isArray(v)) {
      return v as PremMenuNode[];
    }
  }
  return [];
}

/**
 * 解析 prem 接口原始 JSON（使用 `responseReturn: 'body'`，在此统一处理 code/data 与扁平结构）
 */
export function parsePremResponseBody(body: unknown): { menus: PremMenuNode[] } {
  if (body == null) {
    return { menus: [] };
  }
  if (typeof body !== 'object') {
    return { menus: [] };
  }
  const b = body as Record<string, unknown>;

  if ('data' in b) {
    if (!isPremApiSuccessCode(b.code)) {
      const msg = String(b.msg ?? b.message ?? b.error ?? 'prem request failed');
      throw new Error(msg);
    }
    return { menus: normalizePremMenus(b.data) };
  }

  return { menus: normalizePremMenus(b) };
}

function itemChildren(item: PremMenuNode): PremMenuNode[] {
  const raw =
    item.children ??
    item.childList ??
    item.routes ??
    item.list ??
    item.menuList;
  return Array.isArray(raw) ? raw : [];
}

function itemPath(item: PremMenuNode): string {
  const p = item.path ?? item.route_path ?? item.menu_path;
  return typeof p === 'string' ? p : '';
}

function itemTitle(item: PremMenuNode): string {
  const t = item.name ?? item.title;
  return typeof t === 'string' ? t : '';
}

/** 将 prem 菜单上的 apis 规范为 number[]，供 `meta.apis` + `v-site-permission` 使用 */
function normalizePremApis(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: number[] = [];
  for (const x of raw) {
    if (typeof x === 'number' && Number.isFinite(x)) {
      out.push(x);
    } else if (typeof x === 'string' && /^\d+$/.test(x.trim())) {
      out.push(Number(x.trim()));
    } else if (x && typeof x === 'object' && 'id' in (x as object)) {
      const n = Number((x as { id: unknown }).id);
      if (Number.isFinite(n)) {
        out.push(n);
      }
    }
  }
  return out;
}

const PLACEHOLDER_VIEW = '/_core/fallback/coming-soon';

/**
 * 与 `router/access.ts` → `generateRoutesByBackend` 的 pageMap 键一致
 * （packages/utils `normalizeViewPath`）
 */
function normalizeViewPathForPageMap(path: string): string {
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '');
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;
  return viewPath.replace(/^\/views/, '');
}

/** 当前工程 `src/views` 下真实存在的 *.vue，转为 pageMap 查找键（含 `.vue`） */
const AVAILABLE_VIEW_PAGE_KEYS = new Set(
  Object.keys(import.meta.glob('../views/**/*.vue')).map((globKey) => {
    let key = normalizeViewPathForPageMap(globKey);
    if (key && !key.startsWith('/')) {
      key = `/${key}`;
    }
    return key;
  }),
);

/** `component` 形如 `/foo/bar/index`（无 .vue）时是否在 views 里存在 */
function viewFileExistsForBackendRoute(componentPath: string): boolean {
  if (!componentPath || componentPath === PLACEHOLDER_VIEW) {
    return true;
  }
  let normalized = normalizeViewPathForPageMap(componentPath);
  if (normalized && !normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  const pageKey = normalized.endsWith('.vue')
    ? normalized
    : `${normalized}.vue`;
  return AVAILABLE_VIEW_PAGE_KEYS.has(pageKey);
}

function joinPath(parent: string, segment: string): string {
  if (!segment) {
    return parent || '/';
  }
  if (segment.startsWith('/')) {
    return segment;
  }
  if (!parent || parent === '/') {
    return `/${segment}`;
  }
  return `${parent.replace(/\/$/, '')}/${segment}`;
}

/** 生成在 Vue Router 中唯一的 name；优先用后端 url，否则由 path 推导 */
function safeRouteName(
  item: PremMenuNode,
  fullPath: string,
  depth: number,
  index: number,
): string {
  const u = String(item.url ?? '').trim();
  if (u && /^[A-Za-z_][\w-]*$/.test(u)) {
    return u;
  }
  const fromPath = fullPath
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((s) => {
      const p = s.replace(/[^\dA-Za-z]+/g, '_');
      return p ? p.charAt(0).toUpperCase() + p.slice(1) : '';
    })
    .join('');
  const base = fromPath || `Route${depth}_${index}`;
  return `Dyn${base}`;
}

/** 将菜单 path 映射为 Vben `import.meta.glob` 使用的视图路径：`/a/b/index` */
function pathToViewFile(routePath: string): string {
  const inner = routePath.replace(/\/$/, '').replace(/^\//, '').trim();
  if (!inner) {
    return PLACEHOLDER_VIEW;
  }
  return `/${inner}/index`;
}

/**
 * 叶子路由 component → pageMap 可用的路径。
 * 按菜单 path 推导的页面若尚未在 `src/views` 落地，则用占位页，避免 `convertRoutes` 刷屏 console.error。
 */
function resolveLeafComponent(
  component: string | undefined,
  routePath: string,
): string {
  const c = component?.trim() ?? '';
  const p = routePath?.trim() ?? '';
  const backendStyle =
    !c ||
    c.startsWith('view.') ||
    c.startsWith('layout.') ||
    c.includes('$view.');

  if (backendStyle && p && p !== '/') {
    const candidate = pathToViewFile(p);
    if (
      candidate !== PLACEHOLDER_VIEW &&
      viewFileExistsForBackendRoute(candidate)
    ) {
      return candidate;
    }
    return PLACEHOLDER_VIEW;
  }

  if (!c) {
    return PLACEHOLDER_VIEW;
  }

  let out = c.replace(/^(\.\/|\.\.\/)+/, '');
  out = out.replace(/\.vue$/i, '');
  out = out.replace(/^\/?views\/?/i, '/');
  out = out.replace(/^\/?src\/views\/?/i, '/');
  if (!out.startsWith('/')) {
    out = `/${out}`;
  }
  if (!viewFileExistsForBackendRoute(out)) {
    return PLACEHOLDER_VIEW;
  }
  return out;
}

function transformOne(
  item: PremMenuNode,
  parentPath: string,
  depth: number,
  index: number,
): null | RouteRecordStringComponent {
  if (itemTitle(item) === '基础权限') {
    return null;
  }

  const path = joinPath(parentPath, itemPath(item));
  const name = safeRouteName(item, path, depth, index);
  const hideInMenu = Boolean(
    item.hideInMenu ?? item.hidden ?? item.hide ?? item.is_hidden,
  );
  const meta = {
    apis: normalizePremApis(item.apis),
    hideInMenu: hideInMenu || undefined,
    icon: item.icon,
    order: item.sort ?? 0,
    title: itemTitle(item) || path,
  };

  const childrenRaw = itemChildren(item).filter(Boolean);
  if (childrenRaw.length > 0) {
    const children = childrenRaw
      .map((c, i) => transformOne(c, path, depth + 1, i))
      .filter((x): x is RouteRecordStringComponent => x !== null);
    if (children.length === 0) {
      return null;
    }
    return {
      children,
      meta,
      name,
      path,
    } as RouteRecordStringComponent;
  }

  return {
    component: resolveLeafComponent(
      typeof item.component === 'string' ? item.component : undefined,
      path,
    ),
    meta,
    name,
    path,
  } as RouteRecordStringComponent;
}

/** prem.menus → `generateRoutesByBackend` 所需的 `RouteRecordStringComponent` 树 */
export function transformPremMenusToRoutes(
  menus: PremMenuNode[] | null | undefined,
): RouteRecordStringComponent[] {
  if (!Array.isArray(menus) || menus.length === 0) {
    return [];
  }
  return menus
    .map((item, i) => transformOne(item, '', 0, i))
    .filter((x): x is RouteRecordStringComponent => x !== null);
}

/** prem 无菜单时的本地兜底（Vben 内置仪表盘） */
export function getFallbackDashboardRoutes(): RouteRecordStringComponent[] {
  return [
    {
      children: [
        {
          component: '/dashboard/analytics/index',
          meta: {
            affixTab: true,
            icon: 'lucide:area-chart',
            order: 0,
            title: 'page.dashboard.analytics',
          },
          name: 'Analytics',
          path: '/analytics',
        },
        {
          component: '/dashboard/workspace/index',
          meta: {
            icon: 'carbon:workspace',
            order: 1,
            title: 'page.dashboard.workspace',
          },
          name: 'Workspace',
          path: '/workspace',
        },
      ],
      meta: {
        icon: 'lucide:layout-dashboard',
        order: -1,
        title: 'page.dashboard.title',
      },
      name: 'Dashboard',
      path: '/dashboard',
      redirect: '/analytics',
    } as RouteRecordStringComponent,
  ];
}
