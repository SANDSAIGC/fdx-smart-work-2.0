# 进厂原矿详情页面图表更新说明

## 📋 更新概述

根据用户需求，将进厂趋势总览区域的图表组件从Bar Chart - Stacked + Legend替换为Line Chart - Multiple，并添加了日期快捷选择功能。

## 🔄 更新内容

### 1. 图表组件替换

#### 更新前
- **图表类型**: Bar Chart - Stacked + Legend
- **显示方式**: 堆叠柱状图
- **数据展示**: 富鼎翔和金鼎数据堆叠显示

#### 更新后
- **图表类型**: Line Chart - Multiple
- **显示方式**: 双曲线折线图
- **数据展示**: 富鼎翔和金鼎数据分别用两条曲线显示

#### 技术实现
```tsx
// 替换前的BarChart
<BarChart data={processTrendData()}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
  <ChartLegend content={<ChartLegendContent />} />
  <Bar dataKey="富鼎翔湿重" stackId="a" fill="var(--color-富鼎翔)" />
  <Bar dataKey="金鼎湿重" stackId="a" fill="var(--color-金鼎)" />
</BarChart>

// 替换后的LineChart
<LineChart data={processTrendData()}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
  <YAxis />
  <ChartTooltip content={<ChartTooltipContent />} />
  <ChartLegend content={<ChartLegendContent payload={[]} />} />
  <Line
    type="monotone"
    dataKey="富鼎翔湿重"
    stroke="var(--color-富鼎翔)"
    strokeWidth={2}
    dot={{ r: 4 }}
  />
  <Line
    type="monotone"
    dataKey="金鼎湿重"
    stroke="var(--color-金鼎)"
    strokeWidth={2}
    dot={{ r: 4 }}
  />
</LineChart>
```

### 2. 数据源映射保持不变

#### 富鼎翔数据源
- **数据表**: 进厂原矿-FDX
- **字段映射**:
  - 进厂湿重 = "湿重(t)"字段
  - 水份 = "水份(%)"字段
  - 原矿Pb品位 = "Pb"字段
  - 原矿Zn品位 = "Zn"字段

#### 金鼎数据源
- **数据表**: 进厂原矿-JDXY
- **字段映射**:
  - 进厂湿重 = "湿重(t)"字段
  - 水份 = "水份(%)"字段
  - 原矿Pb品位 = "Pb"字段
  - 原矿Zn品位 = "Zn"字段

### 3. 日期快捷选择功能

#### 新增功能
- **最近七天**: 自动设置起始日期为7天前，结束日期为今天
- **最近一月**: 自动设置起始日期为30天前，结束日期为今天
- **最近半年**: 自动设置起始日期为180天前，结束日期为今天

#### 技术实现
```tsx
// 日期快捷选择功能
const setDateRange = (days: number) => {
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(new Date(Date.now() - days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  setTrendStartDate(startDate);
  setTrendEndDate(endDate);
};

// 快捷按钮UI
<div className="flex flex-wrap gap-2">
  <Button variant="outline" size="sm" onClick={() => setDateRange(7)}>
    最近七天
  </Button>
  <Button variant="outline" size="sm" onClick={() => setDateRange(30)}>
    最近一月
  </Button>
  <Button variant="outline" size="sm" onClick={() => setDateRange(180)}>
    最近半年
  </Button>
</div>
```

### 4. 四个参数视图

每个参数视图都包含两条曲线：

#### 1. 进厂湿重趋势图
- **富鼎翔曲线**: 显示富鼎翔的进厂湿重数据
- **金鼎曲线**: 显示金鼎的进厂湿重数据
- **单位**: t（吨）

#### 2. 水份趋势图
- **富鼎翔曲线**: 显示富鼎翔的水份百分比数据
- **金鼎曲线**: 显示金鼎的水份百分比数据
- **单位**: %（百分比）

#### 3. 原矿Pb品位趋势图
- **富鼎翔曲线**: 显示富鼎翔的铅品位数据
- **金鼎曲线**: 显示金鼎的铅品位数据
- **单位**: %（百分比）

#### 4. 原矿Zn品位趋势图
- **富鼎翔曲线**: 显示富鼎翔的锌品位数据
- **金鼎曲线**: 显示金鼎的锌品位数据
- **单位**: %（百分比）

## 🎯 更新优势

### 1. 数据对比更清晰
- **趋势对比**: 折线图更适合显示数据趋势变化
- **双曲线**: 富鼎翔和金鼎数据可以直接对比
- **数据点**: 每个数据点都有明确的标识

### 2. 用户体验提升
- **快捷选择**: 一键选择常用时间范围
- **操作便捷**: 减少手动输入日期的操作
- **视觉优化**: 折线图在趋势分析上更直观

### 3. 交互功能增强
- **悬浮提示**: 鼠标悬浮显示具体数值
- **图例显示**: 清晰区分富鼎翔和金鼎数据
- **响应式**: 在不同设备上都有良好的显示效果

## 📱 响应式设计

### 移动端适配
- **Carousel**: 支持触摸滑动切换图表
- **快捷按钮**: 自动换行适配小屏幕
- **图表尺寸**: 自动调整适合移动端查看

### 桌面端优化
- **图表清晰**: 更大的显示区域展示详细数据
- **交互流畅**: 鼠标悬浮和点击操作
- **按钮布局**: 合理的按钮间距和大小

## 🔧 技术细节

### 新增依赖
```tsx
import { LineChart, Line } from 'recharts';
```

### 移除的组件
```tsx
// 不再使用的组件
import { BarChart, Bar } from 'recharts';
```

### 图表配置
- **线条类型**: monotone（平滑曲线）
- **线条宽度**: 2px
- **数据点**: 半径4px的圆点
- **颜色方案**: 使用CSS变量保持主题一致性

### 数据处理逻辑
- ✅ 保持原有的数据处理逻辑不变
- ✅ 按日期匹配富鼎翔和金鼎数据
- ✅ 字段映射规则保持一致
- ✅ 数据格式化和排序逻辑不变

## 🚀 使用指南

### 1. 查看趋势图
1. 使用快捷按钮选择时间范围
2. 或手动设置起始和结束日期
3. 在Carousel中切换不同参数的趋势图
4. 观察富鼎翔和金鼎两条曲线的变化趋势

### 2. 数据分析
1. **对比分析**: 比较富鼎翔和金鼎的数据差异
2. **趋势分析**: 观察数据随时间的变化趋势
3. **异常检测**: 识别数据中的异常波动
4. **周期性**: 发现数据的周期性变化规律

## 📊 性能影响

### 正面影响
- **渲染优化**: 折线图渲染性能优于复杂的堆叠柱状图
- **内存使用**: 减少图形元素数量，降低内存占用
- **交互响应**: 更快的悬浮和点击响应速度

### 注意事项
- **数据量**: 大量数据点时可能影响性能
- **动画效果**: 图表切换时的动画可能需要优化
- **浏览器兼容**: 确保在不同浏览器中的兼容性

## 🔍 测试建议

### 功能测试
- [ ] 快捷日期选择功能
- [ ] 折线图数据显示正确性
- [ ] Carousel切换功能
- [ ] 响应式布局适配

### 数据测试
- [ ] 富鼎翔数据正确映射
- [ ] 金鼎数据正确映射
- [ ] 日期范围筛选功能
- [ ] 数据为空时的处理

### 性能测试
- [ ] 大量数据点的渲染性能
- [ ] 图表切换的流畅度
- [ ] 移动端滑动性能

---

**更新完成时间**: 2025-01-03
**版权信息**: FDX@2025 滇ICP备2025058380号
