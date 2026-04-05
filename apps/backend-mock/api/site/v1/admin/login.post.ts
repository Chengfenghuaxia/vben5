import { defineEventHandler, readBody, setResponseStatus } from 'h3';

import { generateAccessToken } from '~/utils/jwt-utils';
import { MOCK_USERS } from '~/utils/mock-data';
import { useResponseError, useResponseSuccess } from '~/utils/response';

/**
 * site 后台风格登录（与 site_ui 一致路径），供本地 Nitro Mock 使用
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    auth_code?: string;
    pwd?: string;
    site?: string;
    username?: string;
  }>(event);
  const password = body?.pwd;
  const username = body?.username;

  if (!password || !username) {
    setResponseStatus(event, 400);
    return useResponseError('BadRequestException', 'Username and password are required');
  }

  const findUser = MOCK_USERS.find(
    (item) => item.username === username && item.password === password,
  );

  if (!findUser) {
    // 账号或密码错误用 401，避免与网关/权限 403 混淆
    setResponseStatus(event, 401);
    return useResponseError('Username or password is incorrect.', null);
  }

  const accessToken = generateAccessToken(findUser);

  return useResponseSuccess({
    role: findUser.roles[0] ?? 'user',
    token: accessToken,
    username: findUser.username,
  });
});
