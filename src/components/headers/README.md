# Header组件使用指南

## 📋 组件概述

FDX SMART WORK 2.0项目提供了两种标准化的Header组件，用于统一页面头部布局和交互体验。

## 🎯 Header-1 组件

### 布局特征
**布局**: 汉堡菜单(左) -- 居中标题 -- 主题切换(右)

### 适用场景
- 主要工作台页面
- 无需返回功能的页面
- 强调标题重要性的页面

### 参数解析
```tsx
interface Header1Props {
  title: string;          // 页面标题（必填）
  subtitle?: string;      // 副标题（可选）
  icon?: LucideIcon;      // 标题图标（可选）
  className?: string;     // 自定义样式类（可选）
}
```

### 样式规范
- **容器**: `container mx-auto p-6`
- **相对定位**: `relative`
- **汉堡菜单**: `absolute top-0 left-0`
- **主题切换**: `absolute top-0 right-0`
- **标题区域**: `text-center mb-6 sm:mb-8`
- **标题样式**: `text-2xl sm:text-3xl font-bold mb-2`
- **图标尺寸**: `h-6 w-6 sm:h-8 sm:w-8`
- **副标题**: `text-sm sm:text-base text-muted-foreground px-4`

### 使用示例
```tsx
import { Header1 } from '@/components/headers';
import { Settings } from 'lucide-react';

// 基础使用
<Header1 title="机器运行记录" />

// 带副标题和图标
<Header1 
  title="机器运行记录"
  subtitle="设备运行状态记录和管理系统"
  icon={Settings}
/>

// 自定义样式
<Header1 
  title="化验室"
  subtitle="样品化验数据管理与查询系统"
  icon={FlaskConical}
  className="custom-header"
/>
```

### 适用页面示例
- `/lab` - 化验室工作台
- `/boss` - 总指挥工作台
- `/ball-mill-workshop` - 球磨车间
- `/filter-press-workshop` - 压滤车间
- `/machine-operation-record` - 机器运行记录

## 🎯 Header-2 组件

### 布局特征
**布局**: 返回按钮 -- 居左标题 -- 主题切换 -- 汉堡菜单

### 适用场景
- 详情页面
- 表单页面
- 需要返回功能的页面
- 子页面或二级页面

### 参数解析
```tsx
interface Header2Props {
  title: string;              // 页面标题（必填）
  onBack?: () => void;        // 自定义返回函数（可选）
  showBackButton?: boolean;   // 是否显示返回按钮（默认true）
  className?: string;         // 自定义样式类（可选）
}
```

### 样式规范
- **容器**: `sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur`
- **内容区**: `container flex h-14 items-center justify-between px-4`
- **左侧区域**: `flex items-center gap-2`
- **返回按钮**: `variant="ghost" size="icon" h-8 w-8`
- **返回图标**: `h-4 w-4`
- **标题样式**: `text-lg font-semibold`
- **右侧区域**: `flex items-center gap-2`

### 使用示例
```tsx
import { Header2 } from '@/components/headers';

// 基础使用（默认返回功能）
<Header2 title="班样记录" />

// 自定义返回函数
<Header2 
  title="数字工牌"
  onBack={() => router.push('/dashboard')}
/>

// 隐藏返回按钮
<Header2 
  title="设置页面"
  showBackButton={false}
/>

// 自定义样式
<Header2 
  title="详情页面"
  className="custom-header-2"
/>
```

### 适用页面示例
- `/shift-sample` - 班样记录
- `/profile` - 数字工牌
- `/incoming-sample` - 进厂样化验
- `/outgoing-sample` - 出厂样化验
- `/filter-sample` - 压滤样化验

## 🔧 技术实现

### 组件特性
1. **响应式设计**: 支持移动端和桌面端适配
2. **主题支持**: 集成主题切换功能
3. **用户上下文**: 汉堡菜单显示用户信息和角色
4. **导航功能**: Header-2支持灵活的返回导航
5. **可定制性**: 支持自定义样式和行为

### 依赖组件
- `HamburgerMenu`: 汉堡菜单组件
- `ThemeToggle`: 主题切换组件
- `Button`: 按钮组件（Header-2）
- `ArrowLeft`: 返回图标（Header-2）

### 导入方式
```tsx
// 单独导入
import { Header1 } from '@/components/headers/header-1';
import { Header2 } from '@/components/headers/header-2';

// 统一导入（推荐）
import { Header1, Header2 } from '@/components/headers';
```

## 📱 响应式设计

### Header-1 响应式特性
- **标题**: `text-2xl sm:text-3xl` - 小屏2xl，大屏3xl
- **图标**: `h-6 w-6 sm:h-8 sm:w-8` - 小屏6x6，大屏8x8
- **副标题**: `text-sm sm:text-base` - 小屏sm，大屏base
- **间距**: `mb-6 sm:mb-8` - 小屏6，大屏8

### Header-2 响应式特性
- **固定高度**: `h-14` - 所有屏幕尺寸统一
- **内边距**: `px-4` - 左右内边距4
- **按钮尺寸**: `h-8 w-8` - 统一按钮尺寸
- **图标尺寸**: `h-4 w-4` - 统一图标尺寸

## 🎨 设计原则

### 视觉层次
1. **Header-1**: 强调标题的重要性，适合主页面
2. **Header-2**: 平衡功能性和美观性，适合子页面

### 交互一致性
1. **汉堡菜单**: 统一的用户信息和导航入口
2. **主题切换**: 一致的主题切换体验
3. **返回导航**: 标准化的返回操作

### 品牌统一性
1. **色彩方案**: 遵循项目主题色彩
2. **字体规范**: 统一的字体大小和权重
3. **间距标准**: 一致的内外边距规范

## 🚀 最佳实践

### 选择指南
1. **使用Header-1的情况**:
   - 主要工作台页面
   - 用户的起始页面
   - 不需要返回功能的页面

2. **使用Header-2的情况**:
   - 从其他页面导航而来的页面
   - 表单和详情页面
   - 需要返回上级页面的场景

### 开发建议
1. **保持一致性**: 同类型页面使用相同的Header组件
2. **合理使用图标**: Header-1中的图标应与页面功能相关
3. **副标题简洁**: Header-1的副标题应简洁明了
4. **自定义谨慎**: 避免过度自定义破坏统一性

## 📞 技术支持

如有问题或建议，请联系开发团队：
- 项目: FDX SMART WORK 2.0
- 版权: FDX@2025 滇ICP备2025058380号
