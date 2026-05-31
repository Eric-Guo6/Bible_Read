/**
 * scripts/seedGroups.js - 单独运行以初始化小组数据
 * 用法: npm run seed
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Group = require("../models/Group");

const DEFAULT_GROUPS = [
  { name: "3-times", leader: "Yang", weeklyGoal: 3 },
  { name: "4-times", leader: "Yolanda", weeklyGoal: 4 },
  { name: "5-times", leader: "Eric", weeklyGoal: 5 },
  { name: "7-times", leader: "Deborah", weeklyGoal: 7 },
];

async function run() {
  const uri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bible-reading-challenge";
  await mongoose.connect(uri);
  for (const g of DEFAULT_GROUPS) {
    await Group.findOneAndUpdate({ name: g.name }, g, { upsert: true });
    console.log("已同步小组:", g.name);
  }
  await mongoose.disconnect();
  console.log("完成");
}

run().catch(console.error);
