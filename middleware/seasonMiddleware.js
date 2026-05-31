/**
 * seasonMiddleware.js - 挂载当前挑战阶段信息
 */

const {
  getCurrentPeriod,
  getAllPeriods,
  isSeasonActive,
  CHALLENGE_YEAR,
} = require("../utils/seasonUtils");

function attachSeason(req, res, next) {
  const year = CHALLENGE_YEAR;
  res.locals.challengeYear = year;
  res.locals.currentPeriod = getCurrentPeriod(new Date(), year);
  res.locals.allPeriods = getAllPeriods(year);
  res.locals.seasonActive = isSeasonActive(new Date(), year);
  next();
}

module.exports = { attachSeason };
