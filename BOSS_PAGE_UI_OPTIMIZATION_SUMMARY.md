# Boss页面UI优化总结

## 🎯 优化目标

1. **柱状图宽度优化**：使生产累计数据大盘下的柱状图在容器内占据100%宽度，提升移动端显示效果
2. **核心生产指标数据源优化**：将原矿干重处理量数据来源改为真实的原料累计-JDXY表数据
3. **UI文案优化**：调整图表悬浮文字和卡片显示内容

## ✅ 已实施的优化

### 1. 柱状图宽度优化

**位置**：CustomLabelBarChart组件（第913-927行）

**修改前**：
```jsx
<CardContent>
  <ChartContainer config={chartConfig} className="min-h-[350px] sm:min-h-[450px] w-full">
    <BarChart
      accessibilityLayer
      data={chartData}
      layout="vertical"
      width="100%"
      margin={{
        right: 20,
        left: 60,
        top: 15,
        bottom: 15,
      }}
    >
```

**修改后**：
```jsx
<CardContent className="p-0">
  <ChartContainer config={chartConfig} className="min-h-[350px] sm:min-h-[450px] w-full h-full">
    <BarChart
      accessibilityLayer
      data={chartData}
      layout="vertical"
      width="100%"
      height="100%"
      margin={{
        right: 20,
        left: 60,
        top: 15,
        bottom: 15,
      }}
    >
```

**优化效果**：
- ✅ 移除CardContent的默认padding，让图表完全填充容器
- ✅ 添加height="100%"确保图表垂直方向也完全填充
- ✅ 移动端视角下图表显示更加完满

### 2. 核心生产指标数据源优化

#### 2.1 数据获取逻辑优化

**位置**：fetchCoreProductionData函数（第342-414行）

**新增功能**：
- ✅ 并行获取生产计划数据和原料累计数据
- ✅ 根据生产周期类型智能选择数据字段：
  - 月度周期（第N期）→ 使用原料累计-JDXY表的"本月消耗量"字段
  - 年度周期（XX年度）→ 使用原料累计-JDXY表的"本年消耗量"字段

**核心代码**：
```javascript
// 获取原矿干重处理量的实际值
let actualProcessingAmount = 0;
if (rawMaterialResult.success && rawMaterialResult.data?.jdxy) {
  const jdxyData = rawMaterialResult.data.jdxy;
  // 根据生产周期类型选择对应字段
  if (cycle.includes('期')) {
    // 月度周期：使用本月消耗量
    actualProcessingAmount = jdxyData['本月消耗量'] || 0;
  } else if (cycle.includes('年')) {
    // 年度周期：使用本年消耗量
    actualProcessingAmount = jdxyData['本年消耗量'] || 0;
  }
}
```

#### 2.2 图表悬浮文字优化

**位置**：DonutChart组件图表数据（第672-676行）

**修改前**：
```javascript
const segments = [
  { name: "当前值", value: Math.min(currentPercentage, 100), fill: data.fill },
  { name: "剩余", value: Math.max(0, 100 - currentPercentage), fill: "var(--muted)" }
];
```

**修改后**：
```javascript
const segments = [
  { name: "周期累计值", value: Math.min(currentPercentage, 100), fill: data.fill },
  { name: "剩余", value: Math.max(0, 100 - currentPercentage), fill: "var(--muted)" }
];
```

#### 2.3 原矿干重处理量卡片UI优化

**位置**：DonutChart组件renderFooterContent函数（第684-699行）

**修改前**：
```jsx
<CardFooter className="flex-col gap-2 pt-4">
  <div className="w-full space-y-2">
    <div className="flex justify-between text-xs">
      <span>计划处理进度</span>
      <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
    </div>
    <Progress value={progressPercentage} className="h-2" />
  </div>
</CardFooter>
```

**修改后**：
```jsx
<CardFooter className="flex-col gap-2 pt-4">
  <div className="text-xs text-muted-foreground text-center">
    计划处理量: {productionPlan.原矿干重处理量}t | 当前: {data.value}t
  </div>
  <div className="w-full space-y-2">
    <div className="flex justify-between text-xs">
      <span>处理进度</span>
      <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
    </div>
    <Progress value={progressPercentage} className="h-2" />
  </div>
</CardFooter>
```

