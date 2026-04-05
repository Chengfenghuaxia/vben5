/**
 * Site 后台时间展示：优先使用 `/site/v1/admin/info` 返回的 `load_location`（IANA），
 * 与 site_ui `utils/date.ts` 行为对齐；未登录或无字段时回退偏好时区 / 默认圣保罗。
 */
import { useTimezoneStore, useUserStore } from '@vben/stores';

import { getActivePinia } from 'pinia';

/** 与 site_ui 默认一致 */
export const SITE_FALLBACK_TIMEZONE = 'America/Sao_Paulo';

/**
 * 当前应用用于「展示」的 IANA 时区（来自后端 userinfo，其次为 vben 时区偏好）。
 */
export function getSiteDisplayTimezone(): string {
  const pinia = getActivePinia();
  if (pinia) {
    const userInfo = useUserStore(pinia).userInfo;
    const rawTz = userInfo?.loadLocation;
    if (typeof rawTz === 'string' && rawTz.trim()) {
      return rawTz.trim();
    }

    const tz = useTimezoneStore(pinia).timezone;
    if (typeof tz === 'string' && tz.trim()) {
      return tz.trim();
    }
  }
  return SITE_FALLBACK_TIMEZONE;
}

/**
 * 将后端常见时间入参统一为 UTC 毫秒时间戳（支持 Unix 秒 / 毫秒、ISO 字符串）。
 */
export function normalizeToUnixMillis(
  value: number | string | null | undefined,
): number | null {
  if (value == null || value === '') {
    return null;
  }
  const str = String(value).trim();
  if (!str) {
    return null;
  }

  const num = Number(str);
  if (Number.isFinite(num)) {
    const intPart = str.replace(/\.\d+$/, '');
    if (intPart.length <= 12) {
      return Math.trunc(num * 1000);
    }
    return Math.trunc(num);
  }

  const parsed = Date.parse(str);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPartsInTimezone(ms: number, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  });

  const parts = formatter.formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 按站点时区格式化为 `YYYY-MM-DD HH:mm:ss`（与 site_ui `timestampToDate` 输出形态一致）。
 */
export function formatSiteDateTime(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const ms = normalizeToUnixMillis(value);
  if (ms === null) {
    return '';
  }

  if (ms === 0) {
    try {
      return formatPartsInTimezone(0, getSiteDisplayTimezone());
    } catch {
      return '1970-01-01 00:00:00';
    }
  }

  let tz = getSiteDisplayTimezone();
  try {
    return formatPartsInTimezone(ms, tz);
  } catch {
    if (tz !== SITE_FALLBACK_TIMEZONE) {
      try {
        return formatPartsInTimezone(ms, SITE_FALLBACK_TIMEZONE);
      } catch {
        return '';
      }
    }
    return '';
  }
}
