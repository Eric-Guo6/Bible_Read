/**
 * weekUtils.js - 本周范围与「今天」（温哥华时区）
 */

const {
  APP_TIMEZONE,
  startOfDayInZone,
  endOfDayInZone,
  getZonedWeekday,
  addCalendarDaysInZone,
  formatYmdInZone,
  formatDateInZone,
  isSameCalendarDayInZone,
} = require("./timezoneUtils");

/** 获取本周周一 00:00:00（温哥华） */
function getWeekStart(date = new Date()) {
  const start = startOfDayInZone(date);
  const dow = getZonedWeekday(start);
  const diff = dow === 0 ? -6 : 1 - dow;
  return addCalendarDaysInZone(start, diff);
}

/** 获取本周周日 23:59:59（温哥华） */
function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const sunday = addCalendarDaysInZone(start, 6);
  return endOfDayInZone(sunday);
}

function formatDate(d) {
  return formatYmdInZone(d);
}

function getWeekRangeLabel(date = new Date()) {
  return `${formatDate(getWeekStart(date))} ~ ${formatDate(getWeekEnd(date))}`;
}

function startOfDay(date = new Date()) {
  return startOfDayInZone(date);
}

function endOfDay(date = new Date()) {
  return endOfDayInZone(date);
}

function isSameDay(a, b) {
  return isSameCalendarDayInZone(a, b);
}

module.exports = {
  APP_TIMEZONE,
  getWeekStart,
  getWeekEnd,
  formatDate,
  formatDateInZone,
  getWeekRangeLabel,
  startOfDay,
  endOfDay,
  isSameDay,
};
