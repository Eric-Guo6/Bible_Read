/**
 * Like.js - 读经心得点赞
 */

const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkInId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CheckIn",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

likeSchema.index({ userId: 1, checkInId: 1 }, { unique: true });
likeSchema.index({ checkInId: 1 });

module.exports = mongoose.model("Like", likeSchema);
