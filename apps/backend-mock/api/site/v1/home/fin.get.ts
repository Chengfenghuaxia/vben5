import { eventHandler } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler((event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  return useResponseSuccess({
    balance: 1_256_880.52,
    withdrawal_audit: 12,
    withdrawal_processed: 1860,
    withdrawal_total: 2042,
    withdrawal_unprocessed: 34,
  });
});
