import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

import { addTeam } from './mock-store';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<{
    domain?: string[];
    name?: string;
  }>(event).catch(() => ({}));

  const name = String(body?.name ?? '').trim();
  const domain = Array.isArray(body?.domain) ? body.domain.map((d) => String(d)) : [];
  if (!name || domain.length === 0) {
    return useResponseError('名称与推广域名必填');
  }

  addTeam(name, domain);
  return useResponseSuccess(true);
});
