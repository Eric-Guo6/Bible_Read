/**
 * adminMiddleware.js - 管理员权限
 * 只有 role === 'admin' 的用户可以访问 /admin
 */

const User = require("../models/User");

async function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect("/login");
  }

  const user = await User.findById(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).render("error", {
      title: res.locals.t("errors.forbiddenTitle"),
      message: res.locals.t("errors.forbiddenMsg"),
    });
  }
  next();
}

module.exports = { requireAdmin };
