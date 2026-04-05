import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

import { teamRecords, teamToListRow } from './mock-store';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<{
    name?: string;
    page?: number;
    size?: number;
    team_ids?: number[];
  }>(event).catch(() => ({}));

  let rows = teamRecords.map(teamToListRow);

  if (body?.team_ids?.length) {
    const set = new Set(body.team_ids);
    rows = rows.filter((r) => set.has(r.id));
  }
  if (body?.name != null && String(body.name).trim() !== '') {
    const q = String(body.name).trim().toLowerCase();
    rows = rows.filter((r) => String(r.name ?? '').toLowerCase().includes(q));
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
