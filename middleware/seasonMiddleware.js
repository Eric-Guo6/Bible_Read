/**
 * seasonMiddleware.js - 挂载当前挑战阶段信息
 */

const {
  getCurrentPeriod,
  getAllPeriods,
  isSeasonActive,
  CHALLENGE_YEAR,
  APP_TIMEZONE,
} = require("../utils/seasonUtils");
const {
  formatDateInZone,
  getZonedParts,
} = require("../utils/timezoneUtils");

function attachSeason(req, res, next) {
  const year = CHALLENGE_YEAR;
  const now = new Date();
  res.locals.challengeYear = year;
  res.locals.appTimezone = APP_TIMEZONE;
  res.locals.currentPeriod = getCurrentPeriod(now, year);
  res.locals.allPeriods = getAllPeriods(year);
  res.locals.seasonActive = isSeasonActive(now, year);
  res.locals.formatAppDate = (date) =>
    formatDateInZone(date, res.locals.lang || "zh");
  const parts = getZonedParts(now);
  res.locals.appNowLabel = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")} ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
  next();
}

module.exports = { attachSeason };
