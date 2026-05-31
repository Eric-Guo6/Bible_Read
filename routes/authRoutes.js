/**
 * authRoutes.js - 注册、登录、登出
 */

const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Group = require("../models/Group");
const { requireAuth } = require("../middleware/authMiddleware");
const { translateErrors } = require("../utils/i18n");

const router = express.Router();

router.get("/register", async (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  const groups = await Group.find().sort({ weeklyGoal: 1 });
  res.render("register", {
    title: req.t("auth.registerTitle"),
    groups,
    errors: [],
    old: {},
  });
});

router.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage("errors.usernameLength"),
    body("email").isEmail().withMessage("errors.emailInvalid"),
    body("password").isLength({ min: 6 }).withMessage("errors.passwordLength"),
    body("group").isIn(["3-times", "4-times", "5-times", "7-times"]),
  ],
  async (req, res) => {
    const groups = await Group.find().sort({ weeklyGoal: 1 });
    const result = validationResult(req);
    const old = req.body;

    if (!result.isEmpty()) {
      return res.render("register", {
        title: req.t("auth.registerTitle"),
        groups,
        errors: translateErrors(req.t, result.array()),
        old,
      });
    }

    const { username, email, password, group } = req.body;

    const exists = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });
    if (exists) {
      return res.render("register", {
        title: req.t("auth.registerTitle"),
        groups,
        errors: [{ msg: req.t("errors.userExists") }],
        old,
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const lang = req.session.lang || "en";
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hash,
      group,
      role: "user",
      language: lang,
      theme: "light",
    });

    req.session.userId = user._id.toString();
    res.redirect("/dashboard");
  }
);

router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  res.render("login", { title: req.t("auth.loginTitle"), errors: [], old: {} });
});

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("errors.emailInvalid"),
    body("password").notEmpty().withMessage("errors.passwordRequired"),
  ],
  async (req, res) => {
    const result = validationResult(req);
    const old = req.body;

    if (!result.isEmpty()) {
      return res.render("login", {
        title: req.t("auth.loginTitle"),
        errors: translateErrors(req.t, result.array()),
        old,
      });
    }

    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.render("login", {
        title: req.t("auth.loginTitle"),
        errors: [{ msg: req.t("errors.credentials") }],
        old,
      });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.render("login", {
        title: req.t("auth.loginTitle"),
        errors: [{ msg: req.t("errors.credentials") }],
        old,
      });
    }

    req.session.userId = user._id.toString();
    req.session.lang = user.language || "en";
    req.session.theme = user.theme || "light";
    const returnTo = req.session.returnTo || "/dashboard";
    delete req.session.returnTo;
    res.redirect(returnTo);
  }
);

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
