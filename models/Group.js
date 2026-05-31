/**
 * Group.js - 小组数据模型
 * 每个小组有名称、组长、每周打卡目标次数
 */

const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  leader: {
    type: String,
    required: true,
  },
  weeklyGoal: {
    type: Number,
    required: true,
    min: 1,
  },
});

module.exports = mongoose.model("Group", groupSchema);
