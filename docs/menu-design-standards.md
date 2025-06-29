# 菜单设计标准

## 📋 概述

本文档定义了 FDX SMART WORK 2.0 项目中菜单组件的设计标准和使用规范，确保用户界面的一致性和可用性。

## 🎯 设计原则

### 1. 视觉层次
- 使用颜色区分不同类型的操作
- 危险操作使用警告色（红色）
- 常规操作使用默认样式

### 2. 用户体验
- 重要操作应有明显的视觉区分
- 保持操作的一致性和可预测性
- 提供清晰的视觉反馈

## 🍔 汉堡菜单规范

### 菜单结构
```
角色 (User)
任务 (Bell)
情况 (AlertTriangle)
考勤 (UserCheck)
积分 (Trophy)
登出 (LogOut) - 红色警告样式
```

### 实现标准

#### 1. 基础菜单项
```typescript
<DropdownMenuItem onClick={() => console.log('功能')}>
  <Icon className="mr-2 h-4 w-4" />
  功能名称
</DropdownMenuItem>
```

#### 2. 危险操作菜单项（登出）
```typescript
<DropdownMenuItem variant="destructive" onClick={() => router.push('/')}>
  <LogOut className="mr-2 h-4 w-4" />
  登出
</DropdownMenuItem>
```

### 样式说明

#### `variant="destructive"` 效果
- **文字颜色**: 红色 (`text-destructive`)
- **图标颜色**: 红色 (`*:[svg]:!text-destructive`)
- **悬停效果**: 红色背景 (`focus:bg-destructive/10`)
- **深色模式**: 适配深色主题 (`dark:focus:bg-destructive/20`)

## 🎨 颜色规范

### 菜单项颜色
| 类型 | 变体 | 文字颜色 | 悬停背景 | 使用场景 |
|------|------|----------|----------|----------|
| 常规操作 | `default` | 默认文字色 | `accent` | 角色、任务、情况、考勤、积分 |
| 危险操作 | `destructive` | 红色 | 红色半透明 | 登出、删除、重置等 |

### CSS 变量
```css
--destructive: 0 84.2% 60.2%;
--destructive-foreground: 210 40% 98%;
```

## 📱 响应式设计

### 菜单宽度
```typescript
<DropdownMenuContent align="start" className="w-48">
```

### 图标尺寸
```typescript
<Icon className="mr-2 h-4 w-4" />
```

## ✅ 最佳实践

### 1. 一致性
- 所有页面的汉堡菜单结构保持一致
- 登出选项始终使用 `variant="destructive"`
- 图标和文字的间距统一使用 `mr-2`

### 2. 可访问性
- 为图标提供语义化的文字标签
- 保持足够的颜色对比度
- 支持键盘导航

### 3. 用户体验
- 危险操作使用红色警告
- 提供清晰的视觉反馈
- 保持操作的可预测性

## 🔧 技术实现

### 依赖组件
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

### 图标依赖
```typescript
import {
  Menu,
  User,
  Bell,
  AlertTriangle,
  UserCheck,
  Trophy,
  LogOut
} from "lucide-react";
```

## 📝 更新日志

### 2025-01-28 v1.0.0
- ✅ 建立菜单设计标准
- ✅ 定义汉堡菜单规范
- ✅ 实现登出选项红色区分样式
- ✅ 统一所有页面菜单样式

---

**最后更新**: 2025-01-28
**版本**: 1.0.0
**维护者**: FDX SMART WORK 2.0 开发团队
