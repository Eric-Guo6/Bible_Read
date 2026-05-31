/**
 * i18nMiddleware.js - 翻译与底部导航高亮
 * 默认语言：English (en)
 */

const User = require("../models/User");
const { createTranslator } = require("../utils/i18n");

function resolveActiveNav(path) {
  if (path === "/dashboard" || path === "/") return "home";
  if (path.startsWith("/checkin")) return "checkin";
  if (path.startsWith("/community")) return "community";
  if (path.startsWith("/leaderboard")) return "leaderboard";
  if (
    path.startsWith("/profile") ||
    path.startsWith("/settings") ||
    path.startsWith("/admin")
  ) {
    return "profile";
  }
  return "";
}

async function attachI18n(req, res, next) {
  if (!req.session.lang) {
    req.session.lang = "en";
  }

  let lang = req.session.lang;

  if (req.session?.userId) {
    const user =
      res.locals.currentUser ||
      (await User.findById(req.session.userId).select("language"));
    if (user?.language) {
      lang = user.language;
      req.session.lang = lang;
    }
  }

  if (!["zh", "en"].includes(lang)) lang = "en";

  res.locals.lang = lang;
  res.locals.t = createTranslator(lang);
  res.locals.activeNav = resolveActiveNav(req.path);
  req.t = res.locals.t;
  next();
}

module.exports = { attachI18n };