**优化效果**：
- ✅ 新增真实数值显示："计划处理量: XXXt | 当前: XXXt"
- ✅ 进度条标签从"计划处理进度"改为"处理进度"
- ✅ 数值显示位置在进度条上方，样式与其他卡片保持一致

## 📊 数据流程图

```
生产周期选择
    ↓
fetchCoreProductionData()
    ↓
并行获取数据：
├── 生产计划-JDXY表 → 计划处理量
└── 原料累计-JDXY表 → 实际处理量
    ↓
根据周期类型选择字段：
├── 月度周期（第N期）→ 本月消耗量
└── 年度周期（XX年度）→ 本年消耗量
    ↓
更新DonutChart显示：
├── 图表数据：周期累计值 vs 剩余
├── 中心数值：实际处理量
└── 底部信息：计划vs实际 + 进度条
```

## 🎨 移动端适配效果

### 柱状图优化
- **优化前**：图表在移动端容器中显示不完整，存在边距
- **优化后**：图表100%填充容器，移动端显示更加完满

### 数据显示优化
- **优化前**：使用模拟数据，悬浮显示"当前值"
- **优化后**：使用真实数据，悬浮显示"周期累计值"，底部显示具体数值对比

## 🔧 技术要点

1. **响应式设计**：通过移除padding和设置100%宽高实现完全填充
2. **数据智能映射**：根据周期名称自动选择对应的数据字段
3. **并行数据获取**：使用Promise.all提升数据加载性能
4. **UI一致性**：保持与其他指标卡片相同的样式风格

## 📝 注意事项

1. **数据依赖**：原矿干重处理量现在依赖原料累计-JDXY表，需确保数据表结构正确
2. **周期识别**：通过字符串包含判断（'期'/'年'）来区分周期类型
3. **容错处理**：当原料累计数据获取失败时，处理量显示为0
4. **性能考虑**：并行获取数据可能增加服务器负载，但提升了用户体验

### 3. 图表Tooltip数值显示修复

#### 3.1 问题描述
**位置**：DonutChart组件tooltip显示（第672-686行）

**问题**：图表悬浮时显示的"周期累计值"显示的是百分比数值，而不是实际的数值（如12580t）

#### 3.2 解决方案

**修改前**：
```javascript
const segments = [
  { name: "周期累计值", value: Math.min(currentPercentage, 100), fill: data.fill },
  { name: "剩余", value: Math.max(0, 100 - currentPercentage), fill: "var(--muted)" }
];
```

**修改后**：
```javascript
const segments = [
  {
    name: "周期累计值",
    value: Math.min(currentPercentage, 100),
    actualValue: data.value, // 实际数值用于悬浮显示
    unit: data.unit, // 单位用于悬浮显示
    fill: data.fill
  },
  {
    name: "剩余",
    value: Math.max(0, 100 - currentPercentage),
    fill: "var(--muted)"
  }
];
```

#### 3.3 自定义Tooltip组件

**新增功能**：创建CustomTooltip组件（第765-783行）

```jsx
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.name === "周期累计值" && data.actualValue !== undefined) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-md">
          <div className="grid gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {data.name}
              </span>
              <span className="font-bold text-muted-foreground">
                {data.actualValue}{data.unit}
              </span>
            </div>
          </div>
        </div>
      );
    }
  }
  return null;
};
```

#### 3.4 优化效果
- ✅ **悬浮显示修复**：鼠标悬浮时显示实际数值（如"12580t"）而不是百分比
- ✅ **数值一致性**：悬浮显示的"周期累计值"等于图表中心显示的"当前值"
- ✅ **单位显示**：正确显示单位（t、%等）
- ✅ **样式统一**：tooltip样式与系统其他组件保持一致

## 🚀 后续优化建议

1. **数据缓存**：考虑缓存原料累计数据，避免重复请求
2. **加载状态**：为数据获取过程添加更细粒度的加载状态
3. **错误处理**：完善数据获取失败时的用户提示
4. **数据验证**：添加数据有效性检查，确保显示数据的准确性
5. **Tooltip增强**：考虑为其他指标也添加更详细的悬浮信息
