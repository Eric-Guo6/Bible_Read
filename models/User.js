/**
 * User.js - 用户数据模型
 * 存储账号、加密密码、角色与所属小组
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  group: {
    type: String,
    enum: ["3-times", "4-times", "5-times", "7-times"],
    required: true,
  },
  language: {
    type: String,
    enum: ["zh", "en"],
    default: "en",
  },
  theme: {
    type: String,
    enum: ["light", "dark"],
    default: "light",
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  /** 最近一次在哪个挑战阶段改过小组，例如 june-2026 */
  lastGroupChangePeriod: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
