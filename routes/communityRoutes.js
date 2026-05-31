/**
 * communityRoutes.js - 今日读经心得、点赞、排序
 */

const express = require("express");
const mongoose = require("mongoose");
const CheckIn = require("../models/CheckIn");
const Like = require("../models/Like");
const User = require("../models/User");
const { requireAuth } = require("../middleware/authMiddleware");
const { startOfDay, endOfDay } = require("../utils/weekUtils");
const { isSeasonActive } = require("../utils/seasonUtils");

const router = express.Router();

router.get("/community", requireAuth, async (req, res) => {
  const sort = req.query.sort === "recent" ? "recent" : "likes";
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const userId = req.session.userId;

  const checkIns = await CheckIn.find({
    date: { $gte: todayStart, $lte: todayEnd },
    reflection: { $exists: true, $ne: "" },
  })
    .populate("userId", "username group")
    .lean();

  const ids = checkIns.map((c) => c._id);
  const likeCounts = await Like.aggregate([
    { $match: { checkInId: { $in: ids } } },
    { $group: { _id: "$checkInId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    likeCounts.map((r) => [r._id.toString(), r.count]),
  );

  const myLikes = await Like.find({
    userId,
    checkInId: { $in: ids },
  }).select("checkInId");
  const likedSet = new Set(myLikes.map((l) => l.checkInId.toString()));

  const goalByGroup = {
    "3-times": 3,
    "4-times": 4,
    "5-times": 5,
    "7-times": 7,
  };

  let posts = checkIns.map((c) => {
    const g = c.userId?.group || c.group;
    return {
      _id: c._id,
      biblePassage: c.biblePassage,
      reflection: c.reflection,
      createdAt: c.createdAt,
      username: c.userId?.username || "—",
      groupGoal: goalByGroup[g] || 0,
      likeCount: countMap[c._id.toString()] || 0,
      liked: likedSet.has(c._id.toString()),
      isMine: c.userId?._id?.toString() === userId,
    };
  });

  if (sort === "recent") {
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    posts.sort((a, b) => {
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  res.render("community", {
    title: req.t("community.title"),
    posts,
    sort,
    seasonActive: isSeasonActive(),
  });
});

router.post("/community/:checkInId/like", requireAuth, async (req, res) => {
  const sort = req.query.sort === "recent" ? "recent" : "likes";
  const checkInId = req.params.checkInId;

  if (!mongoose.Types.ObjectId.isValid(checkInId)) {
    return res.redirect(`/community?sort=${sort}`);
  }

  const existing = await Like.findOne({
    userId: req.session.userId,
    checkInId,
  });

  if (existing) {
    await Like.deleteOne({ _id: existing._id });
  } else {
    await Like.create({
      userId: req.session.userId,
      checkInId,
    });
  }

  res.redirect(`/community?sort=${sort}`);
});

module.exports = router;
