/**
 * settingsRoutes.js - 语言与白天/夜间主题
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/settings", requireAuth, (req, res) => {
  res.render("settings", {
    title: req.t("settings.title"),
    pageTitle: req.t("settings.title"),
    saved: req.query.saved === "1",
    currentLang: res.locals.lang,
    currentTheme: res.locals.theme,
  });
});

router.post(
  "/settings",
  requireAuth,
  [
    body("language").isIn(["zh", "en"]),
    body("theme").isIn(["light", "dark"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.redirect("/settings");
    }

    const { language, theme } = req.body;
    req.session.lang = language;
    req.session.theme = theme;

    await User.findByIdAndUpdate(req.session.userId, { language, theme });
    res.redirect("/profile?settingsSaved=1");
  }
);

module.exports = router;
