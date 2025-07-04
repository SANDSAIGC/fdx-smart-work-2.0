# 出厂精矿详情页面

## 页面概述
出厂精矿详情页面基于 `incoming-ore-details` 页面的成功架构模式创建，提供出厂精矿数据的全面分析和管理功能。

## 页面路由
- **路径**: `/outgoing-concentrate-details`
- **文件位置**: `src/app/outgoing-concentrate-details/page.tsx`
- **API路由**: `src/app/api/outgoing-concentrate-details/route.ts`

## 页面架构

### Header组件
- 使用 `Header-2` 组件（带返回按钮的子页面样式）
- 页面标题: "出厂精矿详情"
- 副标题: "查看和分析出厂精矿的详细数据和趋势"
- 图标: `TruckIcon` (h-5 w-5尺寸)

### 数据库连接
**主要数据表**:
- `出厂精矿-FDX` (富鼎翔出厂精矿数据)
- `出厂精矿-JDXY` (金鼎锌业出厂精矿数据)

**核心数据字段**:
- 出厂湿重 (t) - `湿重(t)`
- 水份 (%) - `水份(%)`
- 精矿Pb品位 (%) - `Pb`
- 精矿Zn品位 (%) - `Zn`
- Zn金属量 (t) - `金属量(t)`
- 计量日期 - `计量日期`

## 页面模块

### PART1: 出厂趋势总览
**功能特性**:
- Carousel 单列布局展示5个独立折线图
- 快捷日期选择按钮（最近七天、最近一月、最近半年）
- 自定义日期范围选择
- 右上角手动刷新按钮

**图表配置**:
- 5个 Line Chart - Multiple (双曲线对比)
- 数据参数: 出厂湿重、水份、精矿Pb品位、精矿Zn品位、Zn金属量
- 聚合逻辑: 按日期聚合，t值汇总，%值加权平均
- 双曲线显示金鼎和富鼎翔数据对比

### PART2: 出厂单日详情
**功能特性**:
- Tabs 组件分别显示金鼎数据和富鼎翔数据
- 日期选择器 + 手动刷新按钮
- 甜甜圈图表参数: `innerRadius={50}, strokeWidth={5}`

**图表配置**:
- 每个选项卡包含5个甜甜圈图表
- 图表参数: 出厂湿重、水份、精矿Pb品位、精矿Zn品位、Zn金属量
- 最大值设置:
  - 出厂湿重: 8000t
  - 水份: 50%
  - 精矿Pb品位: 80%
  - 精矿Zn品位: 80%
  - Zn金属量: 500t
- 标准文字: "按照金鼎锌业标准" / "按照富鼎翔标准"

### PART3: 出厂数据汇总
**功能特性**:
- 快捷日期选择按钮和自定义日期范围
- Tabs 组件分别显示金鼎数据和富鼎翔数据
- 导出EXCEL功能
- 右上角手动刷新按钮

**表格配置**:
- 列字段: 日期、出厂湿重(t)、水份(%)、精矿Pb品位(%)、精矿Zn品位(%)、Zn金属量(t)
- 分页显示: 每页10条记录
- 支持列排序功能
- 数据缺失显示"--"

## 技术实现

### 数据处理逻辑
- **聚合计算**: 同日期多条数据时，重量值(t)直接汇总，百分比值(%)按重量加权平均
- **数据获取**: 使用 Supabase API 方法
- **错误处理**: 数据为null时显示默认值0

### 组件和样式规范
- **组件优先级**: 现有组件 > shadcn/ui组件 > 自定义组件
- **图标规范**: 使用 Lucide React 图标库，尺寸统一
- **响应式设计**: 
  - 甜甜圈图表: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4`
  - 支持明暗主题切换

### 状态管理
- `fdxData` / `jdxyData`: 富鼎翔和金鼎数据
- `trendStartDate` / `trendEndDate`: 趋势图日期范围
- `singleDate` / `singleDayTab`: 单日详情日期和选项卡
- `tableStartDate` / `tableEndDate` / `activeTab`: 表格日期范围和选项卡
- `currentPage`: 分页状态

### 核心函数
- `fetchOutgoingConcentrateData`: 数据获取
- `processSingleDayJdxyData` / `processSingleDayFdxData`: 单日数据处理
- `processJdxyTableData` / `processFdxTableData`: 表格数据处理
- `processTrendData`: 趋势图数据处理
- `exportToExcel`: 导出功能

## 验收标准
✅ 页面功能与 `incoming-ore-details` 完全对等
✅ 数据正确连接到出厂精矿数据表
✅ 所有图表和表格正常显示数据
✅ 响应式设计在移动端和桌面端均正常工作
✅ 无TypeScript编译错误
✅ 统一的Footer组件显示标准签名

## 更新日志
- 2025-01-XX: 初始创建，基于 incoming-ore-details 架构
- 完整实现三大模块功能
- 添加数据聚合和图表展示
- 实现导出EXCEL功能
