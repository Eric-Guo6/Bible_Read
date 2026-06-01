/**
 * timezoneUtils.js - 应用统一使用温哥华时间（可配置）
 * 解决服务器在 UTC/其他时区时「晚上仍算第二天」的问题
 */

const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Vancouver";

const WEEKDAY_MAP = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getZonedParts(date = new Date(), timeZone = APP_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const pick = (type) => parts.find((p) => p.type === type)?.value;

  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    hour: Number(pick("hour")),
    minute: Number(pick("minute")),
    second: Number(pick("second")),
  };
}

/** 某时刻在指定时区相对 UTC 的偏移（毫秒） */
function getTimeZoneOffsetMs(date, timeZone = APP_TIMEZONE) {
  const d = new Date(date);
  const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  const zoned = new Date(d.toLocaleString("en-US", { timeZone }));
  return zoned.getTime() - utc.getTime();
}

/** 公历 Y-M-D 当天 00:00:00（该时区）对应的 Date */
function startOfDayFromYmd(year, month, day, timeZone = APP_TIMEZONE) {
  const utcNoon = Date.UTC(year, month - 1, day, 12, 0, 0, 0);
  const offset = getTimeZoneOffsetMs(new Date(utcNoon), timeZone);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offset);
}

function startOfDayInZone(date = new Date(), timeZone = APP_TIMEZONE) {
  const { year, month, day } = getZonedParts(date, timeZone);
  return startOfDayFromYmd(year, month, day, timeZone);
}

function endOfDayInZone(date = new Date(), timeZone = APP_TIMEZONE) {
  const start = startOfDayInZone(date, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** 公历月日构造（1=一月，6=六月） */
function calendarDateInZone(
  year,
  month1to12,
  day,
  timeZone = APP_TIMEZONE,
) {
  return startOfDayFromYmd(year, month1to12, day, timeZone);
}

function getZonedWeekday(date, timeZone = APP_TIMEZONE) {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return WEEKDAY_MAP[short.slice(0, 3)];
}

function addCalendarDaysInZone(date, days, timeZone = APP_TIMEZONE) {
  const { year, month, day } = getZonedParts(date, timeZone);
  const temp = new Date(Date.UTC(year, month - 1, day + days));
  return startOfDayFromYmd(
    temp.getUTCFullYear(),
    temp.getUTCMonth() + 1,
    temp.getUTCDate(),
    timeZone,
  );
}

function formatDateInZone(date, lang = "zh", timeZone = APP_TIMEZONE) {
  return new Intl.DateTimeFormat(lang === "en" ? "en-CA" : "zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function formatYmdInZone(date = new Date(), timeZone = APP_TIMEZONE) {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isSameCalendarDayInZone(a, b, timeZone = APP_TIMEZONE) {
  return formatYmdInZone(a, timeZone) === formatYmdInZone(b, timeZone);
}

function getYearInZone(date = new Date(), timeZone = APP_TIMEZONE) {
  return getZonedParts(date, timeZone).year;
}

module.exports = {
  APP_TIMEZONE,
  getZonedParts,
  startOfDayInZone,
  endOfDayInZone,
  startOfDayFromYmd,
  calendarDateInZone,
  getZonedWeekday,
  addCalendarDaysInZone,
  formatDateInZone,
  formatYmdInZone,
  isSameCalendarDayInZone,
  getYearInZone,
};
