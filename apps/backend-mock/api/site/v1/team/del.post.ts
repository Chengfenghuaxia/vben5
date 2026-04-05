import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

import { deleteTeams } from './mock-store';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<{
    id?: number | string;
    ids?: number[];
  }>(event).catch(() => ({}));

  const idsRaw = body?.ids;
  if (Array.isArray(idsRaw) && idsRaw.length > 0) {
    deleteTeams(idsRaw.map((n) => Number(n)).filter((n) => Number.isFinite(n)));
  } else if (body?.id != null && body.id !== '') {
    const id = Number(body.id);
    if (Number.isFinite(id)) {
      deleteTeams([id]);
    }
  }

  return useResponseSuccess(true);
});
