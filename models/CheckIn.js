/**
 * CheckIn.js - 每日读经打卡记录
 * userId + date（同一天）唯一，防止重复打卡
 */

const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  biblePassage: {
    type: String,
    trim: true,
    default: "",
  },
  reflection: {
    type: String,
    trim: true,
    default: "",
  },
  reflectionWithdrawn: {
    type: Boolean,
    default: false,
  },
  reflectionUpdatedAt: {
    type: Date,
    default: null,
  },
  completed: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 同一用户同一天只能有一条打卡（按 date 的日历日）
checkInSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("CheckIn", checkInSchema);
