/**
 * server.js - 应用入口
 * 连接数据库、配置 Session、挂载路由、启动 HTTP 服务
 */

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const morgan = require("morgan");
const path = require("path");
const bcrypt = require("bcrypt");

const { attachUser } = require("./middleware/authMiddleware");
const { attachI18n } = require("./middleware/i18nMiddleware");
const { attachTheme } = require("./middleware/themeMiddleware");
const authRoutes = require("./routes/authRoutes");
const checkinRoutes = require("./routes/checkinRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const communityRoutes = require("./routes/communityRoutes");
const { attachSeason } = require("./middleware/seasonMiddleware");

const Group = require("./models/Group");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3002;

// ---------- 默认小组数据（首次启动写入数据库）----------
const DEFAULT_GROUPS = [
  { name: "3-times", leader: "Yang", weeklyGoal: 3 },
  { name: "4-times", leader: "Yolanda", weeklyGoal: 4 },
  { name: "5-times", leader: "Eric", weeklyGoal: 5 },
  { name: "7-times", leader: "Deborah", weeklyGoal: 7 },
];

async function seedDatabase() {
  for (const g of DEFAULT_GROUPS) {
    await Group.findOneAndUpdate({ name: g.name }, g, {
      upsert: true,
      new: true,
    });
  }

  const adminExists = await User.findOne({ role: "admin" });
  if (!adminExists && process.env.SEED_ADMIN_EMAIL) {
    const hash = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD || "admin123456",
      10,
    );
    await User.findOneAndUpdate(
      { email: process.env.SEED_ADMIN_EMAIL.toLowerCase() },
      {
        username: process.env.SEED_ADMIN_USERNAME || "admin",
        email: process.env.SEED_ADMIN_EMAIL.toLowerCase(),
        password: hash,
        role: "admin",
        group: "7-times",
        language: "en",
        theme: "light",
      },
      { upsert: true, new: true },
    );
    console.log("已创建默认管理员账号，请查看 .env 中的 SEED_ADMIN_* 配置");
  }
}

// ---------- 中间件 ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session：保存在 MongoDB，有效期 30 天
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: THIRTY_DAYS_MS / 1000,
    }),
    cookie: {
      maxAge: THIRTY_DAYS_MS,
      httpOnly: true,
    },
  }),
);

app.use(attachUser);
app.use(attachI18n);
app.use(attachTheme);
app.use(attachSeason);

// ---------- 公开路由 ----------
app.get("/", async (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  const groups = await Group.find().sort({ weeklyGoal: 1 });
  res.render("index", { title: req.t("home.title"), groups });
});

app.use("/", authRoutes);
app.use("/", checkinRoutes);
app.use("/", dashboardRoutes);
app.use("/", settingsRoutes);
app.use("/", communityRoutes);
app.use("/", adminRoutes);

app.use((req, res) => {
  res.status(404).render("error", {
    title: req.t("errors.notFoundTitle"),
    message: req.t("errors.notFoundMsg"),
  });
});

// ---------- 启动 ----------
async function start() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/bible-reading-challenge";

  await mongoose.connect(uri);
  console.log("MongoDB 已连接");

  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`读经挑战 App 运行在 http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("启动失败:", err);
  process.exit(1);
});
