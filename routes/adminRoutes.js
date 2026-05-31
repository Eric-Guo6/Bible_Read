/**
 * adminRoutes.js - 管理员后台（仅 /admin 路径校验权限）
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Group = require("../models/Group");
const CheckIn = require("../models/CheckIn");
const Like = require("../models/Like");
const { requireAdmin } = require("../middleware/adminMiddleware");
const { getLeaderboard, getGroupStats, resolvePeriod } = require("../utils/statsUtils");
const { getPeriodRangeLabel } = require("../utils/seasonUtils");

const router = express.Router();

router.get("/admin", requireAdmin, async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  const groups = await Group.find().sort({ weeklyGoal: 1 });
  const period = resolvePeriod(req.query.period);
  const leaderboard = period ? await getLeaderboard(period) : [];
  const groupStatsList = [];
  if (period) {
    for (const g of groups) {
      groupStatsList.push(await getGroupStats(g.name, period));
    }
  }

  const msgKey = req.query.msg;
  const message = msgKey ? req.t(`admin.${msgKey}`) : null;

  res.render("admin/dashboard", {
    title: req.t("admin.title"),
    users,
    groups,
    leaderboard,
    groupStatsList,
    period,
    periodLabel: period ? getPeriodRangeLabel(period, res.locals.lang) : "",
    message,
  });
});

router.post("/admin/checkin/:id/delete", requireAdmin, async (req, res) => {
  await Like.deleteMany({ checkInId: req.params.id });
  await CheckIn.findByIdAndDelete(req.params.id);
  res.redirect("/admin?msg=deleted");
});

router.post(
  "/admin/user/:id/group",
  requireAdmin,
  body("group").isIn(["3-times", "4-times", "5-times", "7-times"]),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect("/admin?msg=invalidGroup");
    }
    await User.findByIdAndUpdate(req.params.id, { group: req.body.group });
    res.redirect("/admin?msg=groupUpdated");
  }
);

router.post(
  "/admin/user/:id/role",
  requireAdmin,
  body("role").isIn(["user", "admin"]),
  async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
    res.redirect("/admin?msg=roleUpdated");
  }
);

router.post(
  "/admin/group",
  requireAdmin,
  [
    body("name").trim().notEmpty(),
    body("leader").trim().notEmpty(),
    body("weeklyGoal").isInt({ min: 1, max: 14 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect("/admin?msg=groupFormInvalid");
    }
    const { name, leader, weeklyGoal, editName } = req.body;
    if (editName) {
      await Group.findOneAndUpdate(
        { name: editName },
        { name, leader, weeklyGoal: Number(weeklyGoal) }
      );
    } else {
      await Group.findOneAndUpdate(
        { name },
        { leader, weeklyGoal: Number(weeklyGoal) },
        { upsert: true, new: true }
      );
    }
    res.redirect("/admin?msg=groupSaved");
  }
);

router.get("/admin/user/:id/checkins", requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  const checkins = await CheckIn.find({ userId: user._id }).sort({ date: -1 });
  res.render("admin/user-checkins", {
    title: req.t("admin.userCheckinsTitle", { name: user.username }),
    pageTitle: req.t("admin.userCheckinsTitle", { name: user.username }),
    user,
    checkins,
  });
});

module.exports = router;
