/**
 * authMiddleware.js - 登录保护
 * 未登录用户访问受保护页面时，重定向到登录页
 */

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect("/login");
}

/** 把当前登录用户信息挂到 res.locals，供所有 EJS 模板使用 */
async function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    const User = require("../models/User");
    const user = await User.findById(req.session.userId).select(
      "-password"
    );
    res.locals.currentUser = user;
  } else {
    res.locals.currentUser = null;
  }
  next();
}

module.exports = { requireAuth, attachUser };
