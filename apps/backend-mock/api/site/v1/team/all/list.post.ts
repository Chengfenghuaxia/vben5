import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

import { teamRecords } from './mock-store';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  await readBody(event).catch(() => ({}));

  const list = teamRecords.map((r) => ({ id: r.id, name: r.name }));
  return useResponseSuccess({ list });
});
