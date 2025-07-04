# 进厂原矿详情页面布局更新说明

## 📋 更新概述

根据用户需求，对进厂原矿详情页面进行了布局调整，主要涉及PART1趋势总览区域和PART2单日详情区域的优化。

## 🔄 更新内容

### 1. PART1 - 进厂趋势总览区域调整

#### 更新前
- **布局**: 响应式网格布局（WEB端4列，移动端2列）
- **显示**: 4个趋势图卡片同时显示
- **交互**: 静态显示，无切换功能

#### 更新后
- **布局**: 单列显示（一排只显示一个图表）
- **组件**: 使用Carousel组件实现图表切换
- **交互**: 支持左右切换按钮，手动切换图表
- **图表高度**: 从200px增加到300px，提供更好的视觉效果

#### 技术实现
```tsx
// 导入Carousel组件
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

// 使用Carousel包装趋势图
<Carousel className="w-full">
  <CarouselContent>
    <CarouselItem>
      {/* 进厂湿重趋势图 */}
    </CarouselItem>
    <CarouselItem>
      {/* 水份趋势图 */}
    </CarouselItem>
    <CarouselItem>
      {/* 原矿Pb品位趋势图 */}
    </CarouselItem>
    <CarouselItem>
      {/* 原矿Zn品位趋势图 */}
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

### 2. PART2 - 进厂单日详情区域调整

#### 更新前
- **组件**: 自定义DonutChart组件
- **样式**: 独立的样式设计
- **参数**: 自定义的innerRadius和strokeWidth

#### 更新后
- **组件**: 与boss页面DonutChart组件保持一致
- **样式**: 统一的Card结构和样式
- **参数**: 使用相同的innerRadius={50}, strokeWidth={5}
- **标签**: 使用相同的中心标签显示方式（数值+单位）
- **Footer**: 保持相同的CardFooter结构

#### 技术实现
```tsx
// 与boss页面保持一致的甜甜圈组件
const DonutChart = ({ data }: { data: DonutDataItem }) => {
  // 计算百分比和图表数据
  const { percentage, chartData } = React.useMemo(() => {
    const currentPercentage = Math.min((data.value / data.maxValue) * 100, 100);
    
    const segments = [
      {
        name: "当前值",
        value: currentPercentage,
        actualValue: data.value,
        unit: data.unit,
        fill: data.fill
      },
      {
        name: "剩余",
        value: Math.max(0, 100 - currentPercentage),
        fill: "var(--muted)"
      }
    ];

    return { percentage: currentPercentage, chartData: segments };
  }, [data]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm">{data.name}</CardTitle>
        <CardDescription className="text-xs">{singleDate}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={donutConfig} className="mx-auto aspect-square max-h-[200px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<CustomTooltip />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              strokeWidth={5}
            >
              <RechartsLabel content={({ viewBox }) => {
                // 中心标签显示数值和单位
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                        {data.value.toFixed(1)}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-sm">
                        {data.unit}
                      </tspan>
                    </text>
                  );
                }
              }} />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-4">
        {/* 进度条和达标监控 */}
        <div className="text-xs text-muted-foreground text-center">
          最大值: {data.maxValue}{data.unit} | 当前: {data.value.toFixed(2)}{data.unit}
        </div>
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs">
            <span>填充比例</span>
            <span className="font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      </CardFooter>
    </Card>
  );
};
```

## 🎯 更新优势

### 1. PART1 - 趋势总览优化
- **空间利用**: 单列显示充分利用屏幕宽度，图表更大更清晰
- **用户体验**: Carousel切换提供流畅的交互体验
- **移动端友好**: 单列布局在移动端显示效果更佳
- **数据聚焦**: 一次只显示一个指标，用户注意力更集中

### 2. PART2 - 单日详情统一
- **设计一致性**: 与boss页面甜甜圈组件保持完全一致
- **代码复用**: 减少重复代码，提高维护性
- **视觉统一**: 统一的样式和交互体验
- **功能完整**: 保持所有原有功能的同时提升视觉效果

## 📱 响应式设计

### 移动端适配
- **Carousel**: 支持触摸滑动切换
- **甜甜圈图表**: 保持2列布局，适合移动端查看
- **按钮**: 切换按钮适合触摸操作

### 桌面端优化
- **Carousel**: 支持鼠标点击和键盘导航
- **甜甜圈图表**: 4列布局充分利用屏幕空间
- **交互**: 悬停效果和点击反馈

## 🔧 技术细节

### 新增依赖
```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
```

### 保持不变的功能
- ✅ 数据处理逻辑
- ✅ API连接和数据流
- ✅ TypeScript类型定义
- ✅ 编辑和删除功能
- ✅ 日期选择器
- ✅ 数据表格

### 优化的功能
- 🔄 趋势图显示方式（网格 → Carousel）
- 🔄 甜甜圈图表样式（自定义 → 统一）
- 🔄 图表高度（200px → 300px）
- 🔄 中心标签字体大小（text-xl → text-2xl）

## 🚀 使用指南

### 1. 趋势总览操作
1. 查看当前显示的趋势图
2. 点击左右箭头切换不同指标
3. 在移动端可以滑动切换
4. 每个图表显示富鼎翔和金鼎数据对比

### 2. 单日详情操作
1. 选择特定日期
2. 查看4个甜甜圈图表（响应式布局）
3. 观察中心数值和填充比例
4. 查看底部的进度条和达标状态

## 📊 性能影响

### 正面影响
- **渲染优化**: Carousel按需渲染，减少初始渲染负担
- **内存使用**: 单个图表显示减少内存占用
- **加载速度**: 分步加载提升页面响应速度

### 注意事项
- **Carousel依赖**: 确保Carousel组件正确导入
- **样式一致性**: 保持与boss页面的样式同步
- **数据处理**: 确保数据格式与新组件兼容

## 🔍 测试建议

### 功能测试
- [ ] Carousel左右切换功能
- [ ] 甜甜圈图表数据显示
- [ ] 响应式布局适配
- [ ] 移动端触摸操作

### 兼容性测试
- [ ] 不同浏览器兼容性
- [ ] 不同屏幕尺寸适配
- [ ] 数据加载和错误处理

---

**更新完成时间**: 2025-01-03
**版权信息**: FDX@2025 滇ICP备2025058380号
