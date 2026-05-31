# App Prompt：读经 Challenge 打卡 App

> 可将本文档作为 GitHub README 的补充，或粘贴给 AI / 协作者，用于完整复现本项目。

---

## 项目概述

构建一个 **Bible Reading Challenge App（读经挑战打卡 App）**，帮助用户坚持每日读经并记录打卡。用户登录后每日提交读经打卡；系统统计个人进度、小组积分与排行榜。

**技术栈要求：**

- Node.js + Express
- MongoDB / Mongoose
- EJS 或 HTML/CSS/JS（本项目使用 EJS）
- express-session 登录系统（Session 持久化，建议 30 天）
- bcrypt 密码加密
- Admin 管理功能

---

## 小组设置

注册时用户选择所在小组：

| 小组 | 组长 | 每周目标 |
|------|------|----------|
| 3次组 (`3-times`) | Yang | 3 次 |
| 4次组 (`4-times`) | Yolanda | 4 次 |
| 5次组 (`5-times`) | Eric | 5 次 |
| 7次组 (`7-times`) | Deborah | 7 次 |

---

## 认证与 Session

- 用户注册 / 登录 / 登出
- 密码 bcrypt 加密存储
- express-session + MongoDB Store，cookie `maxAge` 约 30 天
- 未登录不可访问：`/dashboard`、`/checkin`、`/leaderboard`、`/profile`
- `role: admin` 可访问 `/admin`

---

## 用户功能

登录后可：

1. 查看今日是否已打卡
2. 提交今日打卡（经文段落、心得、是否完成）
3. 查看本周打卡次数、连续打卡天数
4. 查看本组进度与全站小组排行榜
5. 今日已打卡时按钮显示 **Already Checked In**

---

## 公平积分系统

不能仅比较总打卡次数（7 次组会占优）。使用 **平均完成率**：

### 个人完成率

```
个人完成率 = Math.min(本周实际打卡次数 / 小组每周目标, 1)
```

示例：7 次组目标 7，打卡 5 次 → 约 71%。超额打卡仍按 100% 封顶。

### 小组积分

```
小组积分 = (组内所有成员个人完成率之和 / 小组人数) × 100%
```

显示为百分比，如 **87%**。排行榜按小组积分降序。

### 每周重算

- 周范围：周一 00:00 — 周日 23:59（本地时区）
- 页面显示本周日期范围，如 `2026-05-26 ~ 2026-06-01`
- 统计始终基于「本周」查询，新一周自动重新计算

---

## Admin 功能

- 查看所有用户、小组
- 查看/删除用户打卡记录
- 修改用户小组、设置 admin/user
- 本周排行榜与各组：成员数、平均完成率、总打卡、连续表现
- **本周尚未打卡** 的成员名单
- 创建/编辑小组目标（name、leader、weeklyGoal）

---

## 数据模型

### User

```js
{
  username: String,
  email: String,
  password: String,  // bcrypt hash
  role: { type: String, enum: ["user", "admin"], default: "user" },
  group: { type: String, enum: ["3-times", "4-times", "5-times", "7-times"] },
  language: { type: String, enum: ["zh", "en"], default: "zh" },
  createdAt: Date
}
```

### Group

```js
{
  name: String,
  leader: String,
  weeklyGoal: Number
}
```

默认种子数据见 README。

### CheckIn

```js
{
  userId: ObjectId,
  group: String,
  date: Date,
  biblePassage: String,
  reflection: String,
  completed: Boolean,
  createdAt: Date
}
```

**约束：** `userId + date` 唯一索引，防止同一天重复打卡。

---

## 页面清单

| 路由 | 页面 |
|------|------|
| `/` | 首页：介绍 + 登录/注册 |
| `/register` | 注册（用户名、邮箱、密码、选组） |
| `/login` | 登录 |
| `/dashboard` | 用户主页：今日状态、本周进度、本组排名 |
| `/checkin` | 打卡表单 |
| `/leaderboard` | 排行榜（进度条显示 %） |
| `/profile` | 个人资料、历史打卡、完成率/总天数/连续天 |
| `/admin` | Admin Dashboard |
| `/settings` | 设置（中英文切换） |

---

## 多语言（i18n）

- 支持 **中文 (zh)** 与 **English (en)**
- `/settings` 页面切换语言
- 登录用户偏好保存在 `User.language`；访客保存在 `session.lang`
- 翻译文件：`locales/zh.json`、`locales/en.json`

---

## 增强功能（必须）

- [x] 今日已打卡 → **Already Checked In** 禁用按钮
- [x] 每周自动按本周数据重算积分
- [x] 显示本周日期范围
- [x] 排行榜进度条
- [x] 个人页：本周完成率、总打卡天数、连续天数
- [x] Admin：本周未打卡成员
- [x] express-validator 表单验证
- [x] 温暖简洁 UI（教会/读经场景）

---

## 目录结构（必须遵守）

```
project/
├── server.js
├── models/
│   ├── User.js
│   ├── Group.js
│   └── CheckIn.js
├── routes/
│   ├── authRoutes.js
│   ├── checkinRoutes.js
│   ├── dashboardRoutes.js
│   └── adminRoutes.js
├── middleware/
│   ├── authMiddleware.js
│   └── adminMiddleware.js
├── views/
├── public/
├── utils/
├── scripts/
└── .env
```

代码需适合新手学习，关键逻辑加中文注释。

---

## 环境变量

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/bible-reading-challenge
SESSION_SECRET=<random>
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<secure-password>
```

---

## 验收清单

- [ ] 注册选组、登录保持 30 天 Session
- [ ] 每日仅可打卡一次
- [ ] 个人/小组完成率计算正确
- [ ] 排行榜公平（不同周目标可比较）
- [ ] Admin 可删打卡、改组、改角色
- [ ] 未登录访问受保护路由 → 跳转登录

---

*Generated for Bible Reading Challenge — 读经挑战打卡*
