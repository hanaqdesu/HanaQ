# 三人麻将分数记录网页应用

React + TypeScript + Vite 实现的三人麻将成绩记录系统。数据保存在浏览器本地 `localStorage`，支持 PWA、测试数据、统计排行榜和 Excel 导出。

## 公网地址

正式部署地址：

https://windows-pwa-vercel-netlify-github-p.vercel.app

## 本地安装与运行

```bash
npm install
npm run dev
```

打开开发服务器显示的地址，例如 `http://localhost:5173/`。

如果使用 pnpm：

```bash
pnpm install
pnpm dev
```

## 测试与构建

```bash
npm run test
npm run build
npm run preview
```

构建产物在 `dist/`。

## 功能

- 玩家库：新增、编辑、删除或停用玩家，保留历史名字快照。
- 新建对局：三名玩家随机分配东、南、西，录入最终点数。
- 校验规则：总分必须为 105000；每人分数必须是 1000 的倍数；不可为空或负数。
- 排名规则：分数降序；同分按东、南、西优先；仍然排出 1、2、3 位。
- 马点：1 位 +20，2 位 0，3 位 -20。
- 成绩点：`(原始分数 - 35000) / 1000 + 马点`。
- 历史记录：查看、修改、删除、按玩家/日期/关键词筛选。
- 统计：总统计、最近 5/10/20 局、总成绩点/平均成绩点/平均排名/1位率/对局数排行榜。
- Excel 导出：包含“对局记录”和“玩家统计”两个 Sheet。
- 设置：最低对局数过滤、重置测试数据。

## 云端共享数据

项目支持 Supabase 云端共享数据。配置后，所有访问同一个网站的人会读写同一份对局记录，新增、修改、删除都会同步到其他设备。

### 1. 创建 Supabase 表

在 Supabase 项目中打开 SQL Editor，执行仓库里的 `supabase-schema.sql`。

这份 SQL 会创建一张表：

```text
public.mahjong_app_state
```

应用会把玩家、对局、设置作为一份 JSON 数据保存在同一个 `room_id` 下。

### 2. 配置环境变量

本地新建 `.env.local`：

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_ROOM_ID=main
```

部署到 Vercel 时，在 Project Settings > Environment Variables 添加同样三个变量，然后重新部署。

### 3. 权限说明

当前 SQL 允许匿名访问者读取、写入和更新共享数据，适合少数人私下使用。知道网址的人理论上也能修改数据；如果需要更严格权限，可以后续增加登录、邀请码或后台 API。

如果没有配置 Supabase 环境变量，网站会自动回到本地浏览器存储模式。

## 部署

### Vercel

1. 将项目推送到 GitHub。
2. 在 Vercel 中导入仓库。
3. Framework 选择 `Vite`。
4. Build Command 使用 `npm run build`。
5. Output Directory 使用 `dist`。

### Netlify

1. 将项目推送到 GitHub。
2. 在 Netlify 中导入仓库。
3. Build command 使用 `npm run build`。
4. Publish directory 使用 `dist`。

### GitHub Pages

本项目包含 `.github/workflows/deploy.yml`。推送到 `main` 分支后，在仓库设置里启用 GitHub Pages，并选择 GitHub Actions 作为来源。

## PWA

项目包含 `public/manifest.webmanifest` 和 `public/sw.js`。在 `localhost` 或 HTTPS 部署环境下，手机浏览器可以添加到主屏幕。
