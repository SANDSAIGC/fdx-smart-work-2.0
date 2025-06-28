# FDX SMART WORK 2.0 图标使用规范

## 📋 概述

本文档定义了 FDX SMART WORK 2.0 项目中图标使用的统一标准，确保整个应用的视觉一致性和专业性。

## 🎯 核心原则

### 1. 图标库标准化
- **主要图标库**: [Lucide React](https://lucide.dev/) (v0.525.0)
- **原因**: 与 shadcn/ui 组件库完美集成，提供一致的设计语言
- **禁止使用**: 表情符号 (emoji) 作为界面图标
- **避免混用**: 不同图标库的图标

### 2. 导入规范
```typescript
// ✅ 正确的导入方式
import { 
  Factory, 
  FlaskConical, 
  Rocket, 
  Users, 
  ClipboardList,
  BarChart3,
  Clock,
  Trophy 
} from "lucide-react";

// ❌ 避免使用 emoji
// <div className="text-2xl">🏭</div>
```

### 3. 尺寸标准
- **小图标**: `h-4 w-4` (16px) - 用于菜单项、按钮内图标
- **中等图标**: `h-5 w-5` (20px) - 用于卡片标题、表单标签
- **大图标**: `h-6 w-6` (24px) - 用于页面标题、主要功能区
- **特大图标**: `h-8 w-8` (32px) - 用于首页功能模块

## 🔄 Emoji 到 Lucide 图标映射表

| 原 Emoji | Lucide 图标 | 使用场景 | 语义说明 |
|----------|-------------|----------|----------|
| 🏭 | `Factory` | 主标题、工厂相关 | 工业/制造业 |
| 🧪 | `FlaskConical` | 化验室、实验 | 科学实验/化验 |
| 🚀 | `Rocket` | 功能导航、启动 | 快速/创新 |
| 👥 | `Users` | 角色管理、用户 | 人员管理 |
| 📋 | `ClipboardList` | 任务管理、清单 | 任务/计划 |
| 📊 | `BarChart3` | 数据监控、图表 | 数据分析 |
| ⏰ | `Clock` | 考勤管理、时间 | 时间管理 |
| 🏆 | `Trophy` | 积分系统、奖励 | 成就/奖励 |
| 🏗️ | `Building2` | 系统架构 | 建设/架构 |
| ⚡ | `Zap` | 核心优势、性能 | 快速/高效 |
| 🎉 | `PartyPopper` | 庆祝、完成 | 庆祝/成功 |

## 📝 实施指南

### 1. 页面级别替换

#### 主页面 (src/app/page.tsx)
```typescript
// 替换主标题
<h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
  <Factory className="h-8 w-8" />
  FDX SMART WORK 2.0
</h1>

// 替换功能模块导航
<Button className="flex items-center gap-2 h-16 text-left justify-start">
  <FlaskConical className="h-8 w-8 text-primary" />
  <div>
    <div className="font-semibold">化验室</div>
    <div className="text-xs text-muted-foreground">样品数据管理</div>
  </div>
</Button>
```

#### 化验室页面 (src/app/lab/page.tsx)
- ✅ 已正确使用 Lucide 图标
- 汉堡菜单已使用 `Menu`, `User`, `Bell` 等图标

#### 样本页面
- ✅ 已正确使用 Lucide 图标
- 使用 `Package`, `Filter`, `Droplets` 等语义化图标

### 2. 组件级别规范

#### 按钮图标
```typescript
// ✅ 正确使用
<Button variant="outline" size="icon">
  <Calculator className="h-4 w-4" />
</Button>

// ✅ 带文字的按钮
<Button>
  <Save className="mr-2 h-4 w-4" />
  保存数据
</Button>
```

#### 卡片标题
```typescript
// ✅ 正确使用
<CardTitle className="flex items-center gap-2">
  <Database className="h-5 w-5" />
  系统健康检查
</CardTitle>
```

#### 导航菜单
```typescript
// ✅ 正确使用
<DropdownMenuItem>
  <User className="mr-2 h-4 w-4" />
  角色管理
</DropdownMenuItem>
```

## 🎨 主题适配

### 颜色使用
```typescript
// 主要功能图标
<FlaskConical className="h-8 w-8 text-primary" />

// 状态指示图标
<CheckCircle className="h-4 w-4 text-green-500" />
<AlertCircle className="h-4 w-4 text-red-500" />

// 普通图标 (自动适配主题)
<Menu className="h-4 w-4" />
```

### 响应式设计
```typescript
// 响应式图标尺寸
<FlaskConical className="h-6 w-6 sm:h-8 sm:w-8" />
```

## ✅ 检查清单

### 开发阶段
- [ ] 确认所有新组件使用 Lucide React 图标
- [ ] 检查图标尺寸一致性
- [ ] 验证图标语义匹配
- [ ] 测试明暗主题下的显示效果

### 代码审查
- [ ] 搜索项目中的 emoji 使用 (正则: `[^\x00-\x7F]`)
- [ ] 确认图标导入来源统一
- [ ] 检查图标 className 规范
- [ ] 验证响应式图标尺寸

### 质量保证
- [ ] 在不同设备上测试图标显示
- [ ] 验证无障碍访问性
- [ ] 确认图标加载性能
- [ ] 检查图标与文本对齐

## 🚫 常见错误

### 1. 使用 Emoji
```typescript
// ❌ 错误
<div className="text-2xl">🏭</div>

// ✅ 正确
<Factory className="h-8 w-8" />
```

### 2. 图标尺寸不一致
```typescript
// ❌ 错误 - 同级元素尺寸不一致
<User className="h-3 w-3" />
<Bell className="h-5 w-5" />

// ✅ 正确 - 统一尺寸
<User className="h-4 w-4" />
<Bell className="h-4 w-4" />
```

### 3. 混用图标库
```typescript
// ❌ 错误 - 混用不同图标库
import { FaUser } from 'react-icons/fa';
import { User } from 'lucide-react';

// ✅ 正确 - 统一使用 Lucide
import { User, UserCheck } from 'lucide-react';
```

## 📚 参考资源

- [Lucide React 官方文档](https://lucide.dev/guide/packages/lucide-react)
- [shadcn/ui 图标指南](https://ui.shadcn.com/docs/components/icons)
- [无障碍图标设计指南](https://www.w3.org/WAI/ARIA/apg/patterns/)

---

**最后更新**: 2024-12-28
**版本**: 1.0.0
**维护者**: FDX SMART WORK 2.0 开发团队
