/**
 * dashboardRoutes.js - 用户主页、排行榜、个人资料、每月改组
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Group = require("../models/Group");
const CheckIn = require("../models/CheckIn");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  hasCheckedInToday,
  getUserWeeklyStats,
  getUserPeriodStats,
  getGroupStats,
  getLeaderboard,
  resolvePeriod,
} = require("../utils/statsUtils");
const { getWeekRangeLabel } = require("../utils/weekUtils");
const {
  getCurrentPeriod,
  getPeriodRangeLabel,
  getAllPeriods,
} = require("../utils/seasonUtils");

const router = express.Router();

router.get("/dashboard", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const group = await Group.findOne({ name: user.group });
  const period = resolvePeriod(null);
  const stats = await getUserWeeklyStats(user._id, user.group);
  let groupStats = null;
  let myGroupRank = 0;
  let periodLabel = "";

  if (period) {
    periodLabel = getPeriodRangeLabel(period, res.locals.lang);
    groupStats = await getGroupStats(user.group, period);
    const leaderboard = await getLeaderboard(period);
    myGroupRank = leaderboard.findIndex((g) => g.group.name === user.group) + 1;
  }

  const periodStats = period
    ? await getUserPeriodStats(user._id, user.group, period)
    : null;
  const checkedToday = await hasCheckedInToday(user._id);

  res.render("dashboard", {
    title: req.t("dashboard.title"),
    user,
    group,
    stats,
    periodStats,
    groupStats,
    myGroupRank,
    checkedToday,
    weekRange: getWeekRangeLabel(),
    periodLabel,
    seasonActive: res.locals.seasonActive,
    justChecked: req.query.checked === "1",
    showOnboarding: !user.onboardingCompleted,
  });
});

router.post("/onboarding/complete", requireAuth, async (req, res) => {
  await User.findByIdAndUpdate(req.session.userId, {
    onboardingCompleted: true,
  });
  if (res.locals.currentUser) {
    res.locals.currentUser.onboardingCompleted = true;
  }
  res.redirect("/dashboard");
});

router.get("/leaderboard", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const period = resolvePeriod(req.query.period);
  const leaderboard = period ? await getLeaderboard(period) : [];
  const allPeriods = getAllPeriods();

  res.render("leaderboard", {
    title: req.t("leaderboard.title"),
    leaderboard,
    userGroup: user.group,
    period,
    allPeriods,
    periodLabel: period ? getPeriodRangeLabel(period, res.locals.lang) : "",
    seasonActive: res.locals.seasonActive,
  });
});

router.get("/profile", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const group = await Group.findOne({ name: user.group });
  const groups = await Group.find().sort({ weeklyGoal: 1 });
  const period = getCurrentPeriod();
  const stats = await getUserWeeklyStats(user._id, user.group);
  const periodStats = period
    ? await getUserPeriodStats(user._id, user.group, period)
    : null;
  const history = await CheckIn.find({ userId: user._id })
    .sort({ date: -1 })
    .limit(50);

  const canChangeGroup = period && user.lastGroupChangePeriod !== period.id;

  res.render("profile", {
    title: req.t("profile.title"),
    user,
    group,
    groups,
    stats,
    periodStats,
    period,
    history,
    weekRange: getWeekRangeLabel(),
    periodLabel: period ? getPeriodRangeLabel(period, res.locals.lang) : "",
    canChangeGroup,
    settingsSaved: req.query.settingsSaved === "1",
    groupChanged: req.query.groupChanged === "1",
    groupChangeError: req.query.groupChangeError || null,
    reflectionStatus: req.query.reflection || "",
    errorMessage: req.query.error || "",
  });
});

router.post(
  "/profile/change-group",
  requireAuth,
  body("group").isIn(["3-times", "4-times", "5-times", "7-times"]),
  async (req, res) => {
    const period = getCurrentPeriod();
    if (!period) {
      return res.redirect("/profile?groupChangeError=notInSeason");
    }

    const user = await User.findById(req.session.userId);
    if (user.lastGroupChangePeriod === period.id) {
      return res.redirect("/profile?groupChangeError=alreadyChanged");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect("/profile?groupChangeError=invalid");
    }

    await User.findByIdAndUpdate(req.session.userId, {
      group: req.body.group,
      lastGroupChangePeriod: period.id,
    });

    res.redirect("/profile?groupChanged=1");
  },
);

module.exports = router;
