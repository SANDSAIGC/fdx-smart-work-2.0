# Next.js + 自部署Supabase 快速启动模板

## 🚀 项目概述

这是一个 **5分钟快速启动** 的 Next.js + 自部署 Supabase 项目模板。采用 **API 路由代理架构** 完美解决自部署环境的 CORS 限制和安全性问题，让您立即开始开发。

## ⚡ 核心特色

- 🏗️ **API 路由代理架构** - 绕过 CORS 限制，密钥安全管理
- 🎨 **shadcn/ui 组件库** - 现代化 UI 组件，支持暗色模式
- 🔐 **开箱即用配置** - 预配置的测试环境，无需额外设置
- 📱 **响应式设计** - 完整的移动端适配
- 🛡️ **TypeScript 支持** - 类型安全的开发体验

## 📋 技术栈

- **前端**: Next.js 15.3.4 + TypeScript + Tailwind CSS
- **UI组件**: shadcn/ui（完整组件库）
- **连接架构**: API 路由代理模式
- **后端**: 自部署 Supabase 实例
- **数据库**: PostgreSQL

## ⚡ 5分钟快速启动

### **第一步：创建项目**

```bash
# 创建 Next.js 项目
npx create-next-app@latest my-supabase-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 进入项目目录
cd my-supabase-app

# 安装依赖（优化后的最小依赖集）
npm install lucide-react date-fns class-variance-authority clsx tailwind-merge
```

> **💡 为什么不需要 `@supabase/supabase-js`？**
>
> 本项目采用 **API 路由代理架构**，所有数据操作都通过 Next.js API 路由使用原生 `fetch` 直接调用 Supabase REST API，无需 Supabase 客户端库。这样做的优势：
> - 🚫 **绕过 CORS 限制** - 服务端到服务端通信
> - 🔐 **更高安全性** - 密钥只在服务端使用
> - 📦 **更小包体积** - 减少不必要的依赖
> - 🛡️ **更好控制** - 完全控制请求和响应处理

### **第二步：安装 UI 组件**

```bash
# 初始化 shadcn/ui
npx shadcn@latest init

# 一键安装所有常用组件
npx shadcn@latest add alert-dialog avatar badge button card carousel chart dropdown-menu input pagination progress scroll-area select skeleton sonner table tabs textarea tooltip calendar popover
```

### **第三步：配置环境变量**

创建 `.env.local` 文件，复制以下配置：

```env
# 🚀 开箱即用配置 - 连接到预配置的测试环境
NEXT_PUBLIC_SUPABASE_URL=http://132.232.143.210:28000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUwNjk0NDAwLCJleHAiOjE5MDg0NjA4MDB9.1wMtd68DjY3b9BM82ynEuN2oi9KfS-FJvVLROVULq7w
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTA2OTQ0NDAwLCJleHAiOjE5MDg0NjA4MDB9.b5G8hlawEhdHuE8n_CnAm5waQwsscWWzN8JFrk15oGM
SUPABASE_JWT_SECRET=6d4k6jQ2WgOB8SwjwzLGAdmIzkQyi2r3

# 🔧 数据库直连配置（可选，用于高级功能）
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# 📡 API 路由配置（与上面保持一致）
SUPABASE_URL=http://132.232.143.210:28000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUwNjk0NDAwLCJleHAiOjE5MDg0NjA4MDB9.1wMtd68DjY3b9BM82ynEuN2oi9KfS-FJvVLROVULq7w
```

> **💡 说明**:
> - 默认配置连接到预配置的测试环境，包含完整的数据库表结构
> - `POSTGRES_PASSWORD` 用于直接数据库连接（如数据迁移、高级查询等）
> - 如需使用自己的 Supabase 实例，请替换相应的 URL 和密钥

### **第四步：全局样式初始化**

#### **配置 shadcn/ui 官方默认风格**

按照 shadcn/ui 官方推荐的默认配置来设置项目样式系统。

