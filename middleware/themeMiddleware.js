/**
 * themeMiddleware.js - 白天/夜间主题 + 顶部页面标题
 */

const User = require("../models/User");

function resolvePageTitle(path, t, isLoggedIn) {
  if (isLoggedIn) {
    if (path === "/dashboard") return t("nav.home");
    if (path.startsWith("/checkin")) return t("nav.checkin");
    if (path.startsWith("/community")) return t("nav.community");
    if (path.startsWith("/leaderboard")) return t("nav.leaderboard");
    if (path === "/profile") return t("nav.profile");
    if (path.startsWith("/settings")) return t("nav.settings");
    if (path.startsWith("/admin")) return t("admin.title");
    return "";
  }
  if (path === "/login") return t("auth.loginTitle");
  if (path === "/register") return t("auth.registerTitle");
  return "";
}

async function attachTheme(req, res, next) {
  let theme = req.session?.theme || "light";

  if (req.session?.userId) {
    const user =
      res.locals.currentUser ||
      (await User.findById(req.session.userId).select("theme"));
    if (user?.theme) {
      theme = user.theme;
      req.session.theme = theme;
    }
  }

  if (!["light", "dark"].includes(theme)) theme = "light";

  res.locals.theme = theme;
  const isLoggedIn = !!req.session?.userId;
  res.locals.pageTitle = resolvePageTitle(
    req.path,
    res.locals.t || ((k) => k),
    isLoggedIn
  );
  next();
}

module.exports = { attachTheme };
