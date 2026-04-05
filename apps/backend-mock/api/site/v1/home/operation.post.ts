import { eventHandler, readBody } from 'h3';

import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

function buildHourList() {
  const list = [];
  for (let hour = 0; hour < 24; hour++) {
    const base = 1000 + hour * 80;
    list.push({
      hour,
      last_deposit: base * 0.9,
      deposit: base,
      last_withdrawal: base * 0.75,
      withdrawal: base * 0.78,
      last_difference: base * 0.15,
      difference: base * 0.18,
      last_wl_amount: base * 0.05,
      wl_amount: base * 0.06,
    });
  }
  return list;
}

function buildHistoryList() {
  const out = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push({
      date: `${y}-${m}-${day}`,
      ip: 8000 + i * 420,
      register: 120 + i * 15,
      fission: 40 + i * 5,
      online: 2000 + i * 100,
      apk_download: 300 + i * 20,
      apk_register: 60 + i * 8,
    });
  }
  return out;
}

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  await readBody(event).catch(() => ({}));

  return useResponseSuccess({
    apk_download_today: 428,
    apk_download_yesterday: 392,
    first_deposit: 128,
    fission: 86,
    history_list: buildHistoryList(),
    ip: 18_420,
    list: buildHourList(),
    new_deposit: 64,
    one_first_deposit: 42,
    one_new_deposit: 28,
    online: 3256,
    pwa: 960,
    register: 642,
    version: 'mock-1.0.0',
  });
});