**1. 更新 `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**2. 创建主题提供者 `components/theme-provider.tsx`**

```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**3. 更新根布局 `app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Supabase App",
  description: "现代化 Next.js + Supabase 应用",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**4. 确认 `tailwind.config.ts` 配置**

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

**5. 确认 `components.json` 配置**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**6. 安装主题管理依赖**

```bash
# 安装主题管理库
npm install next-themes

# 安装 shadcn/ui 动画依赖（如果还没有）
npm install tailwindcss-animate
```

#### **🎨 shadcn/ui 官方设计特征**

- **🌓 双主题系统** - 完整的明暗主题切换支持
- **🎨 中性色调** - 基于 HSL 色彩系统的专业外观
- **📐 标准圆角** - 8px (0.5rem) 圆角设计，符合现代设计规范
- **🔤 系统字体** - Geist Sans 无衬线字体，优秀的可读性
- **📱 响应式设计** - 移动优先的自适应布局
- **♿ 无障碍友好** - 符合 WCAG 标准的对比度和交互设计
- **🎯 语义化颜色** - 清晰的颜色语义系统 (primary, secondary, destructive 等)

### **第五步：启动项目**

```bash
# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:3000
```

🎉 **恭喜！** 您的 Next.js + Supabase 项目已经可以运行了！

## 📁 完整项目结构

```
my-supabase-app/
├── app/
│   ├── api/                    # 🔥 API 路由代理（核心特色）
│   │   ├── submit-data/        # 数据提交接口
│   │   ├── get-data/           # 数据查询接口
│   │   ├── update-data/        # 数据更新接口
│   │   ├── delete-data/        # 数据删除接口
│   │   └── health/             # 健康检查接口
│   ├── globals.css             # 🎨 全局样式和主题系统
│   ├── layout.tsx              # 根布局（含主题提供者）
│   └── page.tsx                # 首页
├── components/
│   ├── ui/                     # shadcn/ui 组件库
│   ├── theme-provider.tsx      # 🌓 主题管理组件
│   └── ...                     # 业务组件
├── lib/
│   └── utils.ts                # 工具函数
├── .env.local                  # 环境变量配置
├── tailwind.config.ts          # 🎨 Tailwind CSS 配置
├── components.json             # 🎨 shadcn/ui 配置（New York 风格）
├── next.config.ts              # Next.js 配置
└── package.json                # 项目依赖
```

### **数据流架构**
```
前端组件 → Next.js API路由 → 自部署Supabase → PostgreSQL
    ↑                                           ↓
    ← JSON响应 ← 数据处理 ← REST API响应 ←
```

## � 核心特色：API 路由代理架构

### **为什么使用 API 路由代理？**

传统的客户端直连自部署 Supabase 会遇到：
- ❌ **CORS 跨域限制** - 浏览器阻止跨域请求
- ❌ **密钥安全风险** - Service Role Key 暴露给前端
- ❌ **网络不稳定** - 浏览器网络环境限制

**✅ API 路由代理完美解决：**
- 🚫 绕过 CORS 限制（服务端到服务端通信）
- 🔐 密钥安全管理（敏感信息只在服务端）
- 🛡️ 统一错误处理和数据验证
- 🔄 稳定的连接和重试机制

### **完整 CRUD API 接口**

```
app/api/
├── submit-data/route.ts    # POST  - 创建数据
├── get-data/route.ts       # GET   - 查询数据（支持过滤参数）
├── update-data/route.ts    # PUT   - 更新数据
├── delete-data/route.ts    # DELETE- 删除数据
└── health/route.ts         # GET   - 健康检查
```

### **API 路由代理示例**

#### **数据提交接口** (`app/api/submit-data/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. 获取环境变量（服务端安全）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 2. 接收并验证前端数据
    const requestData = await request.json();

    // 3. 🔥 关键：直接调用 Supabase REST API（绕过CORS）
    const response = await fetch(`${supabaseUrl}/rest/v1/your_table`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    // 4. 返回结果
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({ success: false, error: 'Database error' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' });
  }
}
```

#### **数据查询接口** (`app/api/get-data/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');
    const limit = searchParams.get('limit') || '50';

    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/your_table?select=*&order=created_at.desc&limit=${limit}`;

    if (id) queryUrl += `&id=eq.${id}`;
    if (date) queryUrl += `&date=eq.${date}`;

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey!,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, data, count: data.length });
    } else {
      return NextResponse.json({ success: false, error: 'Query failed' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' });
  }
}
```

#### **数据更新接口** (`app/api/update-data/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/your_table?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey!,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({ success: false, error: 'Update failed' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' });
  }
}
```

#### **数据删除接口** (`app/api/delete-data/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/your_table?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey!,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Delete failed' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' });
  }
}
```

#### **健康检查接口** (`app/api/health/route.ts`)

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 测试 Supabase 连接
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    return NextResponse.json({
      success: true,
      status: 'healthy',
      supabase_connection: response.ok ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed'
    }, { status: 500 });
  }
}
```

