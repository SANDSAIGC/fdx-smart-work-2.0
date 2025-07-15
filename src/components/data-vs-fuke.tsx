"use client"

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Calendar, BarChart3 } from "lucide-react";
import { ChartBarNegative } from "@/components/charts/ChartBarNegative";
import { formatValue, formatWeight, formatPercentage } from "@/lib/formatters";

// 数据对比分析-富科组件接口
interface DataVsFukeProps {
  title?: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  badgeClassName?: string;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  // 生产周期相关props
  productionCycles?: string[];
  selectedCycle?: string;
  onCycleChange?: (cycle: string) => void;
  comparisonStartDate?: Date;
  comparisonEndDate?: Date;
  onDateChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
}

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
  
  const availableFields = Object.keys(data[0]);
  console.log('📊 [字段匹配] 可用字段:', availableFields);
  console.log('📊 [字段匹配] 请求字段:', requestedFields);
  
  return requestedFields.map(field => {
    // 直接匹配
    if (availableFields.includes(field)) {
      return field;
    }
    
    // 模糊匹配
    const fuzzyMatch = availableFields.find(available => 
      available.includes(field.replace(/[()（）]/g, '')) ||
      field.replace(/[()（）]/g, '').includes(available)
    );
    
    if (fuzzyMatch) {
      console.log(`📊 [字段匹配] 模糊匹配: ${field} -> ${fuzzyMatch}`);
      return fuzzyMatch;
    }
    
    console.warn(`📊 [字段匹配] 未找到匹配字段: ${field}`);
    return field;
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
      } else if (field.includes('%') || field.includes('品位') || field.includes('回收率') || field.includes('水份') || field.includes('浓度') || field.includes('细度')) {
        // 百分比类数据：加权平均（以第一个重量字段为权重）或简单平均
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
          // 无权重时使用简单平均（适用于浓细度数据）
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
      aggregationType: field.includes('%') || field.includes('品位') || field.includes('回收率') || field.includes('浓度') || field.includes('细度') ? '加权平均' : '汇总',
      originalField: field,
      dayShiftValue: value1,
      nightShiftValue: value2
    });
  });
  
  console.log('📊 [差值计算] 聚合结果:', result.length, '条差值数据');
  return result;
}

export default function DataVsFuke({
  title = "数据对比分析",
  description = "富科生产数据与生产质量对比分析",
  badgeText,
  badgeVariant = "default",
  badgeClassName = "",
  onRefresh,
  isRefreshing = false,
  // 生产周期相关props
  productionCycles = [],
  selectedCycle = "全部周期",
  onCycleChange,
  comparisonStartDate: propComparisonStartDate,
  comparisonEndDate: propComparisonEndDate,
  onDateChange
}: DataVsFukeProps) {
  // 使用从props传入的日期，如果没有则使用默认值
  const comparisonStartDate = propComparisonStartDate || (() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  })();
  const comparisonEndDate = propComparisonEndDate || new Date();

  // 数据状态管理
  const [productionData, setProductionData] = useState<any[]>([]);
  const [qualityData, setQualityData] = useState<any[]>([]);
  const [isLoadingProduction, setIsLoadingProduction] = useState(false);
  const [isLoadingQuality, setIsLoadingQuality] = useState(false);

  // 快速日期选择功能
  const setComparisonQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    if (onDateChange) {
      onDateChange(start, end);
    }
  }, [onDateChange]);

  // 获取生产数据
  const fetchProductionData = useCallback(async () => {
    if (!comparisonStartDate || !comparisonEndDate) return;
    
    setIsLoadingProduction(true);
    try {
      const response = await fetch('/api/lab/production-comparison-fuke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: comparisonStartDate.toISOString().split('T')[0],
          endDate: comparisonEndDate.toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setProductionData(result.data || []);
    } catch (error) {
      console.error('获取生产数据失败:', error);
      setProductionData([]);
    } finally {
      setIsLoadingProduction(false);
    }
  }, [comparisonStartDate, comparisonEndDate]);

  // 获取生产质量数据
  const fetchQualityData = useCallback(async () => {
    if (!comparisonStartDate || !comparisonEndDate) return;

    setIsLoadingQuality(true);
    try {
      const response = await fetch('/api/lab/quality-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: comparisonStartDate.toISOString().split('T')[0],
          endDate: comparisonEndDate.toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // 为浓细度数据添加班次字段
      const dataWithShift = (result.data || []).map((item: any) => ({
        ...item,
        班次: item.时间 && item.时间.startsWith('08:') ? '白班' : '夜班'
      }));
      setQualityData(dataWithShift);
    } catch (error) {
      console.error('获取生产质量数据失败:', error);
      setQualityData([]);
    } finally {
      setIsLoadingQuality(false);
    }
  }, [comparisonStartDate, comparisonEndDate]);

  // 初始化数据加载
  React.useEffect(() => {
    fetchProductionData();
    fetchQualityData();
  }, [fetchProductionData, fetchQualityData]);

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
      <CardContent className="space-y-6">
        {/* 日期选择器 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
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

        {/* 选项卡内容 */}
        <Tabs defaultValue="production" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="production">生产数据</TabsTrigger>
            <TabsTrigger value="quality">生产质量</TabsTrigger>
          </TabsList>

          {/* 生产数据选项卡 */}
          <TabsContent value="production" className="space-y-4">
            <div className="w-full">
              <Carousel className="w-full">
                <CarouselContent>
                  {/* 回收率数据 */}
                  <CarouselItem>
                    <ChartBarNegative
                      data={calculateDifferenceData(
                        productionData,
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
                        productionData,
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
                        productionData,
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
                        productionData,
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
            </div>
          </TabsContent>

          {/* 生产质量选项卡 */}
          <TabsContent value="quality" className="space-y-4">
            <div className="w-full">
              <ChartBarNegative
                data={calculateDifferenceData(
                  qualityData,
                  ['一号壶浓度', '二号壶浓度', '二号壶细度'],
                  ['%', '%', '%']
                )}
                title="生产质量数据差值对比"
                description={`考核日期：${formatDateRange(comparisonStartDate, comparisonEndDate)}`}
                footerText="正值表示第一单位聚合数据较高，负值表示第二单位聚合数据较高"
                trendText="基于时间范围聚合的生产质量差值对比"
                height={280}
                compact={true}
                className="w-full"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
