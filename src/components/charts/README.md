# 生产数据图表组件

这个目录包含了用于显示生产数据的通用图表组件，支持移动端优化、暗色模式适配和数据压缩功能。

## 组件列表

### 1. ProductionDataChart

专门为富鼎翔和金鼎锌业数据对比设计的柱状图组件。

#### 使用方法

```tsx
import ProductionDataChart from "@/components/charts/ProductionDataChart";

const data = [
  { parameter: "期初库存", company: "富鼎翔", value: 1200, fill: "" },
  { parameter: "期初库存", company: "金鼎锌业", value: 900, fill: "" },
  { parameter: "周期产量", company: "富鼎翔", value: 3922, fill: "" },
  { parameter: "周期产量", company: "金鼎锌业", value: 4522, fill: "" },
];

<ProductionDataChart
  data={data}
  title="原料累计数据对比"
  type="原料"
  selectedCycle="第一期（4月26日-5月25日）"
  getCurrentCycleDateRange={() => "4月26日-5月25日"}
/>
```

#### Props

- `data`: 数据数组，包含parameter、company、value、fill字段
- `title`: 图表标题
- `type`: 数据类型（"原料" | "产品"）
- `selectedCycle`: 选中的周期
- `getCurrentCycleDateRange`: 获取周期日期范围的函数

### 2. UniversalProductionChart

通用的生产数据图表组件，支持自定义公司配置和更多选项。

#### 使用方法

```tsx
import UniversalProductionChart from "@/components/charts/UniversalProductionChart";

const data = [
  { parameter: "销售额", company: "公司A", value: 1500 },
  { parameter: "销售额", company: "公司B", value: 1200 },
  { parameter: "利润", company: "公司A", value: 300 },
  { parameter: "利润", company: "公司B", value: 250 },
];

const companies = [
  { name: "公司A", color: "#4f46e5", className: "bar-company-a" },
  { name: "公司B", color: "#6366f1", className: "bar-company-b" },
];

<UniversalProductionChart
  data={data}
  title="销售数据对比"
  description="2024年度销售数据对比分析"
  type="销售"
  companies={companies}
  selectedPeriod="2024年度"
  periodDateRange="2024年1月-12月"
  unit="万元"
  compressionThreshold={10000}
  showFooter={true}
  footerText="销售数据对比分析"
/>
```

#### Props

- `data`: 数据数组
- `title`: 图表标题
- `description?`: 图表描述（可选）
- `type?`: 数据类型，默认"生产"
- `companies`: 公司配置数组
- `selectedPeriod?`: 选中的时期
- `periodDateRange?`: 时期日期范围
- `unit?`: 数据单位，默认"t"
- `compressionThreshold?`: 压缩阈值，默认8000
- `showFooter?`: 是否显示页脚，默认true
- `footerText?`: 页脚文字
- `icon?`: 自定义图标
- `className?`: 自定义CSS类名

## 特性

### 1. 移动端优化
- 响应式布局，适配各种屏幕尺寸
- 触摸友好的交互设计
- 移动端优先的视觉效果

### 2. 暗色模式支持
- 自动检测系统主题
- 实时响应主题切换
- 优化的暗色模式配色方案

### 3. 数据压缩
- 自动检测超出边界的数据
- 智能比例压缩显示
- 标签显示原始数据值

### 4. 布局优化
- 左对齐布局设计
- 25%右侧空间预留
- 防止柱体超出边界

### 5. 配色方案
- 参考现代设计规范
- 亮色模式：蓝色系柱体 + 白色文字
- 暗色模式：蓝色系柱体 + 白色文字
- 高对比度保证可读性

## CSS类名

组件使用以下CSS类名，可在全局样式中自定义：

```css
/* 柱状图颜色 */
.bar-fdx { fill: #4f46e5; }
.bar-jdxy { fill: #6366f1; }

/* 暗色模式 */
.dark .bar-fdx { fill: #6366f1 !important; }
.dark .bar-jdxy { fill: #8b5cf6 !important; }

/* 文字样式 */
.bar-label-text {
  fill: white;
  font-weight: 600;
  font-size: 11px;
}

/* 移动端优化 */
.mobile-optimized-chart { width: 100%; }
.chart-title-mobile { font-size: 1.125rem; font-weight: 700; }
.chart-description-mobile { font-size: 0.875rem; color: hsl(var(--muted-foreground)); }
```

## 注意事项

1. **数据格式**: 确保数据数组中的parameter和company字段正确匹配
2. **公司配置**: UniversalProductionChart需要正确配置companies数组
3. **主题适配**: 组件会自动适配系统主题，无需手动处理
4. **性能优化**: 大数据集会自动进行压缩处理，提升渲染性能
5. **可访问性**: 组件支持键盘导航和屏幕阅读器
6. **导入修复**: 组件已修复Recharts导入问题，使用正确的Tooltip组件

## 扩展开发

如需添加新功能或自定义样式，建议：

1. 继承现有组件进行扩展
2. 使用CSS变量进行主题定制
3. 遵循现有的命名规范
4. 保持移动端优先的设计原则
