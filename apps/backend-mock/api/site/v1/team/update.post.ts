import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  unAuthorizedResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

import { updateTeam } from './mock-store';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody<{
    domain?: string[];
    id?: number | string;
    name?: string;
  }>(event).catch(() => ({}));

  const id = Number(body?.id);
  const name = String(body?.name ?? '').trim();
  const domain = Array.isArray(body?.domain) ? body.domain.map((d) => String(d)) : [];
  if (!Number.isFinite(id) || !name || domain.length === 0) {
    return useResponseError('参数无效');
  }

  const ok = updateTeam(id, name, domain);
  if (!ok) {
    return useResponseError('记录不存在');
  }
  return useResponseSuccess(true);
});
