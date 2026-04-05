import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

const allAgents = [
  { id: 1001, name: '示例渠道 A', team_id: 1 },
  { id: 1002, name: '示例渠道 B', team_id: 2 },
];

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<{ team_ids?: number[] }>(event).catch(() => ({}));
  const teamIds = body?.team_ids?.filter((n) => Number.isFinite(n)) ?? [];

  let list = allAgents.map(({ team_id: _t, ...rest }) => rest);
  if (teamIds.length > 0) {
    list = allAgents
      .filter((a) => teamIds.includes(a.team_id))
      .map(({ team_id: _t, ...rest }) => rest);
  }

  return useResponseSuccess({ list });
});
