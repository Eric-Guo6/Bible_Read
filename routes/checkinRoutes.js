/**
 * checkinRoutes.js - 今日打卡提交与打卡页
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const CheckIn = require("../models/CheckIn");
const User = require("../models/User");
const { requireAuth } = require("../middleware/authMiddleware");
const { hasCheckedInToday } = require("../utils/statsUtils");
const { startOfDay, getWeekRangeLabel } = require("../utils/weekUtils");
const { translateErrors } = require("../utils/i18n");
const { isSeasonActive } = require("../utils/seasonUtils");

const router = express.Router();

router.get("/checkin", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const alreadyCheckedIn = await hasCheckedInToday(user._id);
  res.render("checkin", {
    title: req.t("checkin.title"),
    alreadyCheckedIn,
    errors: [],
    form: {},
    weekRange: getWeekRangeLabel(),
    seasonActive: isSeasonActive(),
  });
});

router.post(
  "/checkin",
  requireAuth,
  [
    body("biblePassage")
      .trim()
      .notEmpty()
      .withMessage("errors.passageRequired"),
    body("reflection")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("errors.reflectionLength"),
  ],
  async (req, res) => {
    const user = await User.findById(req.session.userId);
    const weekRange = getWeekRangeLabel();
    const seasonActive = isSeasonActive();

    if (!seasonActive) {
      return res.render("checkin", {
        title: req.t("checkin.title"),
        alreadyCheckedIn: false,
        seasonActive: false,
        errors: [{ msg: req.t("season.notActive") }],
        form: req.body,
        weekRange,
      });
    }

    const alreadyCheckedIn = await hasCheckedInToday(user._id);

    if (alreadyCheckedIn) {
      return res.render("checkin", {
        title: req.t("checkin.title"),
        alreadyCheckedIn: true,
        errors: [{ msg: req.t("errors.alreadyCheckedIn") }],
        form: req.body,
        weekRange,
        seasonActive: true,
      });
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.render("checkin", {
        title: req.t("checkin.title"),
        alreadyCheckedIn: false,
        errors: translateErrors(req.t, result.array()),
        form: req.body,
        weekRange,
        seasonActive: true,
      });
    }

    const completed =
      req.body.completed === "on" || req.body.completed === "true";

    try {
      await CheckIn.create({
        userId: user._id,
        group: user.group,
        date: startOfDay(),
        biblePassage: req.body.biblePassage,
        reflection: req.body.reflection || "",
        completed,
      });
      res.redirect("/dashboard?checked=1");
    } catch (err) {
      if (err.code === 11000) {
        return res.render("checkin", {
          title: req.t("checkin.title"),
          alreadyCheckedIn: true,
          errors: [{ msg: req.t("errors.alreadyCheckedIn") }],
          form: req.body,
          weekRange,
          seasonActive: true,
        });
      }
      throw err;
    }
  }
);

module.exports = router;
