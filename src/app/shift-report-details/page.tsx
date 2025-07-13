"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header2 } from '@/components/headers';
import {
  TruckIcon, RefreshCw, Calendar, PieChartIcon,
  TrendingUp, Download, ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Footer } from "@/components/ui/footer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { formatValue } from "@/lib/formatters";

// 生产班报数据接口
interface ShiftReportData {
  id: number;
  日期: string;
  班次: string;
  '氧化锌原矿-湿重（t）'?: number;
  '氧化锌原矿-水份（%）'?: number;
  '氧化锌原矿-干重（t）'?: number;
  '氧化锌原矿-Pb全品位（%）'?: number;
  '氧化锌原矿-Zn全品位（%）'?: number;
  '氧化锌原矿-全金属Pb（t）'?: number;
  '氧化锌原矿-全金属Zn（t）'?: number;
  '氧化锌精矿-数量（t）'?: number;
  '氧化锌精矿-Pb品位（%）'?: number;
  '氧化锌精矿-Zn品位（%）'?: number;
  '氧化锌精矿-Pb金属量（t）'?: number;
  '氧化锌精矿-Zn金属量（t）'?: number;
  '尾矿-数量（t）'?: number;
  '尾矿-Pb全品位（%）'?: number;
  '尾矿-Zn全品位（%）'?: number;
  '尾矿-Pb全金属（t）'?: number;
  '尾矿-Zn全金属（t）'?: number;
  '氧化矿Zn理论回收率（%）'?: number;
  created_at?: string;
  updated_at?: string;
}

// 柱状图数据接口
interface BarDataItem {
  name: string;
  value: number;
  unit: string;
  fill: string;
  originalValue?: number; // 原始数值，用于工具提示显示
  isCompressed?: boolean; // 是否为压缩显示的数值
}

// 趋势图数据接口
interface TrendDataItem {
  date: string;
  金鼎: AggregatedData | null;
  富鼎翔: AggregatedData | null;
  科力: AggregatedData | null;
}

// 聚合数据接口
interface AggregatedData {
  wetWeight: number;
  moisture: number;
  dryWeight: number;
  pbGrade: number;
  znGrade: number;
  pbMetal: number;
  znMetal: number;
  concentrateQuantity: number;
  concentratePbGrade: number;
  concentrateZnGrade: number;
  concentratePbMetal: number;
  concentrateZnMetal: number;
  tailingQuantity: number;
  tailingPbGrade: number;
  tailingZnGrade: number;
  tailingPbMetal: number;
  tailingZnMetal: number;
  recovery: number;
}

