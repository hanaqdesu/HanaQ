# 三人麻将记分网站交接说明

## 项目说明

这是一个 React + TypeScript + Vite 的前端项目，部署在 Vercel，数据通过 Supabase 云端共享。

正式公网地址：

https://windows-pwa-vercel-netlify-github-p.vercel.app

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，通常是：

```text
http://localhost:5173/
```

## 本地连接云端数据库

如果本地调试也要连接同一份 Supabase 数据，复制 `.env.example` 为 `.env.local`，填入：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon/public key
VITE_SUPABASE_ROOM_ID=main
```

如果不配置 `.env.local`，网站会自动使用浏览器本地存储模式，不影响界面开发。

## 常用命令

```bash
npm run test
npm run build
npm run preview
```

## 更新后部署到公网

确保已经登录 Vercel CLI：

```bash
npx vercel login
```

然后在项目根目录运行：

```bash
npx vercel --prod
```

部署成功后，Vercel 会继续把生产别名指向：

```text
https://windows-pwa-vercel-netlify-github-p.vercel.app
```

## 注意

- 不要提交或分享 `.vercel/` 文件夹。
- 不要提交或分享 `node_modules/`。
- 不要提交或分享 `dist/`，它是构建产物。
- Supabase anon key 是前端公开 key，但仍建议只通过 Vercel 环境变量和 `.env.local` 管理。
- 如果修改了 service worker 或缓存逻辑，部署后要在浏览器里强制刷新测试。
