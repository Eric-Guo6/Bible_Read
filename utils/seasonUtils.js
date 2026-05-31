/**
 * seasonUtils.js - 6/7/8 月挑战阶段（自定义日期，非自然月）
 * 每周打卡目标不变；排行榜按「挑战月」统计。
 */

const {
  getWeekStart,
  getWeekEnd,
  formatDate,
  startOfDay,
  endOfDay,
} = require("./weekUtils");

const CHALLENGE_YEAR =
  Number(process.env.CHALLENGE_YEAR) || new Date().getFullYear();

/**
 * 公历月份 1–12 构造日期（本地时区）
 * 注意：Date 的 month 从 0 起算，这里用人类习惯的 6=六月、8=八月
 */
function calendarDate(year, month1to12, day) {
  return new Date(year, month1to12 - 1, day);
}

/** 某年的三个阶段（与教会挑战一致） */
function buildPeriods(year) {
  return [
    {
      id: `june-${year}`,
      key: "june",
      labelZh: "六月",
      labelEn: "June",
      start: startOfDay(calendarDate(year, 6, 1)),
      end: endOfDay(calendarDate(year, 6, 28)),
    },
    {
      id: `july-${year}`,
      key: "july",
      labelZh: "七月",
      labelEn: "July",
      start: startOfDay(calendarDate(year, 6, 29)),
      end: endOfDay(calendarDate(year, 8, 2)),
    },
    {
      id: `august-${year}`,
      key: "august",
      labelZh: "八月",
      labelEn: "August",
      start: startOfDay(calendarDate(year, 8, 3)),
      end: endOfDay(calendarDate(year, 8, 30)),
    },
  ];
}

function getAllPeriods(year = CHALLENGE_YEAR) {
  return buildPeriods(year);
}

function getSeasonBounds(year = CHALLENGE_YEAR) {
  const periods = getAllPeriods(year);
  return { start: periods[0].start, end: periods[periods.length - 1].end };
}

/** 当前日期所在的挑战阶段；不在范围内返回 null */
function getCurrentPeriod(date = new Date(), year = CHALLENGE_YEAR) {
  const d = startOfDay(date);
  for (const p of getAllPeriods(year)) {
    if (d >= p.start && d <= p.end) return p;
  }
  return null;
}

/** 根据 id 或 key 查找阶段 */
function getPeriodById(periodId, year = CHALLENGE_YEAR) {
  return getAllPeriods(year).find((p) => p.id === periodId) || null;
}

function getPeriodByKey(key, year = CHALLENGE_YEAR) {
  return getAllPeriods(year).find((p) => p.key === key) || null;
}

/** 用于排行榜：默认当前阶段，否则取最近已结束或即将开始的 */
function resolvePeriod(
  periodIdOrKey,
  date = new Date(),
  year = CHALLENGE_YEAR,
) {
  if (periodIdOrKey) {
    const byId = getPeriodById(periodIdOrKey, year);
    if (byId) return byId;
    const byKey = getPeriodByKey(periodIdOrKey, year);
    if (byKey) return byKey;
  }
  const current = getCurrentPeriod(date, year);
  if (current) return current;
  const d = startOfDay(date);
  const all = getAllPeriods(year);
  const past = all.filter((p) => p.end < d);
  if (past.length) return past[past.length - 1];
  return all[0];
}

function getPeriodRangeLabel(period, lang = "zh") {
  const label = lang === "en" ? period.labelEn : period.labelZh;
  return `${label} (${formatDate(period.start)} ~ ${formatDate(period.end)})`;
}

function isDateInPeriod(date, period) {
  const d = startOfDay(date);
  return d >= period.start && d <= period.end;
}

function isSeasonActive(date = new Date(), year = CHALLENGE_YEAR) {
  if (process.env.SEASON_ALWAYS_ACTIVE === "true") return true;
  const { start, end } = getSeasonBounds(year);
  const d = startOfDay(date);
  return d >= start && d <= end;
}

/**
 * 阶段内所有「周」（周一至周日），与阶段边界取交集
 * 用于按月平均每周完成率
 */
function getWeeksInPeriod(period) {
  const weeks = [];
  let cursor = startOfDay(period.start);

  while (cursor <= period.end) {
    const monday = getWeekStart(cursor);
    const sunday = getWeekEnd(cursor);
    const weekStart = monday < period.start ? period.start : monday;
    const weekEnd = sunday > period.end ? period.end : sunday;
    weeks.push({
      weekStart: startOfDay(weekStart),
      weekEnd: endOfDay(weekEnd),
    });
    const next = new Date(weekEnd);
    next.setDate(next.getDate() + 1);
    cursor = next;
  }

  const merged = [];
  for (const w of weeks) {
    const last = merged[merged.length - 1];
    if (last && last.weekEnd >= w.weekStart) continue;
    merged.push(w);
  }
  return merged;
}

function getPeriodLabel(period, lang = "zh") {
  return lang === "en" ? period.labelEn : period.labelZh;
}

module.exports = {
  CHALLENGE_YEAR,
  getAllPeriods,
  getSeasonBounds,
  getCurrentPeriod,
  getPeriodById,
  getPeriodByKey,
  resolvePeriod,
  getPeriodRangeLabel,
  isDateInPeriod,
  isSeasonActive,
  getWeeksInPeriod,
  getPeriodLabel,
  formatDate,
};
