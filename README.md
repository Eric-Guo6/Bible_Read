# 读经挑战打卡 App · Bible Reading Challenge

帮助大家坚持每日读经打卡的 Web 应用。支持小组积分（平均完成率）、排行榜与管理员后台。

## 技术栈

- **Node.js + Express** — Web 服务器
- **MongoDB + Mongoose** — 数据存储
- **EJS** — 服务端渲染页面
- **express-session + connect-mongo** — 登录 Session（30 天）
- **bcrypt** — 密码加密

## 快速开始

### 1. 安装依赖

```bash
cd bible-reading-challenge
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改：

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/bible-reading-challenge
SESSION_SECRET=你的随机密钥
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=admin123456
```

### 3. 启动 MongoDB

确保本机 MongoDB 已运行（或使用 MongoDB Atlas 连接串填入 `MONGODB_URI`）。

### 4. 运行

```bash
npm start
```

浏览器打开：http://localhost:3000

首次启动会自动：

- 创建 4 个默认小组
- 若无管理员，则创建 `.env` 中配置的种子管理员账号

## 项目结构

```
bible-reading-challenge/
├── server.js              # 入口：数据库、Session、路由
├── models/                # Mongoose 数据模型
├── routes/                # 路由（auth / checkin / dashboard / admin）
├── middleware/            # 登录与管理员权限
├── utils/                 # 本周范围、统计、i18n 翻译
├── locales/               # zh.json / en.json 界面文案
├── routes/settingsRoutes.js
├── views/                 # EJS 页面模板
├── public/css/            # 样式
├── scripts/seedGroups.js  # 单独初始化小组
├── .env.example
└── APP_PROMPT.md          # 完整需求 Prompt（适合 GitHub / AI 复现）
```

## 页面路由

| 路径 | 说明 | 需登录 |
|------|------|--------|
| `/` | 首页介绍 | 否 |
| `/register` | 注册 | 否 |
| `/login` | 登录 | 否 |
| `/dashboard` | 用户主页 | 是 |
| `/checkin` | 今日打卡 | 是 |
| `/leaderboard` | 小组排行榜 | 是 |
| `/profile` | 个人资料 | 是 |
| `/admin` | 管理后台 | 管理员 |
| `/settings` | 设置（中/英文切换） | 否 |

## 公平积分说明

- **个人完成率** = `min(本周打卡次数 / 小组周目标, 1)` × 100%
- **小组积分** = 组内所有成员完成率的平均值 × 100%

每周一 0 点起算新一周，排行榜与积分自动基于当周数据重新计算。

## 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit: Bible Reading Challenge app"
git remote add origin https://github.com/你的用户名/bible-reading-challenge.git
git push -u origin main
```

## License

MIT
