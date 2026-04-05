import { eventHandler } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

/** 可选推广域名（mock，与 site_ui 域名下拉一致） */
const MOCK_DOMAINS = [
  'promo-a.example.com',
  'promo-b.example.com',
  'team2.example.com',
  'landing.example.net',
  'cdn.example.org',
];

export default eventHandler((event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  return useResponseSuccess({
    list: MOCK_DOMAINS.map((domain) => ({ domain })),
  });
});
