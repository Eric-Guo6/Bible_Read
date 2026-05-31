/**
 * weekUtils.js - 本周日期范围与「同一天」判断
 * 每周从周一 00:00 到周日 23:59:59（本地时区）
 */

/** 获取本周周一 00:00:00 */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=周日, 1=周一 ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 获取本周周日 23:59:59 */
function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** 格式化为 YYYY-MM-DD，用于显示 */
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 本周范围字符串，例如 2026-05-26 ~ 2026-06-01 */
function getWeekRangeLabel(date = new Date()) {
  return `${formatDate(getWeekStart(date))} ~ ${formatDate(getWeekEnd(date))}`;
}

/** 今天的开始时间 00:00:00 */
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 今天的结束时间 23:59:59 */
function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** 判断两个日期是否为同一天 */
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

module.exports = {
  getWeekStart,
  getWeekEnd,
  formatDate,
  getWeekRangeLabel,
  startOfDay,
  endOfDay,
  isSameDay,
};
