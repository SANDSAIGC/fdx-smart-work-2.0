# 进厂原矿详情页面综合更新说明

## 📋 更新概述

根据用户最新需求，对进厂原矿详情页面进行了全面的功能增强和优化，主要包括：
1. 进厂趋势总览数据聚合和手动刷新功能
2. 进厂数据汇总选项卡和导出功能
3. 界面布局和交互体验优化

## 🔄 更新内容

### 1. 进厂趋势总览增强

#### 1.1 数据聚合功能
**更新前**：
- 每个日期只显示一条记录的数据
- 无法处理同日期多条记录的情况

**更新后**：
- 自动按日期聚合多条记录
- t单位数据使用汇总值（湿重总计）
- %单位数据使用加权平均值（按重量加权）

**技术实现**：
```tsx
// 数据聚合算法
fdxData.forEach(item => {
  const date = item.计量日期;
  const wetWeight = Number(item['湿重(t)'] || 0);
  const moisture = Number(item['水份(%)'] || 0);
  
  // 湿重汇总
  existing.富鼎翔湿重总计 += wetWeight;
  // 加权平均计算
  existing.富鼎翔水份加权总和 += moisture * wetWeight;
  existing.富鼎翔总重量 += wetWeight;
});

// 最终结果计算
富鼎翔湿重: item.富鼎翔湿重总计,
富鼎翔水份: item.富鼎翔总重量 > 0 ? item.富鼎翔水份加权总和 / item.富鼎翔总重量 : 0,
```

#### 1.2 手动刷新功能
**新增功能**：
- 标题右上角添加刷新按钮（仅图标）
- 快捷选择日期后需手动点击刷新
- 移除自动刷新，避免不必要的API调用

**技术实现**：
```tsx
// 手动刷新函数
const refreshTrendData = () => {
  fetchIncomingOreData(trendStartDate, trendEndDate);
};

// UI布局
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <BarChart3 className="h-5 w-5 text-primary" />
    <CardTitle>进厂趋势总览</CardTitle>
  </div>
  <Button variant="ghost" size="icon" onClick={refreshTrendData}>
    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
  </Button>
</div>
```

### 2. 进厂数据汇总重构

#### 2.1 选项卡功能
**新增功能**：
- 金鼎数据选项卡（原有功能）
- 富鼎翔数据选项卡（新增）
- 统一的数据结构和聚合算法

**数据源映射**：
- 金鼎数据：连接"进厂原矿-JDXY"表
- 富鼎翔数据：连接"进厂原矿-FDX"表
- 字段映射保持一致

**技术实现**：
```tsx
// 选项卡状态管理
const [activeTab, setActiveTab] = useState('jdxy'); // 'jdxy' 或 'fdx'

// 选项卡UI
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
    <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
  </TabsList>
  <TabsContent value="jdxy">
    {/* 金鼎数据表格 */}
  </TabsContent>
  <TabsContent value="fdx">
    {/* 富鼎翔数据表格 */}
  </TabsContent>
</Tabs>
```

#### 2.2 导出Excel功能
**新增功能**：
- 支持导出当前选项卡的数据
- CSV格式，兼容Excel打开
- 自动生成文件名（包含数据源和日期范围）

**技术实现**：
```tsx
const exportToExcel = () => {
  const data = activeTab === 'jdxy' ? processTableData() : processFdxTableData();
  const dataSource = activeTab === 'jdxy' ? '金鼎' : '富鼎翔';
  
  // 创建CSV内容
  const headers = ['日期', '进厂湿重(t)', '水份(%)', '原矿Pb品位(%)', '原矿Zn品位(%)', '记录数'];
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      item.计量日期,
      item.进厂湿重.toFixed(2),
      item.水份.toFixed(2),
      item.Pb.toFixed(2),
      item.Zn.toFixed(2),
      item.记录数
    ].join(','))
  ].join('\n');

  // 下载文件
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('download', `进厂原矿数据汇总_${dataSource}_${tableStartDate}_${tableEndDate}.csv`);
  // ... 下载逻辑
};
```

#### 2.3 界面布局优化
**更新内容**：
- 刷新按钮移至标题右上角（仅图标）
- 导出按钮替换原刷新按钮位置
- 统一的按钮样式和交互反馈

