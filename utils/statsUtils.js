/**
 * statsUtils.js - 每周打卡 + 按挑战月（6/7/8 阶段）排行
 */

const CheckIn = require("../models/CheckIn");
const User = require("../models/User");
const Group = require("../models/Group");
const {
  getWeekStart,
  getWeekEnd,
  startOfDay,
  endOfDay,
} = require("./weekUtils");
const {
  formatYmdInZone,
  addCalendarDaysInZone,
} = require("./timezoneUtils");
const { getWeeksInPeriod, resolvePeriod } = require("./seasonUtils");

function personalCompletionRate(checkInCount, weeklyGoal) {
  if (!weeklyGoal || weeklyGoal <= 0) return 0;
  return Math.min(checkInCount / weeklyGoal, 1);
}

async function countCheckInsInRange(userId, rangeStart, rangeEnd) {
  return CheckIn.countDocuments({
    userId,
    date: { $gte: rangeStart, $lte: rangeEnd },
  });
}

async function countUserCheckInsThisWeek(userId) {
  return countCheckInsInRange(userId, getWeekStart(), getWeekEnd());
}

async function getUserCheckInsThisWeek(userId) {
  return CheckIn.find({
    userId,
    date: { $gte: getWeekStart(), $lte: getWeekEnd() },
  }).sort({ date: -1 });
}

async function hasCheckedInToday(userId) {
  const existing = await CheckIn.findOne({
    userId,
    date: { $gte: startOfDay(), $lte: endOfDay() },
  });
  return !!existing;
}

async function getUserPeriodCompletionRate(userId, weeklyGoal, period) {
  const weeks = getWeeksInPeriod(period);
  if (weeks.length === 0) return 0;

  let sum = 0;
  for (const w of weeks) {
    const count = await countCheckInsInRange(userId, w.weekStart, w.weekEnd);
    sum += personalCompletionRate(count, weeklyGoal);
  }
  return sum / weeks.length;
}

async function countUserCheckInsInPeriod(userId, period) {
  return CheckIn.countDocuments({
    userId,
    date: { $gte: period.start, $lte: period.end },
  });
}

async function getStreakDays(userId) {
  const checkIns = await CheckIn.find({ userId })
    .sort({ date: -1 })
    .select("date");

  if (checkIns.length === 0) return 0;

  const daySet = new Set(
    checkIns.map((c) => formatYmdInZone(c.date)),
  );
  const sortedDays = [...daySet].sort((a, b) => b.localeCompare(a));

  const todayKey = formatYmdInZone(new Date());
  const yesterdayKey = formatYmdInZone(
    addCalendarDaysInZone(new Date(), -1),
  );

  const latest = sortedDays[0];
  if (latest !== todayKey && latest !== yesterdayKey) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = sortedDays[i - 1];
    const curr = sortedDays[i];
    const prevDate = new Date(prev + "T12:00:00");
    const currDate = new Date(curr + "T12:00:00");
    const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

async function getTotalCheckInDays(userId) {
  const checkIns = await CheckIn.find({ userId }).select("date");
  const daySet = new Set(checkIns.map((c) => formatYmdInZone(c.date)));
  return daySet.size;
}

async function getGroupStats(groupName, period) {
  const group = await Group.findOne({ name: groupName });
  if (!group) return null;

  const members = await User.find({ group: groupName });
  const memberCount = members.length;

  let totalCheckIns = 0;
  let completionSum = 0;
  const memberDetails = [];

  for (const member of members) {
    const periodCount = await countUserCheckInsInPeriod(member._id, period);
    totalCheckIns += periodCount;
    const rate = await getUserPeriodCompletionRate(
      member._id,
      group.weeklyGoal,
      period,
    );
    completionSum += rate;
    const streak = await getStreakDays(member._id);
    memberDetails.push({
      userId: member._id,
      username: member.username,
      periodCount,
      completionRate: Math.round(rate * 100),
      streak,
      checkedInThisPeriod: periodCount > 0,
    });
  }

  const groupScore =
    memberCount > 0 ? Math.round((completionSum / memberCount) * 100) : 0;

  return {
    group,
    memberCount,
    totalCheckIns,
    groupScore,
    memberDetails,
    membersNotCheckedIn: memberDetails.filter((m) => !m.checkedInThisPeriod),
    period,
  };
}

async function getLeaderboard(period) {
  const groups = await Group.find().sort({ weeklyGoal: 1 });
  const stats = [];
  for (const g of groups) {
    const data = await getGroupStats(g.name, period);
    if (data) stats.push(data);
  }
  stats.sort((a, b) => b.groupScore - a.groupScore);
  return stats;
}

async function getUserWeeklyStats(userId, groupName) {
  const group = await Group.findOne({ name: groupName });
  const weeklyCount = await countUserCheckInsThisWeek(userId);
  const goal = group ? group.weeklyGoal : 1;
  const rate = personalCompletionRate(weeklyCount, goal);
  return {
    weeklyCount,
    weeklyGoal: goal,
    completionPercent: Math.round(rate * 100),
    streak: await getStreakDays(userId),
    totalDays: await getTotalCheckInDays(userId),
  };
}

async function getUserPeriodStats(userId, groupName, period) {
  const group = await Group.findOne({ name: groupName });
  const goal = group ? group.weeklyGoal : 1;
  const periodCount = await countUserCheckInsInPeriod(userId, period);
  const rate = await getUserPeriodCompletionRate(userId, goal, period);
  const weeks = getWeeksInPeriod(period);
  return {
    periodCount,
    weeklyGoal: goal,
    periodCompletionPercent: Math.round(rate * 100),
    weeksInPeriod: weeks.length,
    streak: await getStreakDays(userId),
    totalDays: await getTotalCheckInDays(userId),
  };
}

module.exports = {
  personalCompletionRate,
  countUserCheckInsThisWeek,
  getUserCheckInsThisWeek,
  hasCheckedInToday,
  getStreakDays,
  getTotalCheckInDays,
  getGroupStats,
  getLeaderboard,
  getUserWeeklyStats,
  getUserPeriodStats,
  getUserPeriodCompletionRate,
  countUserCheckInsInPeriod,
  resolvePeriod,
};
