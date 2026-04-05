import { eventHandler } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler((event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  return useResponseSuccess({
    id: userinfo.id,
    load_location: 'America/Sao_Paulo',
    real_name: userinfo.realName,
    roles: userinfo.roles,
    username: userinfo.username,
  });
});
