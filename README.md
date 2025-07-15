# 🚀 FDX Smart Work 2.0

基于 Next.js + Supabase 的智能工作平台，采用 API 路由代理架构，提供完整的全栈解决方案，完美解决自部署环境的 CORS 限制和安全性问题。

## ✨ 特色功能

- **🔄 API 路由代理架构** - 绕过 CORS 限制，服务端到服务端通信
- **🔒 安全性增强** - API 密钥只在服务端使用，提高安全性
- **⚡ 开箱即用** - 预配置测试环境，无需额外设置
- **🎨 现代化 UI** - 使用 shadcn/ui 组件库，支持明暗主题切换
- **📊 完整 CRUD** - 提供创建、读取、更新、删除的完整API接口
- **🩺 健康检查** - 实时监控 Supabase 连接状态

## 🛠️ 技术栈

- **前端框架**: Next.js 15.3.4 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **UI 组件**: shadcn/ui
- **数据库**: Supabase (自部署)
- **主题管理**: next-themes
- **图标**: Lucide React

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/SANDSAIGC/fdx-smart-work-2.0.git
cd fdx-smart-work-2.0
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

项目已预配置测试环境，`.env.local` 文件包含：

```env
NEXT_PUBLIC_SUPABASE_URL=http://132.232.143.210:28000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
fdx-smart-work-2.0/
├── src/
│   ├── app/
│   │   ├── api/              # API 路由代理
│   │   │   ├── submit-data/  # POST 创建数据
│   │   │   ├── get-data/     # GET 查询数据
│   │   │   ├── update-data/  # PUT 更新数据
│   │   │   ├── delete-data/  # DELETE 删除数据
│   │   │   └── health/       # GET 健康检查
│   │   ├── globals.css       # 全局样式
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 主页面
│   ├── components/
│   │   ├── ui/               # shadcn/ui 组件
│   │   └── theme-provider.tsx
│   └── lib/
├── .env.local                # 环境变量配置
└── package.json
```

## 🔌 API 接口

### 健康检查
```bash
GET /api/health
```

### 数据操作
```bash
POST /api/submit-data    # 创建数据
GET /api/get-data        # 查询数据
PUT /api/update-data     # 更新数据
DELETE /api/delete-data  # 删除数据
```

## 🎯 核心优势

### 1. 解决 CORS 问题
传统的客户端直连 Supabase 在自部署环境中会遇到 CORS 限制，本模板通过 API 路由代理完美解决这个问题。

### 2. 安全性提升
- API 密钥只在服务端使用
- 避免敏感信息暴露给客户端
- 更好的访问控制

### 3. 开发体验
- 热重载支持
- TypeScript 类型安全
- 现代化组件库
- 明暗主题切换

## 🔧 自定义配置

### 更换 Supabase 实例

1. 修改 `.env.local` 文件中的连接信息
2. 更新 API 路由中的表名（默认为 `your_table`）

### 添加新的 API 接口

在 `src/app/api/` 目录下创建新的路由文件，参考现有接口的实现模式。

## 📦 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署完成

### 其他平台

支持部署到任何支持 Node.js 的平台，如 Netlify、Railway、Render 等。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
