/**
 * Site 后台时间展示：优先使用 `/site/v1/admin/info` 返回的 `load_location`（IANA），
 * 与 site_ui `utils/date.ts` 行为对齐；未登录或无字段时回退偏好时区 / 默认圣保罗。
 */
import type { Dayjs } from 'dayjs';

import { useTimezoneStore, useUserStore } from '@vben/stores';

import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
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

let siteDayjsTzReady = false;

/** 启用 dayjs 时区解析（与 site_ui 日期范围按站点时区转时间戳一致） */
function ensureSiteDayjsTz() {
  if (!siteDayjsTzReady) {
    dayjs.extend(utc);
    dayjs.extend(timezonePlugin);
    siteDayjsTzReady = true;
  }
}

function isDayjsLike(v: unknown): v is Dayjs {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Dayjs).format === 'function' &&
    typeof (v as Dayjs).isValid === 'function'
  );
}

/**
 * 将筛选项里的「日历日」规范为 YYYY-MM-DD（用于与站点时区组合）。
 * 优先使用 `valueFormat: 'YYYY-MM-DD'` 的字符串；否则用 dayjs 按本地历日格式化。
 */
export function normalizeSiteCalendarYmd(value: unknown): null | string {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return t;
    }
    const head = t.match(/^(\d{4}-\d{2}-\d{2})/);
    if (head) {
      return head[1]!;
    }
  }
  if (value instanceof Date) {
    const d = dayjs(value);
    return d.isValid() ? d.format('YYYY-MM-DD') : null;
  }
  if (isDayjsLike(value)) {
    return value.isValid() ? value.format('YYYY-MM-DD') : null;
  }
  const n = Number(value);
  if (Number.isFinite(n)) {
    const d = dayjs(n);
    return d.isValid() ? d.format('YYYY-MM-DD') : null;
  }
  return null;
}

/**
 * 将「开始日、结束日」在指定 IANA 时区内的 00:00:00.000 ~ 23:59:59.999 转为 UTC 毫秒，
 * 供接口 `start_at` / `end_at`（与 site_ui 按后端时区传参一致）。
 *
 * @param ianaTimeZone 缺省为 `getSiteDisplayTimezone()`（userinfo.load_location）
 */
export function siteCalendarDateRangeToUtcMillis(
  startRaw: unknown,
  endRaw: unknown,
  ianaTimeZone?: string,
): { end_at: number; start_at: number } | null {
  const startYmd = normalizeSiteCalendarYmd(startRaw);
  const endYmd = normalizeSiteCalendarYmd(endRaw);
  if (!startYmd || !endYmd) {
    return null;
  }

  const tzRaw = (ianaTimeZone ?? getSiteDisplayTimezone()).trim();
  const tryTz = (tz: string) => {
    ensureSiteDayjsTz();
    const startMs = dayjs
      .tz(startYmd, 'YYYY-MM-DD', tz)
      .startOf('day')
      .valueOf();
    const endMs = dayjs.tz(endYmd, 'YYYY-MM-DD', tz).endOf('day').valueOf();
    return { end_at: endMs, start_at: startMs };
  };

  try {
    return tryTz(tzRaw || SITE_FALLBACK_TIMEZONE);
  } catch {
    if (tzRaw && tzRaw !== SITE_FALLBACK_TIMEZONE) {
      try {
        return tryTz(SITE_FALLBACK_TIMEZONE);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const SITE_WALL_DATETIME_FMT = 'YYYY-MM-DD HH:mm:ss';

function normalizeSiteWallDateTimeString(value: unknown): null | string {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(t)) {
      return t;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return `${t} 00:00:00`;
    }
  }
  if (value instanceof Date || isDayjsLike(value)) {
    const d = isDayjsLike(value) ? value : dayjs(value);
    return d.isValid() ? d.format(SITE_WALL_DATETIME_FMT) : null;
  }
  const ms = normalizeToUnixMillis(value as number | string);
  if (ms === null) {
    return null;
  }
  return dayjs(ms).format(SITE_WALL_DATETIME_FMT);
}

/**
 * 将「站点时区下的墙钟时间」`YYYY-MM-DD HH:mm:ss`（RangePicker valueFormat）转为 UTC 毫秒起止，
 * 用于充值订单列表的 `start_time`/`end_time`、`start_at`/`end_at` 等。
 */
export function siteDateTimeWallRangeToUtcMillis(
  startRaw: unknown,
  endRaw: unknown,
  ianaTimeZone?: string,
): { end_ms: number; start_ms: number } | null {
  const startStr = normalizeSiteWallDateTimeString(startRaw);
  const endStr = normalizeSiteWallDateTimeString(endRaw);
  if (!startStr || !endStr) {
    return null;
  }
  const tzRaw = (ianaTimeZone ?? getSiteDisplayTimezone()).trim();
  const tryTz = (tz: string) => {
    ensureSiteDayjsTz();
    const startMs = dayjs.tz(startStr, SITE_WALL_DATETIME_FMT, tz).valueOf();
    const endMs = dayjs.tz(endStr, SITE_WALL_DATETIME_FMT, tz).valueOf();
    return { end_ms: endMs, start_ms: startMs };
  };
  try {
    return tryTz(tzRaw || SITE_FALLBACK_TIMEZONE);
  } catch {
    if (tzRaw && tzRaw !== SITE_FALLBACK_TIMEZONE) {
      try {
        return tryTz(SITE_FALLBACK_TIMEZONE);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** 站点「当天」起止墙钟时间字符串对（用于搜索表单默认创建时间范围） */
export function defaultSiteTodayWallDateTimeRange(): [string, string] {
  const tz = getSiteDisplayTimezone() || SITE_FALLBACK_TIMEZONE;
  ensureSiteDayjsTz();
  try {
    const d = dayjs().tz(tz);
    return [
      d.startOf('day').format(SITE_WALL_DATETIME_FMT),
      d.endOf('day').format(SITE_WALL_DATETIME_FMT),
    ];
  } catch {
    const d = dayjs().tz(SITE_FALLBACK_TIMEZONE);
    return [
      d.startOf('day').format(SITE_WALL_DATETIME_FMT),
      d.endOf('day').format(SITE_WALL_DATETIME_FMT),
    ];
  }
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

  const tz = getSiteDisplayTimezone();
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
