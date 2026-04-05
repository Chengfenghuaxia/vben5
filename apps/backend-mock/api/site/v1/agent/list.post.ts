import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

const mockRows = [
  {
    id: 1001,
    team_id: 1,
    name: '示例渠道 A',
    team_name: '总代一组',
    agent_type: 1,
    pwa_type: 2,
    is_single: 1,
    url: 'https://example.com/promo/a',
    ad_codes: 'meta',
    ad_config: {
      meta: { pixel_id: 'demo-pixel-id', secret_key: '', test_code: '' },
      tiktok: { pixel_id: '', secret_key: '', test_code: '' },
      kwai: { pixel_id: '', secret_key: '', test_code: '' },
    },
    updated_at: Math.floor(Date.now() / 1000),
    operator: 'admin',
  },
  {
    id: 1002,
    team_id: 2,
    name: '示例渠道 B',
    team_name: '总代二组',
    agent_type: 2,
    pwa_type: 1,
    is_single: 2,
    url: 'https://example.com/promo/b',
    ad_codes: 'tiktok',
    ad_config: {
      meta: { pixel_id: '', secret_key: '', test_code: '' },
      tiktok: { pixel_id: 'tt-xyz', secret_key: '', test_code: '' },
      kwai: { pixel_id: '', secret_key: '', test_code: '' },
    },
    updated_at: Math.floor(Date.now() / 1000) - 3600,
    operator: 'admin',
  },
];

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<{
    agent_ids?: number[];
    agent_type?: number;
    page?: number;
    size?: number;
    team_ids?: number[];
  }>(event).catch(() => ({}));

  const filtered = mockRows.filter((row) => {
    if (body?.agent_type != null && row.agent_type !== body.agent_type) {
      return false;
    }
    if (body?.team_ids?.length) {
      if (!body.team_ids.includes(row.team_id)) {
        return false;
      }
    }
    if (body?.agent_ids?.length) {
      if (!body.agent_ids.includes(row.id)) {
        return false;
      }
    }
    return true;
  });

  const rows = filtered;

  const page = Math.max(1, Number(body?.page) || 1);
  const size = Math.min(100, Math.max(1, Number(body?.size) || 20));

  const start = (page - 1) * size;
  const list = rows.slice(start, start + size);

  return useResponseSuccess({
    list,
    total: rows.length,
  });
});