## 🎯 功能特性

### 1. 智能数据聚合
- **同日期合并**：自动合并同一日期的多条记录
- **科学计算**：
  - 湿重：直接汇总 `Σ(湿重)`
  - 水份：加权平均 `Σ(水份×湿重)/Σ(湿重)`
  - Pb品位：加权平均 `Σ(Pb×湿重)/Σ(湿重)`
  - Zn品位：加权平均 `Σ(Zn×湿重)/Σ(湿重)`
- **记录统计**：显示每日原始记录数量

### 2. 灵活数据查看
- **双数据源**：支持金鼎和富鼎翔数据独立查看
- **统一界面**：相同的表格结构和操作方式
- **快速切换**：选项卡方式无缝切换数据源

### 3. 数据导出功能
- **格式支持**：CSV格式，Excel兼容
- **智能命名**：文件名包含数据源和日期范围
- **编码支持**：UTF-8 BOM，确保中文正确显示

### 4. 优化的交互体验
- **手动控制**：用户主动触发数据刷新
- **视觉反馈**：加载状态和动画效果
- **响应式设计**：适配不同设备屏幕

## 📊 数据流程图

```
用户操作 → 选择日期范围 → 点击刷新按钮 → API调用
    ↓
获取原始数据 → 按日期分组 → 聚合计算 → 图表/表格显示
    ↓
选择选项卡 → 切换数据源 → 重新聚合 → 更新显示
    ↓
点击导出 → 生成CSV → 下载文件
```

## 🔧 技术细节

### 新增状态管理
```tsx
const [activeTab, setActiveTab] = useState('jdxy'); // 选项卡状态
```

### 新增函数
```tsx
const refreshTrendData = () => {...}; // 手动刷新趋势数据
const processFdxTableData = () => {...}; // 富鼎翔数据聚合
const exportToExcel = () => {...}; // 导出Excel功能
```

### 更新的函数
```tsx
const processTrendData = () => {...}; // 增强的趋势数据聚合
const processTableData = () => {...}; // 保持的金鼎数据聚合
```

## 📱 响应式设计

### 移动端优化
- **选项卡布局**：网格布局适配小屏幕
- **按钮尺寸**：合适的触摸目标大小
- **表格滚动**：横向滚动查看完整数据

### 桌面端优化
- **空间利用**：充分利用屏幕宽度
- **交互反馈**：悬浮效果和点击反馈
- **键盘导航**：支持Tab键导航

## 🚀 使用指南

### 1. 查看趋势数据
1. 使用快捷按钮或手动设置日期范围
2. 点击右上角刷新按钮获取最新数据
3. 在Carousel中切换查看不同参数趋势
4. 观察聚合后的数据趋势变化

### 2. 查看汇总数据
1. 在数据汇总区域设置日期范围
2. 选择金鼎或富鼎翔选项卡
3. 查看按日期聚合的统计数据
4. 通过记录数了解数据完整性

### 3. 导出数据
1. 选择需要导出的数据源选项卡
2. 设置合适的日期范围
3. 点击"导出表格"按钮
4. 文件自动下载到本地

## 📈 性能优化

### 正面影响
- **按需加载**：手动刷新减少不必要的API调用
- **数据聚合**：前端聚合减少表格行数
- **缓存机制**：避免重复计算相同数据

### 注意事项
- **内存使用**：聚合计算需要额外内存开销
- **计算复杂度**：大量数据时聚合计算可能较慢
- **文件大小**：导出大量数据时文件可能较大

## 🔍 测试建议

### 功能测试
- [ ] 趋势图数据聚合正确性
- [ ] 手动刷新功能正常
- [ ] 选项卡切换功能
- [ ] 导出Excel功能

### 数据测试
- [ ] 同日期多条记录聚合
- [ ] 加权平均计算准确性
- [ ] 不同数据源数据正确性
- [ ] 导出文件格式正确

### 界面测试
- [ ] 响应式布局适配
- [ ] 按钮交互反馈
- [ ] 加载状态显示
- [ ] 错误处理机制

---

**更新完成时间**: 2025-01-03
**版权信息**: FDX@2025 滇ICP备2025058380号
