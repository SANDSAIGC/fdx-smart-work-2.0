"use client";

import React, { useState, useCallback, useEffect } from "react";
import { format } from 'date-fns';
import {
  BarChart3, RefreshCw, Calendar as CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginatedTable } from "@/components/ui/paginated-table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { ChartBarNegative } from "@/components/charts/ChartBarNegative";
import { formatValue, formatWeight, formatPercentage } from "@/lib/formatters";

// 数据对比分析组件接口
interface DataVs1Props {
  title?: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  badgeClassName?: string;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  comparisonData?: {
    incoming: any[];
    outgoing: any[];
    production: any[];
  };
  chartData?: {
    incoming: { gradeAndMoisture: any[] };
    production: { originalOre: any[] };
    outgoing: { gradeAndMoisture: any[]; weightAndMetal: any[] };
  };
  // 生产周期相关props
  productionCycles?: string[];
  selectedCycle?: string;
  onCycleChange?: (cycle: string) => void;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  onDateChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
}

// 图表配置
const chartConfig = {
  jinding_grade: {
    label: "金鼎品位",
    color: "var(--chart-1)",
  },
  fudingxiang_grade: {
    label: "富鼎翔品位",
    color: "var(--chart-2)",
  },
  jinding_moisture: {
    label: "金鼎水份",
    color: "var(--chart-3)",
  },
  fudingxiang_moisture: {
    label: "富鼎翔水份",
    color: "var(--chart-4)",
  },
  jinding_day_moisture: {
    label: "金鼎白班水份",
    color: "var(--chart-1)",
  },
  jinding_night_moisture: {
    label: "金鼎夜班水份",
    color: "var(--chart-2)",
  },
  fudingxiang_day_moisture: {
    label: "富鼎翔白班水份",
    color: "var(--chart-3)",
  },
  fudingxiang_night_moisture: {
    label: "富鼎翔夜班水份",
    color: "var(--chart-4)",
  },
  jinding_weight: {
    label: "金鼎重量",
    color: "var(--chart-1)",
  },
  fudingxiang_weight: {
    label: "富鼎翔重量",
    color: "var(--chart-2)",
  },
  internal_grade: {
    label: "内部取样品位",
    color: "var(--chart-5)",
  },
  internal_moisture: {
    label: "内部取样水份",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

// 格式化日期范围显示
function formatDateRange(startDate?: Date, endDate?: Date): string {
  if (!startDate || !endDate) {
    return "未选择日期";
  }

  const formatDate = (date: Date) => {
    // 使用本地时间，避免时区偏移导致的日期错误
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate);

  return `${start} 至 ${end}`;
}

// 智能字段匹配函数
function smartFieldMapping(data: any[], requestedFields: string[]): string[] {
  if (!data || data.length === 0) return requestedFields;

  const sampleItem = data[0];
  const availableFields = Object.keys(sampleItem);

  return requestedFields.map(field => {
    // 直接匹配
    if (availableFields.includes(field)) {
      return field;
    }

    // 模糊匹配
    const fuzzyMatch = availableFields.find(available => {
      const normalizedAvailable = available.toLowerCase().replace(/[()（）\s-]/g, '');
      const normalizedRequested = field.toLowerCase().replace(/[()（）\s-]/g, '');
      return normalizedAvailable.includes(normalizedRequested) ||
             normalizedRequested.includes(normalizedAvailable);
    });

    return fuzzyMatch || field;
  });
}

// 数据聚合函数 - 按时间范围聚合数据
function aggregateDataByTimeRange(data: any[], groupByField: string) {
  if (!data || data.length === 0) return {};

  const grouped: { [key: string]: any[] } = {};

  // 按分组字段分组数据
  data.forEach(item => {
    const groupKey = groupByField === '班次' ? item.班次 : item.发货单位名称 || item.班次;
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(item);
  });

  const aggregated: { [key: string]: any } = {};

  // 对每个分组进行聚合计算
  Object.keys(grouped).forEach(groupKey => {
    const groupData = grouped[groupKey];
    const aggregatedItem: any = { [groupByField]: groupKey };

    // 获取所有数值字段
    const sampleItem = groupData[0];
    const numericFields = Object.keys(sampleItem).filter(key => {
      const value = sampleItem[key];
      return !isNaN(parseFloat(value)) && isFinite(value);
    });

    numericFields.forEach(field => {
      const values = groupData.map(item => parseFloat(item[field] || 0)).filter(v => !isNaN(v));

      if (values.length === 0) {
        aggregatedItem[field] = 0;
        return;
      }

      // 判断字段类型进行不同的聚合
      if (field.includes('重') || field.includes('数量') || field.includes('金属') || field.includes('^M')) {
        // 重量类数据：直接求和
        aggregatedItem[field] = values.reduce((sum, val) => sum + val, 0);
      } else if (field.includes('%') || field.includes('品位') || field.includes('回收率') || field.includes('水份')) {
        // 百分比类数据：加权平均（以第一个重量字段为权重）
        const weightField = numericFields.find(f => f.includes('重') || f.includes('湿重'));
        if (weightField) {
          const weights = groupData.map(item => parseFloat(item[weightField] || 0));
          const totalWeight = weights.reduce((sum, w) => sum + w, 0);
          if (totalWeight > 0) {
            const weightedSum = values.reduce((sum, val, idx) => sum + val * weights[idx], 0);
            aggregatedItem[field] = weightedSum / totalWeight;
          } else {
            aggregatedItem[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
          }
        } else {
          // 无权重时使用简单平均
          aggregatedItem[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      } else {
        // 其他数据：简单平均
        aggregatedItem[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    });

    aggregated[groupKey] = aggregatedItem;
  });

  return aggregated;
}

// 数据差值计算函数 - 基于聚合数据的对比分析
function calculateDifferenceData(data: any[], fields: string[], units: string[] = []) {
  if (!data || data.length === 0) {
    console.log('📊 [差值计算] 数据为空');
    return [];
  }

  console.log('📊 [差值计算] 输入数据:', data.length, '条记录');
  console.log('📊 [差值计算] 数据样本:', data[0]);
  console.log('📊 [差值计算] 请求字段:', fields);

  // 智能字段匹配
  const mappedFields = smartFieldMapping(data, fields);
  console.log('📊 [差值计算] 映射字段:', mappedFields);

  // 对于生产班报数据，按班次聚合后对比
  if (data.some(item => item.班次)) {
    console.log('📊 [差值计算] 处理生产班报数据 - 时间范围聚合模式');

    // 按班次聚合整个时间范围内的数据
    const aggregatedData = aggregateDataByTimeRange(data, '班次');
    console.log('📊 [差值计算] 聚合后数据:', aggregatedData);

    const dayShiftData = aggregatedData['白班'];
    const nightShiftData = aggregatedData['夜班'];

    if (!dayShiftData || !nightShiftData) {
      console.log('📊 [差值计算] 缺少白班或夜班聚合数据');
      return [];
    }

    const result: any[] = [];

    mappedFields.forEach((field, index) => {
      const value1 = parseFloat(dayShiftData[field] || 0);
      const value2 = parseFloat(nightShiftData[field] || 0);
      const difference = value1 - value2;

      // 生成唯一的参数名
      let parameterName = field
        .replace(/氧化锌?原矿-|氧化锌?精矿-|尾矿-|氧化矿/g, '')
        .replace(/[()（）]/g, '')
        .replace(/理论/g, '')
        .replace(/t|%/g, '')
        .trim();

      // 确保参数名唯一性，添加索引后缀
      parameterName = `${parameterName}-${index}`;

      result.push({
        parameter: parameterName,
        value: parseFloat(difference.toFixed(3)),
        unit: units[index] || '',
        aggregationType: field.includes('%') || field.includes('品位') || field.includes('回收率') ? '加权平均' : '汇总',
        originalField: field,
        dayShiftValue: value1,
        nightShiftValue: value2
      });
    });

    console.log('📊 [差值计算] 生产班报聚合结果:', result.length, '条差值数据');
    return result;
  } else {
    console.log('📊 [差值计算] 处理进厂/出厂数据 - 时间范围聚合模式');

    // 按发货单位聚合整个时间范围内的数据
    const aggregatedData = aggregateDataByTimeRange(data, '发货单位名称');
    console.log('📊 [差值计算] 聚合后数据:', aggregatedData);

    const units = Object.keys(aggregatedData);
    if (units.length < 2) {
      console.log('📊 [差值计算] 发货单位数量不足，无法进行对比');
      return [];
    }

    // 按单位名称排序，确保一致的差值计算顺序
    units.sort();
    const unit1Data = aggregatedData[units[0]];
    const unit2Data = aggregatedData[units[1]];

    const result: any[] = [];

    mappedFields.forEach((field, index) => {
      const value1 = parseFloat(unit1Data[field] || 0);
      const value2 = parseFloat(unit2Data[field] || 0);
      const difference = value1 - value2;

      // 生成唯一的参数名
      let parameterName = field
        .replace(/[()（）]/g, '')
        .replace(/t|%/g, '')
        .trim();

      // 确保参数名唯一性，添加索引后缀
      parameterName = `${parameterName}-${index}`;

      result.push({
        parameter: parameterName,
        value: parseFloat(difference.toFixed(3)),
        unit: units[index] || '',
        aggregationType: field.includes('%') || field.includes('品位') || field.includes('水份') ? '加权平均' : '汇总',
        originalField: field,
        unit1: units[0],
        unit2: units[1],
        unit1Value: value1,
        unit2Value: value2
      });
    });

    console.log('📊 [差值计算] 进厂/出厂聚合结果:', result.length, '条差值数据');
    return result;
  }
}

// 自定义图例组件
function CustomLegend({ lines }: { lines: { dataKey: string }[] }) {
  // 预定义的颜色映射
  const colorMap: Record<string, string> = {
    'jinding_grade': 'hsl(var(--chart-1))',
    'fudingxiang_grade': 'hsl(var(--chart-2))',
    'jinding_moisture': 'hsl(var(--chart-3))',
    'fudingxiang_moisture': 'hsl(var(--chart-4))',
    'jinding_day_moisture': 'hsl(var(--chart-1))',
    'jinding_night_moisture': 'hsl(var(--chart-2))',
    'fudingxiang_day_moisture': 'hsl(var(--chart-3))',
    'fudingxiang_night_moisture': 'hsl(var(--chart-4))',
    'jinding_weight': 'hsl(var(--chart-1))',
    'fudingxiang_weight': 'hsl(var(--chart-2))',
    'internal_grade': 'hsl(var(--chart-5))',
    'internal_moisture': 'hsl(var(--chart-5))',
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6 px-4">
      {lines.map((line, index) => {
        const config = chartConfig[line.dataKey as keyof typeof chartConfig];
        const color = colorMap[line.dataKey] || `hsl(var(--chart-${index + 1}))`;
        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground">
              {config?.label || line.dataKey}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 图表组件
function ComparisonChart({
  data,
  title,
  description,
  lines,
  trendText = "数据趋势稳定"
}: {
  data: any[],
  title: string,
  description: string,
  lines: { dataKey: string }[],
  trendText?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="comparison-chart-container">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
              bottom: 60, // 增加底部间距，防止标签重叠
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => format(new Date(value), 'MM-dd')}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {lines.map((line, index) => (
              <Line
                key={index}
                dataKey={line.dataKey}
                type="monotone"
                stroke={`var(--color-${line.dataKey})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>

        {/* 自定义图例 */}
        <CustomLegend lines={lines} />

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
          <span>{trendText}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DataVs1({
  title = "数据对比分析",
  description = "金鼎 VS 富鼎翔各环节数据对比",
  badgeText,
  badgeVariant = "default",
  badgeClassName = "",
  onRefresh,
  isRefreshing = false,
  comparisonData = { incoming: [], outgoing: [], production: [] },
  chartData = {
    incoming: { gradeAndMoisture: [] },
    production: { originalOre: [] },
    outgoing: { gradeAndMoisture: [], weightAndMetal: [] }
  },
  // 生产周期相关props
  productionCycles = [],
  selectedCycle = "全部周期",
  onCycleChange,
  comparisonStartDate: propComparisonStartDate,
  comparisonEndDate: propComparisonEndDate,
  onDateChange
}: DataVs1Props) {
  // 使用从props传入的日期，如果没有则使用默认值
  const comparisonStartDate = propComparisonStartDate || (() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  })();
  const comparisonEndDate = propComparisonEndDate || new Date();

  // 快速日期选择功能
  const setComparisonQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    if (onDateChange) {
      onDateChange(start, end);
    }
  }, [onDateChange]);

  // 生成趋势文本
  const generateSingleTrendText = useCallback((data: any[], jindingKey: string, fudingxiangKey: string, isPercentage: boolean = false) => {
    if (!data || data.length === 0) return '暂无数据';
    
    let jindingTotal = 0;
    let fudingxiangTotal = 0;
    let validCount = 0;

    data.forEach(item => {
      const jindingValue = parseFloat(item[jindingKey]);
      const fudingxiangValue = parseFloat(item[fudingxiangKey]);
      
      if (!isNaN(jindingValue) && !isNaN(fudingxiangValue)) {
        jindingTotal += jindingValue;
        fudingxiangTotal += fudingxiangValue;
        validCount++;
      }
    });

    if (validCount === 0) return '暂无有效数据';

    let difference: number;
    if (isPercentage) {
      const jindingAvg = jindingTotal / validCount;
      const fudingxiangAvg = fudingxiangTotal / validCount;
      difference = Math.abs(jindingAvg - fudingxiangAvg);
    } else {
      difference = Math.abs(jindingTotal - fudingxiangTotal);
    }

    return `${isPercentage ? '平均差值' : '累计差值'} ${difference.toFixed(isPercentage ? 2 : 1)}${isPercentage ? '%' : 't'}`;
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
            {badgeText && (
              <Badge variant={badgeVariant} className={badgeClassName}>
                {badgeText}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 数据对比分析专用日期范围选择器 */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            数据对比日期范围
          </h3>
          <div className="space-y-4">
            {/* 生产周期选择器 */}
            {productionCycles.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">生产周期</label>
                <Select value={selectedCycle} onValueChange={onCycleChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择生产周期" />
                  </SelectTrigger>
                  <SelectContent>
                    {productionCycles.map((cycle) => (
                      <SelectItem key={cycle} value={cycle}>
                        {cycle === '全部周期' ? '全部周期 (聚合数据)' : `生产周期: ${cycle}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-1">
                  选择生产周期后，日期范围将自动同步
                </div>
              </div>
            )}

            {/* 日期输入 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
                <Input
                  type="date"
                  value={comparisonStartDate ? comparisonStartDate.toISOString().split('T')[0] : ""}
                  onChange={(e) => onDateChange && onDateChange(e.target.value ? new Date(e.target.value) : undefined, comparisonEndDate)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
                <Input
                  type="date"
                  value={comparisonEndDate ? comparisonEndDate.toISOString().split('T')[0] : ""}
                  onChange={(e) => onDateChange && onDateChange(comparisonStartDate, e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full"
                />
              </div>
            </div>

            {/* 快速选择按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComparisonQuickDateRange(7)}
                className="text-xs"
              >
                最近一周
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComparisonQuickDateRange(30)}
                className="text-xs"
              >
                最近一月
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComparisonQuickDateRange(90)}
                className="text-xs"
              >
                最近三月
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setComparisonQuickDateRange(180)}
                className="text-xs"
              >
                最近半年
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="incoming">进厂数据</TabsTrigger>
            <TabsTrigger value="production">生产数据</TabsTrigger>
            <TabsTrigger value="outgoing">出厂数据</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">进厂原矿数据差值</h3>

              {/* 进厂原矿数据差值图表 */}
              <ChartBarNegative
                data={calculateDifferenceData(
                  comparisonData.incoming,
                  ['湿重(t)', '水份(%)', '干重(t)', 'Pb^M', 'Zn^M'],
                  ['t', '%', 't', 't', 't']
                )}
                title="进厂原矿数据差值对比"
                description={`考核日期：${formatDateRange(comparisonStartDate, comparisonEndDate)}`}
                footerText="正值表示第一单位聚合数据较高，负值表示第二单位聚合数据较高"
                trendText="基于时间范围聚合的差值对比"
                height={280}
                compact={true}
                className="w-full"
              />

              {/* 进厂数据表格 */}
              <div className="mt-6">
                <PaginatedTable
                  data={comparisonData.incoming || []}
                  columns={[
                    {
                      key: '计量日期',
                      label: '日期'
                    },
                    {
                      key: '湿重(t)',
                      label: '湿重(t)',
                      render: (value) => value !== undefined ? Number(value).toFixed(3) : '--'
                    },
                    {
                      key: '水份(%)',
                      label: '水份(%)',
                      render: (value) => value !== undefined ? Number(value).toFixed(2) : '--'
                    },
                    {
                      key: '干重(t)',
                      label: '干重(t)',
                      render: (value) => value !== undefined ? Number(value).toFixed(3) : '--'
                    },
                    {
                      key: 'Pb^M',
                      label: 'Pb^M(t)',
                      render: (value) => value !== undefined ? Number(value).toFixed(3) : '--'
                    },
                    {
                      key: 'Zn^M',
                      label: 'Zn^M(t)',
                      render: (value) => value !== undefined ? Number(value).toFixed(3) : '--'
                    },
                    {
                      key: '发货单位名称',
                      label: '发货单位'
                    },
                    {
                      key: '收货单位名称',
                      label: '收货单位'
                    }
                  ]}
                  title="进厂原矿差值数据"
                  emptyMessage="暂无进厂原矿对比数据"
                  exportFileName={`进厂原矿对比数据_${comparisonStartDate?.toISOString().split('T')[0]}_${comparisonEndDate?.toISOString().split('T')[0]}.csv`}
                  detailFields={[
                    { key: '计量日期', label: '计量日期' },
                    { key: '湿重(t)', label: '湿重(t)' },
                    { key: '水份(%)', label: '水份(%)' },
                    { key: '干重(t)', label: '干重(t)' },
                    { key: 'Pb^M', label: 'Pb^M(t)' },
                    { key: 'Zn^M', label: 'Zn^M(t)' },
                    { key: '发货单位名称', label: '发货单位' },
                    { key: '收货单位名称', label: '收货单位' },
                    { key: '备注', label: '备注' }
                  ]}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="production" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">生产班样数据差值</h3>
              <Carousel className="w-full">
                <CarouselContent>
                  {/* 回收率数据 */}
                  <CarouselItem>
                    <ChartBarNegative
                      data={calculateDifferenceData(
                        comparisonData.production,
                        ['氧化矿Zn理论回收率（%）'],
                        ['%']
                      )}
                      title="回收率数据差值"
                      description={`考核日期：${formatDateRange(comparisonStartDate, comparisonEndDate)}`}
                      footerText="正值表示第一单位聚合数据较高，负值表示第二单位聚合数据较高"
                      trendText="基于时间范围聚合的回收率差值"
                      height={250}
                      compact={true}
                      className="w-full"
                    />
                  </CarouselItem>

                  {/* 原矿数据 */}
                  <CarouselItem>
                    <ChartBarNegative
                      data={calculateDifferenceData(
                        comparisonData.production,
                        ['氧化锌原矿-水份（%）', '氧化锌原矿-Pb全品位（%）', '氧化锌原矿-Zn全品位（%）', '氧化锌原矿-全金属Pb（t）', '氧化锌原矿-全金属Zn（t）'],
                        ['%', '%', '%', 't', 't']
                      )}
                      title="原矿数据差值"
                      description={`考核日期：${formatDateRange(comparisonStartDate, comparisonEndDate)}`}
                      footerText="正值表示第一单位聚合数据较高，负值表示第二单位聚合数据较高"
                      trendText="基于时间范围聚合的原矿数据差值"
                      height={250}
                      compact={true}
                      className="w-full"
                    />
                  </CarouselItem>

                  {/* 精矿数据 */}
                  <CarouselItem>
                    <ChartBarNegative
                      data={calculateDifferenceData(
                        comparisonData.production,
                        ['氧化锌精矿-数量（t）', '氧化锌精矿-Pb品位（%）', '氧化锌精矿-Zn品位（%）', '氧化锌精矿-Pb金属量（t）', '氧化锌精矿-Zn金属量（t）'],
                        ['t', '%', '%', 't', 't']
                      )}
                      title="精矿数据差值"
                      description={`考核日期：${formatDateRange(comparisonStartDate, comparisonEndDate)}`}
                      footerText="正值表示第一单位聚合数据较高，负值表示第二单位聚合数据较高"
                      trendText="基于时间范围聚合的精矿数据差值"
                      height={250}
                      compact={true}
                      className="w-full"
                    />
                  </CarouselItem>

                  {/* 尾矿数据 */}
                  <CarouselItem>
                    <ChartBarNegative
                      data={calculateDifferenceData(
                        comparisonData.production,
                        ['尾矿-数量（t）', '尾矿-Pb全品位（%）', '尾矿-Zn全品位（%）', '尾矿-Pb全金属（t）', '尾矿-Zn全金属（t）'],
                        ['t', '%', '%', 't', 't']
                      )}
                      title="尾矿数据差值"
                      description={`考核日期：${formatDateRange(comparisonStartDate, comparisonEndDate)}`}
                      footerText="正值表示第一单位聚合数据较高，负值表示第二单位聚合数据较高"
                      trendText="基于时间范围聚合的尾矿数据差值"
                      height={250}
                      compact={true}
                      className="w-full"
                    />
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>

              {/* 生产数据表格 */}
              <div className="mt-6">
                <PaginatedTable
                  data={comparisonData.production || []}
                  columns={[
                    {
                      key: '日期',
                      label: '日期'
                    },
                    {
                      key: '班次',
                      label: '班次'
                    },
                    {
                      key: '氧化锌原矿-水份（%）',
                      label: '原矿水份(%)',
                      render: (value) => value !== undefined ? Number(value).toFixed(2) : '--'
                    },
                    {
                      key: '氧化锌原矿-Pb全品位（%）',
                      label: '原矿Pb品位(%)',
                      render: (value) => value !== undefined ? Number(value).toFixed(2) : '--'
                    },
                    {
                      key: '氧化锌原矿-Zn全品位（%）',
                      label: '原矿Zn品位(%)',
                      render: (value) => value !== undefined ? Number(value).toFixed(2) : '--'
                    },
                    {
                      key: '氧化锌精矿-Pb品位（%）',
                      label: '精矿Pb品位(%)',
                      render: (value) => value !== undefined ? Number(value).toFixed(2) : '--'
                    },
                    {
                      key: '氧化锌精矿-Zn品位（%）',
                      label: '精矿Zn品位(%)',
                      render: (value) => value !== undefined ? Number(value).toFixed(2) : '--'
                    },
                    {
                      key: '氧化矿Zn理论回收率（%）',
                      label: 'Zn回收率(%)',
                      render: (value) => value !== undefined ? Number(value).toFixed(2) : '--'
                    }
                  ]}
                  title="生产班样差值数据"
                  emptyMessage="暂无生产班样对比数据"
                  exportFileName={`生产班样对比数据_${comparisonStartDate?.toISOString().split('T')[0]}_${comparisonEndDate?.toISOString().split('T')[0]}.csv`}
                  detailFields={[
                    { key: '日期', label: '日期' },
                    { key: '班次', label: '班次' },
                    { key: '氧化锌原矿-水份（%）', label: '原矿水份(%)' },
                    { key: '氧化锌原矿-Pb全品位（%）', label: '原矿Pb品位(%)' },
                    { key: '氧化锌原矿-Zn全品位（%）', label: '原矿Zn品位(%)' },
                    { key: '氧化锌精矿-Pb品位（%）', label: '精矿Pb品位(%)' },
                    { key: '氧化锌精矿-Zn品位（%）', label: '精矿Zn品位(%)' },
                    { key: '氧化矿Zn理论回收率（%）', label: 'Zn回收率(%)' }
                  ]}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outgoing" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">出厂精矿数据差值</h3>

              {/* 出厂精矿数据差值图表 */}
              <ChartBarNegative
                data={calculateDifferenceData(
                  comparisonData.outgoing,
                  ['湿重(t)', '水份(%)', '干重(t)', 'Pb^M', 'Zn^M'],
                  ['t', '%', 't', 't', 't']
                )}
                title="出厂精矿数据差值对比"
                description={`考核日期：${formatDateRange(comparisonStartDate, comparisonEndDate)}`}
                footerText="正值表示第一单位聚合数据较高，负值表示第二单位聚合数据较高"
                trendText="基于时间范围聚合的差值对比"
                height={280}
                compact={true}
                className="w-full"
              />

              {/* 出厂数据表格 */}
              <div className="mt-6">
                <PaginatedTable
                  data={comparisonData.outgoing || []}
                  columns={[
                    {
                      key: '计量日期',
                      label: '日期'
                    },
                    {
                      key: '湿重(t)',
                      label: '湿重(t)',
                      render: (value) => value !== undefined ? Number(value).toFixed(3) : '--'
                    },
                    {
                      key: '水份(%)',
                      label: '水份(%)',
                      render: (value) => value !== undefined ? Number(value).toFixed(2) : '--'
                    },
                    {
                      key: '干重(t)',
                      label: '干重(t)',
                      render: (value) => value !== undefined ? Number(value).toFixed(3) : '--'
                    },
                    {
                      key: 'Pb^M',
                      label: 'Pb^M(t)',
                      render: (value) => value !== undefined ? Number(value).toFixed(3) : '--'
                    },
                    {
                      key: 'Zn^M',
                      label: 'Zn^M(t)',
                      render: (value) => value !== undefined ? Number(value).toFixed(3) : '--'
                    },
                    {
                      key: '发货单位名称',
                      label: '发货单位'
                    },
                    {
                      key: '收货单位名称',
                      label: '收货单位'
                    },
                    {
                      key: '流向',
                      label: '流向'
                    }
                  ]}
                  title="出厂精矿差值数据"
                  emptyMessage="暂无出厂精矿对比数据"
                  exportFileName={`出厂精矿对比数据_${comparisonStartDate?.toISOString().split('T')[0]}_${comparisonEndDate?.toISOString().split('T')[0]}.csv`}
                  detailFields={[
                    { key: '计量日期', label: '计量日期' },
                    { key: '湿重(t)', label: '湿重(t)' },
                    { key: '水份(%)', label: '水份(%)' },
                    { key: '干重(t)', label: '干重(t)' },
                    { key: 'Pb^M', label: 'Pb^M(t)' },
                    { key: 'Zn^M', label: 'Zn^M(t)' },
                    { key: '发货单位名称', label: '发货单位' },
                    { key: '收货单位名称', label: '收货单位' },
                    { key: '流向', label: '流向' },
                    { key: '备注', label: '备注' }
                  ]}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