export default function ShiftReportDetailsPage() {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [fdxData, setFdxData] = useState<ShiftReportData[]>([]);
  const [jdxyData, setJdxyData] = useState<ShiftReportData[]>([]);
  const [klData, setKlData] = useState<ShiftReportData[]>([]);
  
  // 趋势图日期范围 - 生产趋势总览组件
  const [trendStartDate, setTrendStartDate] = useState('2025-04-26');
  const [trendEndDate, setTrendEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 单日详情日期 - 生产单日详情组件：设置为当前日期减去2天
  const [singleDate, setSingleDate] = useState(() => {
    return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [singleDayTab, setSingleDayTab] = useState('jdxy');

  // 表格数据日期范围 - 生产数据汇总组件
  const [tableStartDate, setTableStartDate] = useState('2025-04-26');
  const [tableEndDate, setTableEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('jdxy');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 排序状态
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 排序函数
  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // 日期快捷选择功能 - 趋势图
  const setDateRange = (days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setTrendStartDate(startDate);
    setTrendEndDate(endDate);
  };

  // 日期快捷选择功能 - 数据汇总表格
  const setTableDateRange = (days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setTableStartDate(startDate);
    setTableEndDate(endDate);
  };

  // 数据获取函数
  const fetchShiftReportData = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // 并行获取三个数据源的数据
      const [fdxResponse, jdxyResponse, klResponse] = await Promise.all([
        fetch('/api/shift-report-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate,
            endDate,
            dataSource: 'fdx'
          })
        }),
        fetch('/api/shift-report-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate,
            endDate,
            dataSource: 'jdxy'
          })
        }),
        fetch('/api/shift-report-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate,
            endDate,
            dataSource: 'kl'
          })
        })
      ]);

      const [fdxResult, jdxyResult, klResult] = await Promise.all([
        fdxResponse.json(),
        jdxyResponse.json(),
        klResponse.json()
      ]);

      if (fdxResult.success && jdxyResult.success && klResult.success) {
        setFdxData(fdxResult.data || []);
        setJdxyData(jdxyResult.data || []);
        setKlData(klResult.data || []);
      } else {
        console.error('数据获取失败:', fdxResult.error || jdxyResult.error || klResult.error);
      }
    } catch (error) {
      console.error('API调用失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 手动刷新趋势数据
  const refreshTrendData = () => {
    fetchShiftReportData(trendStartDate, trendEndDate);
  };

  // 手动刷新单日详情数据
  const refreshSingleDayData = () => {
    const startDate = singleDate < trendStartDate ? singleDate : trendStartDate;
    const endDate = singleDate > trendEndDate ? singleDate : trendEndDate;
    fetchShiftReportData(startDate, endDate);
  };

  // 手动刷新表格数据
  const refreshTableData = () => {
    const expandedStartDate = tableStartDate < trendStartDate ? tableStartDate : trendStartDate;
    const expandedEndDate = tableEndDate > trendEndDate ? tableEndDate : trendEndDate;
    fetchShiftReportData(expandedStartDate, expandedEndDate);
  };

  // 图表配置
  const chartConfig = {
    金鼎: {
      label: "金鼎",
      color: "var(--chart-1)",
    },
    富鼎翔: {
      label: "富鼎翔",
      color: "var(--chart-2)",
    },
    科力: {
      label: "科力",
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  // 柱状图配置
  const barConfig = {
    value: {
      label: "数值",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // 处理单日柱状图数据
  const processSingleDayBarData = useCallback((dataSource: 'jdxy' | 'fdx' | 'kl'): BarDataItem[][] => {
    let sourceData: ShiftReportData[] = [];

    switch (dataSource) {
      case 'jdxy':
        sourceData = jdxyData;
        break;
      case 'fdx':
        sourceData = fdxData;
        break;
      case 'kl':
        sourceData = klData;
        break;
    }

    // 筛选指定日期的数据 - 处理日期格式差异
    const dayData = sourceData.filter(item => {
      if (!item.日期) return false;
      // 将数据库日期转换为YYYY-MM-DD格式进行比较
      const itemDate = new Date(item.日期).toISOString().split('T')[0];
      return itemDate === singleDate;
    });

    if (dayData.length === 0) {
      return [[], [], [], []]; // 返回四个空数组
    }

    // 聚合计算（如果有多条记录）
    const aggregated = dayData.reduce((acc, item) => {
      // 回收率数据
      acc.recovery += item['氧化矿Zn理论回收率（%）'] || 0;

      // 原矿数据
      acc.oreWetWeight += item['氧化锌原矿-湿重（t）'] || 0;
      acc.oreMoisture += (item['氧化锌原矿-水份（%）'] || 0) * (item['氧化锌原矿-湿重（t）'] || 0);
      acc.oreDryWeight += item['氧化锌原矿-干重（t）'] || 0;
      acc.orePbGrade += (item['氧化锌原矿-Pb全品位（%）'] || 0) * (item['氧化锌原矿-湿重（t）'] || 0);
      acc.oreZnGrade += (item['氧化锌原矿-Zn全品位（%）'] || 0) * (item['氧化锌原矿-湿重（t）'] || 0);
      acc.orePbMetal += item['氧化锌原矿-全金属Pb（t）'] || 0;
      acc.oreZnMetal += item['氧化锌原矿-全金属Zn（t）'] || 0;

      // 精矿数据
      acc.concentrateQuantity += item['氧化锌精矿-数量（t）'] || 0;
      acc.concentratePbGrade += (item['氧化锌精矿-Pb品位（%）'] || 0) * (item['氧化锌精矿-数量（t）'] || 0);
      acc.concentrateZnGrade += (item['氧化锌精矿-Zn品位（%）'] || 0) * (item['氧化锌精矿-数量（t）'] || 0);
      acc.concentratePbMetal += item['氧化锌精矿-Pb金属量（t）'] || 0;
      acc.concentrateZnMetal += item['氧化锌精矿-Zn金属量（t）'] || 0;

      // 尾矿数据
      acc.tailingQuantity += item['尾矿-数量（t）'] || 0;
      acc.tailingPbGrade += (item['尾矿-Pb全品位（%）'] || 0) * (item['尾矿-数量（t）'] || 0);
      acc.tailingZnGrade += (item['尾矿-Zn全品位（%）'] || 0) * (item['尾矿-数量（t）'] || 0);
      acc.tailingPbMetal += item['尾矿-Pb全金属（t）'] || 0;
      acc.tailingZnMetal += item['尾矿-Zn全金属（t）'] || 0;

      acc.totalWeight += item['氧化锌原矿-湿重（t）'] || 0;
      acc.totalConcentrate += item['氧化锌精矿-数量（t）'] || 0;
      acc.totalTailing += item['尾矿-数量（t）'] || 0;
      acc.count += 1;

      return acc;
    }, {
      recovery: 0,
      oreWetWeight: 0, oreMoisture: 0, oreDryWeight: 0, orePbGrade: 0, oreZnGrade: 0, orePbMetal: 0, oreZnMetal: 0,
      concentrateQuantity: 0, concentratePbGrade: 0, concentrateZnGrade: 0, concentratePbMetal: 0, concentrateZnMetal: 0,
      tailingQuantity: 0, tailingPbGrade: 0, tailingZnGrade: 0, tailingPbMetal: 0, tailingZnMetal: 0,
      totalWeight: 0, totalConcentrate: 0, totalTailing: 0, count: 0
    });

    // 计算加权平均
    const avgMoisture = aggregated.totalWeight > 0 ? aggregated.oreMoisture / aggregated.totalWeight : 0;
    const avgOrePbGrade = aggregated.totalWeight > 0 ? aggregated.orePbGrade / aggregated.totalWeight : 0;
    const avgOreZnGrade = aggregated.totalWeight > 0 ? aggregated.oreZnGrade / aggregated.totalWeight : 0;
    const avgConcentratePbGrade = aggregated.totalConcentrate > 0 ? aggregated.concentratePbGrade / aggregated.totalConcentrate : 0;
    const avgConcentrateZnGrade = aggregated.totalConcentrate > 0 ? aggregated.concentrateZnGrade / aggregated.totalConcentrate : 0;
    const avgTailingPbGrade = aggregated.totalTailing > 0 ? aggregated.tailingPbGrade / aggregated.totalTailing : 0;
    const avgTailingZnGrade = aggregated.totalTailing > 0 ? aggregated.tailingZnGrade / aggregated.totalTailing : 0;

    // 构建四组柱状图数据
    const recoveryData: BarDataItem[] = [
      { name: '氧化矿Zn理论回收率', value: aggregated.recovery / aggregated.count, unit: '%', fill: 'var(--chart-1)' }
    ];

    const oreData: BarDataItem[] = [
      { name: '湿重', value: aggregated.oreWetWeight / 20, unit: 't', fill: 'var(--chart-1)', originalValue: aggregated.oreWetWeight, isCompressed: true },
      { name: '水份', value: avgMoisture, unit: '%', fill: 'var(--chart-2)' },
      { name: '干重', value: aggregated.oreDryWeight / 20, unit: 't', fill: 'var(--chart-3)', originalValue: aggregated.oreDryWeight, isCompressed: true },
      { name: 'Pb全品位', value: avgOrePbGrade, unit: '%', fill: 'var(--chart-4)' },
      { name: 'Zn全品位', value: avgOreZnGrade, unit: '%', fill: 'var(--chart-5)' },
      { name: '全金属Pb', value: aggregated.orePbMetal / 20, unit: 't', fill: 'var(--chart-1)', originalValue: aggregated.orePbMetal, isCompressed: true },
      { name: '全金属Zn', value: aggregated.oreZnMetal / 20, unit: 't', fill: 'var(--chart-2)', originalValue: aggregated.oreZnMetal, isCompressed: true }
    ];

    const concentrateData: BarDataItem[] = [
      { name: '数量', value: aggregated.concentrateQuantity / 20, unit: 't', fill: 'var(--chart-1)', originalValue: aggregated.concentrateQuantity, isCompressed: true },
      { name: 'Pb品位', value: avgConcentratePbGrade, unit: '%', fill: 'var(--chart-2)' },
      { name: 'Zn品位', value: avgConcentrateZnGrade, unit: '%', fill: 'var(--chart-3)' },
      { name: 'Pb金属量', value: aggregated.concentratePbMetal / 20, unit: 't', fill: 'var(--chart-4)', originalValue: aggregated.concentratePbMetal, isCompressed: true },
      { name: 'Zn金属量', value: aggregated.concentrateZnMetal / 20, unit: 't', fill: 'var(--chart-5)', originalValue: aggregated.concentrateZnMetal, isCompressed: true }
    ];

    const tailingData: BarDataItem[] = [
      { name: '数量', value: aggregated.tailingQuantity / 20, unit: 't', fill: 'var(--chart-1)', originalValue: aggregated.tailingQuantity, isCompressed: true },
      { name: 'Pb全品位', value: avgTailingPbGrade, unit: '%', fill: 'var(--chart-2)' },
      { name: 'Zn全品位', value: avgTailingZnGrade, unit: '%', fill: 'var(--chart-3)' },
      { name: 'Pb全金属', value: aggregated.tailingPbMetal / 20, unit: 't', fill: 'var(--chart-4)', originalValue: aggregated.tailingPbMetal, isCompressed: true },
      { name: 'Zn全金属', value: aggregated.tailingZnMetal / 20, unit: 't', fill: 'var(--chart-5)', originalValue: aggregated.tailingZnMetal, isCompressed: true }
    ];

    return [recoveryData, oreData, concentrateData, tailingData];
  }, [jdxyData, fdxData, klData, singleDate]);

  // 处理趋势图数据
  const processTrendData = useCallback(() => {
    // 合并所有数据并按日期分组
    const allData = [...jdxyData, ...fdxData, ...klData];
    const dateGroups = new Map();

    allData.forEach(item => {
      if (!item.日期) return;
      // 将数据库日期转换为YYYY-MM-DD格式进行比较
      const itemDate = new Date(item.日期).toISOString().split('T')[0];
      if (itemDate >= trendStartDate && itemDate <= trendEndDate) {
        if (!dateGroups.has(itemDate)) {
          dateGroups.set(itemDate, { jdxy: [], fdx: [], kl: [] });
        }

        // 根据数据来源分类
        if (jdxyData.includes(item)) {
          dateGroups.get(itemDate).jdxy.push(item);
        } else if (fdxData.includes(item)) {
          dateGroups.get(itemDate).fdx.push(item);
        } else if (klData.includes(item)) {
          dateGroups.get(itemDate).kl.push(item);
        }
      }
    });

    // 转换为图表数据格式
    const chartData: TrendDataItem[] = [];

    Array.from(dateGroups.keys()).sort().forEach(date => {
      const dayData = dateGroups.get(date);

      // 聚合每个数据源的数据
      const aggregateData = (items: ShiftReportData[]) => {
        if (items.length === 0) return null;

        const totals = items.reduce((acc, item) => {
          acc.wetWeight += item['氧化锌原矿-湿重（t）'] || 0;
          acc.moisture += (item['氧化锌原矿-水份（%）'] || 0) * (item['氧化锌原矿-湿重（t）'] || 0);
          acc.dryWeight += item['氧化锌原矿-干重（t）'] || 0;
          acc.pbGrade += (item['氧化锌原矿-Pb全品位（%）'] || 0) * (item['氧化锌原矿-湿重（t）'] || 0);
          acc.znGrade += (item['氧化锌原矿-Zn全品位（%）'] || 0) * (item['氧化锌原矿-湿重（t）'] || 0);
          acc.pbMetal += item['氧化锌原矿-全金属Pb（t）'] || 0;
          acc.znMetal += item['氧化锌原矿-全金属Zn（t）'] || 0;
          acc.concentrateQuantity += item['氧化锌精矿-数量（t）'] || 0;
          acc.concentratePbGrade += (item['氧化锌精矿-Pb品位（%）'] || 0) * (item['氧化锌精矿-数量（t）'] || 0);
          acc.concentrateZnGrade += (item['氧化锌精矿-Zn品位（%）'] || 0) * (item['氧化锌精矿-数量（t）'] || 0);
          acc.concentratePbMetal += item['氧化锌精矿-Pb金属量（t）'] || 0;
          acc.concentrateZnMetal += item['氧化锌精矿-Zn金属量（t）'] || 0;
          acc.tailingQuantity += item['尾矿-数量（t）'] || 0;
          acc.tailingPbGrade += (item['尾矿-Pb全品位（%）'] || 0) * (item['尾矿-数量（t）'] || 0);
          acc.tailingZnGrade += (item['尾矿-Zn全品位（%）'] || 0) * (item['尾矿-数量（t）'] || 0);
          acc.tailingPbMetal += item['尾矿-Pb全金属（t）'] || 0;
          acc.tailingZnMetal += item['尾矿-Zn全金属（t）'] || 0;
          acc.recovery += item['氧化矿Zn理论回收率（%）'] || 0;
          acc.totalWeight += item['氧化锌原矿-湿重（t）'] || 0;
          acc.totalConcentrate += item['氧化锌精矿-数量（t）'] || 0;
          acc.totalTailing += item['尾矿-数量（t）'] || 0;
          acc.count += 1;
          return acc;
        }, {
          wetWeight: 0, moisture: 0, dryWeight: 0, pbGrade: 0, znGrade: 0, pbMetal: 0, znMetal: 0,
          concentrateQuantity: 0, concentratePbGrade: 0, concentrateZnGrade: 0, concentratePbMetal: 0, concentrateZnMetal: 0,
          tailingQuantity: 0, tailingPbGrade: 0, tailingZnGrade: 0, tailingPbMetal: 0, tailingZnMetal: 0,
          recovery: 0, totalWeight: 0, totalConcentrate: 0, totalTailing: 0, count: 0
        });

        // 智能计算平均值：优先加权平均，无权重时使用算术平均
        const calculateSmartAverage = (fieldName, weightFieldName = '氧化锌原矿-湿重（t）') => {
          const validItems = items.filter(item => item[fieldName] != null);
          if (validItems.length === 0) return 0;

          // 检查是否有重量数据可用于加权平均
          const itemsWithWeight = validItems.filter(item => item[weightFieldName] != null && item[weightFieldName] > 0);

          if (itemsWithWeight.length > 0) {
            // 有重量数据，使用加权平均
            const totalWeightedValue = itemsWithWeight.reduce((sum, item) => sum + (item[fieldName] * item[weightFieldName]), 0);
            const totalWeight = itemsWithWeight.reduce((sum, item) => sum + item[weightFieldName], 0);

            if (totalWeight > 0) {
              // 如果所有有效记录都有重量，直接返回加权平均
              if (itemsWithWeight.length === validItems.length) {
                return totalWeightedValue / totalWeight;
              }

              // 如果只有部分记录有重量，需要混合计算
              const itemsWithoutWeight = validItems.filter(item => item[weightFieldName] == null || item[weightFieldName] <= 0);
              if (itemsWithoutWeight.length > 0) {
                const weightedAverage = totalWeightedValue / totalWeight;
                const simpleAverage = itemsWithoutWeight.reduce((sum, item) => sum + item[fieldName], 0) / itemsWithoutWeight.length;

                // 按记录数量加权合并两种平均值
                const weightedCount = itemsWithWeight.length;
                const simpleCount = itemsWithoutWeight.length;
                return (weightedAverage * weightedCount + simpleAverage * simpleCount) / (weightedCount + simpleCount);
              }

              return totalWeightedValue / totalWeight;
            }
          }

          // 没有重量数据或重量数据无效，使用算术平均
          return validItems.reduce((sum, item) => sum + item[fieldName], 0) / validItems.length;
        };

        return {
          wetWeight: totals.wetWeight,
          moisture: calculateSmartAverage('氧化锌原矿-水份（%）'),
          dryWeight: totals.dryWeight,
          pbGrade: calculateSmartAverage('氧化锌原矿-Pb全品位（%）'),
          znGrade: calculateSmartAverage('氧化锌原矿-Zn全品位（%）'),
          pbMetal: totals.pbMetal,
          znMetal: totals.znMetal,
          concentrateQuantity: totals.concentrateQuantity,
          concentratePbGrade: calculateSmartAverage('氧化锌精矿-Pb品位（%）', '氧化锌精矿-数量（t）'),
          concentrateZnGrade: calculateSmartAverage('氧化锌精矿-Zn品位（%）', '氧化锌精矿-数量（t）'),
          concentratePbMetal: totals.concentratePbMetal,
          concentrateZnMetal: totals.concentrateZnMetal,
          tailingQuantity: totals.tailingQuantity,
          tailingPbGrade: calculateSmartAverage('尾矿-Pb全品位（%）', '尾矿-数量（t）'),
          tailingZnGrade: calculateSmartAverage('尾矿-Zn全品位（%）', '尾矿-数量（t）'),
          tailingPbMetal: totals.tailingPbMetal,
          tailingZnMetal: totals.tailingZnMetal,
          recovery: totals.count > 0 ? totals.recovery / totals.count : 0
        };
      };

      const jdxyAgg = aggregateData(dayData.jdxy);
      const fdxAgg = aggregateData(dayData.fdx);
      const klAgg = aggregateData(dayData.kl);

      chartData.push({
        date,
        金鼎: jdxyAgg,
        富鼎翔: fdxAgg,
        科力: klAgg
      });
    });

    return chartData;
  }, [jdxyData, fdxData, klData, trendStartDate, trendEndDate]);

  // 处理表格数据 - 金鼎数据
  const processJdxyTableData = useCallback(() => {
    return jdxyData
      .filter(item => {
        if (!item.日期) return false;
        const itemDate = new Date(item.日期).toISOString().split('T')[0];
        return itemDate >= tableStartDate && itemDate <= tableEndDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.日期).toISOString().split('T')[0];
        const dateB = new Date(b.日期).toISOString().split('T')[0];
        return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      });
  }, [jdxyData, tableStartDate, tableEndDate, sortOrder]);

  // 处理表格数据 - 富鼎翔数据
  const processFdxTableData = useCallback(() => {
    return fdxData
      .filter(item => {
        if (!item.日期) return false;
        const itemDate = new Date(item.日期).toISOString().split('T')[0];
        return itemDate >= tableStartDate && itemDate <= tableEndDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.日期).toISOString().split('T')[0];
        const dateB = new Date(b.日期).toISOString().split('T')[0];
        return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      });
  }, [fdxData, tableStartDate, tableEndDate, sortOrder]);

  // 处理表格数据 - 科力数据
  const processKlTableData = useCallback(() => {
    return klData
      .filter(item => {
        if (!item.日期) return false;
        const itemDate = new Date(item.日期).toISOString().split('T')[0];
        return itemDate >= tableStartDate && itemDate <= tableEndDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.日期).toISOString().split('T')[0];
        const dateB = new Date(b.日期).toISOString().split('T')[0];
        return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      });
  }, [klData, tableStartDate, tableEndDate, sortOrder]);

  // 导出EXCEL功能
  const exportToExcel = useCallback(() => {
    let data: ShiftReportData[] = [];
    let dataSource = '';

    switch (activeTab) {
      case 'jdxy':
        data = processJdxyTableData();
        dataSource = '金鼎';
        break;
      case 'fdx':
        data = processFdxTableData();
        dataSource = '富鼎翔';
        break;
      case 'kl':
        data = processKlTableData();
        dataSource = '科力';
        break;
    }

    if (data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 创建CSV内容
    const headers = [
      '日期', '班次', '氧化锌原矿-湿重（t）', '氧化锌原矿-水份（%）', '氧化锌原矿-干重（t）',
      '氧化锌原矿-Pb全品位（%）', '氧化锌原矿-Zn全品位（%）', '氧化锌原矿-全金属Pb（t）', '氧化锌原矿-全金属Zn（t）',
      '氧化锌精矿-数量（t）', '氧化锌精矿-Pb品位（%）', '氧化锌精矿-Zn品位（%）', '氧化锌精矿-Pb金属量（t）', '氧化锌精矿-Zn金属量（t）',
      '尾矿-数量（t）', '尾矿-Pb全品位（%）', '尾矿-Zn全品位（%）', '尾矿-Pb全金属（t）', '尾矿-Zn全金属（t）',
      '氧化矿Zn理论回收率（%）'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.日期,
        item.班次,
        item['氧化锌原矿-湿重（t）'] || '--',
        item['氧化锌原矿-水份（%）'] || '--',
        item['氧化锌原矿-干重（t）'] || '--',
        item['氧化锌原矿-Pb全品位（%）'] || '--',
        item['氧化锌原矿-Zn全品位（%）'] || '--',
        item['氧化锌原矿-全金属Pb（t）'] || '--',
        item['氧化锌原矿-全金属Zn（t）'] || '--',
        item['氧化锌精矿-数量（t）'] || '--',
        item['氧化锌精矿-Pb品位（%）'] || '--',
        item['氧化锌精矿-Zn品位（%）'] || '--',
        item['氧化锌精矿-Pb金属量（t）'] || '--',
        item['氧化锌精矿-Zn金属量（t）'] || '--',
        item['尾矿-数量（t）'] || '--',
        item['尾矿-Pb全品位（%）'] || '--',
        item['尾矿-Zn全品位（%）'] || '--',
        item['尾矿-Pb全金属（t）'] || '--',
        item['尾矿-Zn全金属（t）'] || '--',
        item['氧化矿Zn理论回收率（%）'] || '--'
      ].join(','))
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `生产班报详情_${dataSource}_${tableStartDate}_${tableEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeTab, processJdxyTableData, processFdxTableData, processKlTableData, tableStartDate, tableEndDate]);

  // 数据详情对话框组件
  const DataDetailDialog = ({ data }: { data: ShiftReportData }) => {
    const fields = [
      { key: '日期', label: '日期' },
      { key: '班次', label: '班次' },
      { key: '氧化锌原矿-湿重（t）', label: '氧化锌原矿-湿重（t）' },
      { key: '氧化锌原矿-水份（%）', label: '氧化锌原矿-水份（%）' },
      { key: '氧化锌原矿-干重（t）', label: '氧化锌原矿-干重（t）' },
      { key: '氧化锌原矿-Pb全品位（%）', label: '氧化锌原矿-Pb全品位（%）' },
      { key: '氧化锌原矿-Zn全品位（%）', label: '氧化锌原矿-Zn全品位（%）' },
      { key: '氧化锌原矿-全金属Pb（t）', label: '氧化锌原矿-全金属Pb（t）' },
      { key: '氧化锌原矿-全金属Zn（t）', label: '氧化锌原矿-全金属Zn（t）' },
      { key: '氧化锌精矿-数量（t）', label: '氧化锌精矿-数量（t）' },
      { key: '氧化锌精矿-Pb品位（%）', label: '氧化锌精矿-Pb品位（%）' },
      { key: '氧化锌精矿-Zn品位（%）', label: '氧化锌精矿-Zn品位（%）' },
      { key: '氧化锌精矿-Pb金属量（t）', label: '氧化锌精矿-Pb金属量（t）' },
      { key: '氧化锌精矿-Zn金属量（t）', label: '氧化锌精矿-Zn金属量（t）' },
      { key: '尾矿-数量（t）', label: '尾矿-数量（t）' },
      { key: '尾矿-Pb全品位（%）', label: '尾矿-Pb全品位（%）' },
      { key: '尾矿-Zn全品位（%）', label: '尾矿-Zn全品位（%）' },
      { key: '尾矿-Pb全金属（t）', label: '尾矿-Pb全金属（t）' },
      { key: '尾矿-Zn全金属（t）', label: '尾矿-Zn全金属（t）' },
      { key: '氧化矿Zn理论回收率（%）', label: '氧化矿Zn理论回收率（%）' }
    ];

    return (
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>数据详情 - {data.日期} {data.班次}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">
                {field.label}
              </Label>
              <div className="text-sm p-2 bg-muted rounded">
                {(data as any)[field.key] !== null && (data as any)[field.key] !== undefined
                  ? (data as any)[field.key]
                  : '--'
                }
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    );
  };

  // 趋势图组件
  const TrendChartComponent = ({ data, dataKey, title, unit }: {
    data: TrendDataItem[];
    dataKey: keyof AggregatedData;
    title: string;
    unit: string;
  }) => {
    const chartData = data.map(item => ({
      date: item.date.slice(5), // 只显示月-日
      金鼎: item.金鼎?.[dataKey] || 0,
      富鼎翔: item.富鼎翔?.[dataKey] || 0,
      科力: item.科力?.[dataKey] || 0
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>三个数据源对比趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="金鼎"
                type="monotone"
                stroke="var(--color-金鼎)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                dataKey="富鼎翔"
                type="monotone"
                stroke="var(--color-富鼎翔)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                dataKey="科力"
                type="monotone"
                stroke="var(--color-科力)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  // 柱状图组件
  const BarChartComponent = ({ data, title, standard }: { data: BarDataItem[]; title: string; standard: string }) => {
    if (!data || data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>按照{standard}标准</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              暂无数据
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>按照{standard}标准</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <ChartContainer config={barConfig} className="h-64 w-full">
            <BarChart
              accessibilityLayer
              data={data}
              margin={{
                top: 20,
                left: 10,
                right: 10,
                bottom: 20,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.length > 6 ? value.slice(0, 6) + '...' : value}
                fontSize={12}
                angle={data.length > 5 ? -45 : 0}
                textAnchor={data.length > 5 ? "end" : "middle"}
                height={data.length > 5 ? 60 : 30}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, props) => {
                      // 安全检查 props 和 payload 是否存在
                      if (!props || !props.payload) return [`${Number(value).toFixed(1)}`, name];
                      const item = props.payload;
                      // 始终显示真实的原始数值，不显示压缩值
                      let displayValue = value;

                      // 如果是压缩数据，使用原始数值
                      if (item.isCompressed && item.originalValue !== undefined) {
                        displayValue = item.originalValue;
                      }

                      const unit = item.unit || '';
                      // 使用统一的格式化函数：重量类保留3位，百分比类保留2位
                      const formattedValue = formatValue(displayValue, unit);
                      return [formattedValue, name];
                    }}
                  />
                }
              />
              <Bar dataKey="value" fill="var(--color-value)" radius={8}>
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value: number, entry: any) => {
                    // 先显示基本数值，确保能显示
                    if (typeof value !== 'number') return '';

                    // 始终显示真实的原始数值，不显示压缩值
                    let displayValue = value;

                    // 如果是压缩数据，使用原始数值
                    if (entry && entry.isCompressed && entry.originalValue !== undefined) {
                      displayValue = entry.originalValue;
                    }

                    // 根据单位设置小数位数
                    return entry && entry.unit === 't'
                      ? Number(displayValue).toFixed(3)
                      : Number(displayValue).toFixed(2);
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  // 初始化数据加载
  useEffect(() => {
    fetchShiftReportData(trendStartDate, trendEndDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendStartDate, trendEndDate]);

  // 监听单日详情日期变化，自动获取数据
  useEffect(() => {
    if (singleDate) {
      // 确保数据范围包含选定的单日日期
      const needsRefresh = singleDate < trendStartDate || singleDate > trendEndDate;
      if (needsRefresh) {
        const startDate = singleDate < trendStartDate ? singleDate : trendStartDate;
        const endDate = singleDate > trendEndDate ? singleDate : trendEndDate;
        fetchShiftReportData(startDate, endDate);
      }
    }
  }, [singleDate, trendStartDate, trendEndDate, fetchShiftReportData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header-2组件 */}
      <Header2 title="生产班样详情" />

      <div className="container mx-auto p-4 space-y-6">
        {/* PART1: 生产趋势总览 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>生产趋势总览</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshTrendData}
                disabled={isLoading}
                className="h-8 w-8"
                title="刷新趋势数据"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription>查看生产班报数据的时间趋势和对比分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 快捷日期选择按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange(7)}
                className="text-xs"
              >
                最近七天
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange(30)}
                className="text-xs"
              >
                最近一月
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange(180)}
                className="text-xs"
              >
                最近半年
              </Button>
            </div>

            {/* 自定义日期选择 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  起始日期
                </Label>
                <Input
                  type="date"
                  value={trendStartDate}
                  onChange={(e) => setTrendStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  结束日期
                </Label>
                <Input
                  type="date"
                  value={trendEndDate}
                  onChange={(e) => setTrendEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* 趋势图表轮播 */}
            <Carousel className="w-full">
              <CarouselContent>
                {/* 第一组：回收率数据 */}
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="recovery"
                    title="氧化矿Zn理论回收率"
                    unit="%"
                  />
                </CarouselItem>

                {/* 第二组：原矿数据 */}
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="wetWeight"
                    title="氧化锌原矿-湿重"
                    unit="t"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="moisture"
                    title="氧化锌原矿-水份"
                    unit="%"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="dryWeight"
                    title="氧化锌原矿-干重"
                    unit="t"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="pbGrade"
                    title="氧化锌原矿-Pb全品位"
                    unit="%"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="znGrade"
                    title="氧化锌原矿-Zn全品位"
                    unit="%"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="pbMetal"
                    title="氧化锌原矿-全金属Pb"
                    unit="t"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="znMetal"
                    title="氧化锌原矿-全金属Zn"
                    unit="t"
                  />
                </CarouselItem>

                {/* 第三组：精矿数据 */}
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="concentrateQuantity"
                    title="氧化锌精矿-数量"
                    unit="t"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="concentratePbGrade"
                    title="氧化锌精矿-Pb品位"
                    unit="%"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="concentrateZnGrade"
                    title="氧化锌精矿-Zn品位"
                    unit="%"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="concentratePbMetal"
                    title="氧化锌精矿-Pb金属量"
                    unit="t"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="concentrateZnMetal"
                    title="氧化锌精矿-Zn金属量"
                    unit="t"
                  />
                </CarouselItem>

                {/* 第四组：尾矿数据 */}
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="tailingQuantity"
                    title="尾矿-数量"
                    unit="t"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="tailingPbGrade"
                    title="尾矿-Pb全品位"
                    unit="%"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="tailingZnGrade"
                    title="尾矿-Zn全品位"
                    unit="%"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="tailingPbMetal"
                    title="尾矿-Pb全金属"
                    unit="t"
                  />
                </CarouselItem>
                <CarouselItem>
                  <TrendChartComponent
                    data={processTrendData()}
                    dataKey="tailingZnMetal"
                    title="尾矿-Zn全金属"
                    unit="t"
                  />
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        {/* PART2: 生产单日详情 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle>生产单日详情</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshSingleDayData}
                disabled={isLoading}
                className="h-8 w-8"
                title="刷新单日数据"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription>查看指定日期的生产班报详细数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 单日详情日期选择器 */}
            <div className="w-full md:w-1/3">
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  选择日期
                </Label>
                <Input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* 三个选项卡：金鼎、富鼎翔、科力 */}
            <Tabs value={singleDayTab} onValueChange={setSingleDayTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
                <TabsTrigger value="kl">科力数据</TabsTrigger>
              </TabsList>

              {/* 金鼎数据柱状图 */}
              <TabsContent value="jdxy" className="space-y-4">
                {(() => {
                  const [recoveryData, oreData, concentrateData, tailingData] = processSingleDayBarData('jdxy');
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <BarChartComponent data={recoveryData} title="回收率数据" standard="金鼎锌业" />
                      <BarChartComponent data={oreData} title="原矿数据" standard="金鼎锌业" />
                      <BarChartComponent data={concentrateData} title="精矿数据" standard="金鼎锌业" />
                      <BarChartComponent data={tailingData} title="尾矿数据" standard="金鼎锌业" />
                    </div>
                  );
                })()}
              </TabsContent>

              {/* 富鼎翔数据柱状图 */}
              <TabsContent value="fdx" className="space-y-4">
                {(() => {
                  const [recoveryData, oreData, concentrateData, tailingData] = processSingleDayBarData('fdx');
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <BarChartComponent data={recoveryData} title="回收率数据" standard="富鼎翔" />
                      <BarChartComponent data={oreData} title="原矿数据" standard="富鼎翔" />
                      <BarChartComponent data={concentrateData} title="精矿数据" standard="富鼎翔" />
                      <BarChartComponent data={tailingData} title="尾矿数据" standard="富鼎翔" />
                    </div>
                  );
                })()}
              </TabsContent>

              {/* 科力数据柱状图 */}
              <TabsContent value="kl" className="space-y-4">
                {(() => {
                  const [recoveryData, oreData, concentrateData, tailingData] = processSingleDayBarData('kl');
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <BarChartComponent data={recoveryData} title="回收率数据" standard="科力" />
                      <BarChartComponent data={oreData} title="原矿数据" standard="科力" />
                      <BarChartComponent data={concentrateData} title="精矿数据" standard="科力" />
                      <BarChartComponent data={tailingData} title="尾矿数据" standard="科力" />
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* PART3: 生产数据汇总 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-primary" />
                <CardTitle>生产数据汇总</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  className="text-xs"
                >
                  <Download className="h-4 w-4 mr-1" />
                  导出EXCEL
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshTableData}
                  disabled={isLoading}
                  className="h-8 w-8"
                  title="刷新表格数据"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <CardDescription>查看和管理生产班报数据记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 快捷日期选择按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTableDateRange(7)}
                className="text-xs"
              >
                最近七天
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTableDateRange(30)}
                className="text-xs"
              >
                最近一月
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTableDateRange(180)}
                className="text-xs"
              >
                最近半年
              </Button>
            </div>

            {/* 自定义日期选择 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  起始日期
                </Label>
                <Input
                  type="date"
                  value={tableStartDate}
                  onChange={(e) => setTableStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  结束日期
                </Label>
                <Input
                  type="date"
                  value={tableEndDate}
                  onChange={(e) => setTableEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* 数据表格选项卡 */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
                <TabsTrigger value="kl">科力数据</TabsTrigger>
              </TabsList>

              {/* 金鼎数据表格 */}
              <TabsContent value="jdxy" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={toggleSort}
                        >
                          日期 {sortOrder === 'desc' ? '↓' : '↑'}
                        </TableHead>
                        <TableHead>班次</TableHead>
                        <TableHead>原矿湿重(t)</TableHead>
                        <TableHead>原矿水份(%)</TableHead>
                        <TableHead>精矿数量(t)</TableHead>
                        <TableHead>Zn回收率(%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processJdxyTableData()
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((item, index) => (
                          <TableRow key={`jdxy-${item.id}-${index}`}>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DataDetailDialog data={item} />
                              </Dialog>
                            </TableCell>
                            <TableCell>{item.日期}</TableCell>
                            <TableCell>{item.班次}</TableCell>
                            <TableCell>{item['氧化锌原矿-湿重（t）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化锌原矿-水份（%）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化锌精矿-数量（t）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化矿Zn理论回收率（%）']?.toFixed(2) || '--'}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控制 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    共 {processJdxyTableData().length} 条记录，第 {currentPage} 页，共 {Math.ceil(processJdxyTableData().length / itemsPerPage)} 页
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(processJdxyTableData().length / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(processJdxyTableData().length / itemsPerPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 富鼎翔数据表格 */}
              <TabsContent value="fdx" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={toggleSort}
                        >
                          日期 {sortOrder === 'desc' ? '↓' : '↑'}
                        </TableHead>
                        <TableHead>班次</TableHead>
                        <TableHead>原矿湿重(t)</TableHead>
                        <TableHead>原矿水份(%)</TableHead>
                        <TableHead>精矿数量(t)</TableHead>
                        <TableHead>Zn回收率(%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processFdxTableData()
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((item, index) => (
                          <TableRow key={`fdx-${item.id}-${index}`}>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DataDetailDialog data={item} />
                              </Dialog>
                            </TableCell>
                            <TableCell>{item.日期}</TableCell>
                            <TableCell>{item.班次}</TableCell>
                            <TableCell>{item['氧化锌原矿-湿重（t）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化锌原矿-水份（%）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化锌精矿-数量（t）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化矿Zn理论回收率（%）']?.toFixed(2) || '--'}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控制 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    共 {processFdxTableData().length} 条记录，第 {currentPage} 页，共 {Math.ceil(processFdxTableData().length / itemsPerPage)} 页
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(processFdxTableData().length / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(processFdxTableData().length / itemsPerPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 科力数据表格 */}
              <TabsContent value="kl" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={toggleSort}
                        >
                          日期 {sortOrder === 'desc' ? '↓' : '↑'}
                        </TableHead>
                        <TableHead>班次</TableHead>
                        <TableHead>原矿湿重(t)</TableHead>
                        <TableHead>原矿水份(%)</TableHead>
                        <TableHead>精矿数量(t)</TableHead>
                        <TableHead>Zn回收率(%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processKlTableData()
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((item, index) => (
                          <TableRow key={`kl-${item.id}-${index}`}>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DataDetailDialog data={item} />
                              </Dialog>
                            </TableCell>
                            <TableCell>{item.日期}</TableCell>
                            <TableCell>{item.班次}</TableCell>
                            <TableCell>{item['氧化锌原矿-湿重（t）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化锌原矿-水份（%）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化锌精矿-数量（t）']?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item['氧化矿Zn理论回收率（%）']?.toFixed(2) || '--'}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控制 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    共 {processKlTableData().length} 条记录，第 {currentPage} 页，共 {Math.ceil(processKlTableData().length / itemsPerPage)} 页
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(processKlTableData().length / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(processKlTableData().length / itemsPerPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
