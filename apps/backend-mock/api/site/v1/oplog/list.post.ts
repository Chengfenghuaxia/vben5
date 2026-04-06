import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

const seedRows = [
  {
    id: 1001,
    admin_name: 'admin',
    module: '系统管理 / 角色管理',
    action: '编辑',
    method: 'POST',
    request_uri: '/site/v1/role/update',
    ip: '192.168.1.10',
    content: JSON.stringify({ id: 2, name: '运营' }),
    created_at: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: 1002,
    admin_name: 'operator01',
    module: '财务管理 / 充值订单',
    action: '查询',
    method: 'POST',
    request_uri: '/site/v1/deposit/list',
    ip: '10.0.0.5',
    content: '{"page":1,"size":20}',
    created_at: Math.floor(Date.now() / 1000) - 7200,
  },
  {
    id: 1003,
    admin_name: 'admin',
    module: '消息管理 / 消息通知',
    action: '新增',
    method: 'POST',
    request_uri: '/site/v1/notify/add',
    ip: '192.168.1.10',
    content: '{"notify_type":1,"scene":1}',
    created_at: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: 1004,
    admin_name: 'auditor',
    module: '系统管理 / 后台用户',
    action: '登录',
    method: 'POST',
    request_uri: '/site/v1/admin/login',
    ip: '203.0.113.8',
    content: '',
    created_at: Math.floor(Date.now() / 1000) - 172800,
  },
  {
    id: 1005,
    admin_name: 'operator01',
    module: '推广 / 推广代理',
    action: '删除',
    method: 'POST',
    request_uri: '/site/v1/agent/del',
    ip: '10.0.0.5',
    content: '{"id":15}',
    created_at: Math.floor(Date.now() / 1000) - 259200,
  },
];

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<{
    admin_name?: string;
    end_at?: number;
    keyword?: string;
    module?: string;
    page?: number;
    size?: number;
    start_at?: number;
  }>(event).catch(() => ({}));

  let rows = [...seedRows];

  if (body?.admin_name != null && String(body.admin_name).trim() !== '') {
    const q = String(body.admin_name).trim().toLowerCase();
    rows = rows.filter((r) =>
      String(r.admin_name ?? '').toLowerCase().includes(q),
    );
  }
  if (body?.module != null && String(body.module).trim() !== '') {
    const q = String(body.module).trim().toLowerCase();
    rows = rows.filter((r) =>
      String(r.module ?? '').toLowerCase().includes(q),
    );
  }
  if (body?.keyword != null && String(body.keyword).trim() !== '') {
    const q = String(body.keyword).trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        String(r.content ?? '').toLowerCase().includes(q) ||
        String(r.request_uri ?? '').toLowerCase().includes(q) ||
        String(r.action ?? '').toLowerCase().includes(q),
    );
  }
  if (body?.start_at != null && Number.isFinite(Number(body.start_at))) {
    const t = Number(body.start_at) / 1000;
    rows = rows.filter((r) => Number(r.created_at) >= t);
  }
  if (body?.end_at != null && Number.isFinite(Number(body.end_at))) {
    const t = Number(body.end_at) / 1000;
    rows = rows.filter((r) => Number(r.created_at) <= t);
  }

  const page = Math.max(1, Number(body?.page) || 1);
  const size = Math.min(100, Math.max(1, Number(body?.size) || 20));
  const start = (page - 1) * size;
  const list = rows.slice(start, start + size);

  return useResponseSuccess({
    list,
    total: rows.length,
  });
});