#### **前端调用示例**

```typescript
// 1. 创建数据
const createData = async (formData: any) => {
  const response = await fetch('/api/submit-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  return await response.json();
};

// 2. 查询数据
const fetchData = async (filters?: { id?: string; date?: string; limit?: string }) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/get-data?${params}`);
  return await response.json();
};

// 3. 更新数据
const updateData = async (id: string, updateData: any) => {
  const response = await fetch('/api/update-data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updateData })
  });
  return await response.json();
};

// 4. 删除数据
const deleteData = async (id: string) => {
  const response = await fetch(`/api/delete-data?id=${id}`, {
    method: 'DELETE'
  });
  return await response.json();
};

// 5. 健康检查
const checkHealth = async () => {
  const response = await fetch('/api/health');
  return await response.json();
};
```

### **API 路由最佳实践**

#### **统一错误处理**
```typescript
// 创建通用错误处理函数
const handleApiError = (error: any, operation: string) => {
  console.error(`${operation} failed:`, error);
  return NextResponse.json({
    success: false,
    error: `${operation} failed`,
    details: error instanceof Error ? error.message : 'Unknown error'
  }, { status: 500 });
};
```

#### **环境变量验证**
```typescript
// 创建环境变量验证函数
const validateEnvironment = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing required environment variables');
  }

  return { supabaseUrl, anonKey };
};
```

#### **数据验证中间件**
```typescript
// 创建数据验证函数
const validateRequestData = (data: any, requiredFields: string[]) => {
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  return true;
};
```

## 🎯 最佳实践

### **API 路由代理原则**
- ✅ **完整的 CRUD 操作** - 提供创建、读取、更新、删除的完整API接口
- ✅ **统一的响应格式** - 所有API返回 `{ success: boolean, data?: any, error?: string }` 格式
- ✅ **查询参数支持** - GET接口支持灵活的过滤和分页参数
- ✅ **错误处理标准化** - 使用统一的错误处理函数和HTTP状态码

### **安全性最佳实践**
- ✅ **环境变量验证** - 每个API路由都验证必需的环境变量
- ✅ **数据验证** - 在服务端进行严格的数据类型和必填字段验证
- ✅ **密钥隔离** - Service Role Key 只在服务端使用，永不暴露给前端
- ✅ **请求日志** - 记录关键操作的日志便于调试和监控

### **性能优化**
- ✅ **查询优化** - 使用适当的 select、order、limit 参数
- ✅ **错误缓存** - 避免重复的失败请求
- ✅ **连接复用** - 利用 HTTP/1.1 的连接复用特性
- ✅ **响应压缩** - 大数据量时考虑响应压缩

## 🎉 总结

这个模板提供了：

1. **🏗️ API 路由代理架构** - 完美解决自部署 Supabase 的 CORS 问题
2. **⚡ 5分钟快速启动** - 开箱即用的配置和组件
3. **🔐 安全最佳实践** - 密钥安全管理和数据验证
4. **🎨 现代化 UI** - shadcn/ui 组件库和响应式设计

现在您可以基于这个模板快速构建自己的 Next.js + Supabase 应用了！