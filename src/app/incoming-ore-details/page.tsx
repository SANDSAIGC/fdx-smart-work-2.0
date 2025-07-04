"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Header2 } from '@/components/headers';
import { Footer } from '@/components/ui/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartConfig,
  ChartLegend,
  ChartLegendContent 
} from '@/components/ui/chart';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Label as RechartsLabel,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

// 类型定义
interface IncomingOreData {
  id: string;
  计量日期: string;
  进厂湿重: number;
  水份: number;
  Pb: number;
  Zn: number;
  dataSource?: 'fdx' | 'jdxy';
  [key: string]: any;
}

interface ChartDataItem {
  date: string;
  富鼎翔湿重: number;
  金鼎湿重: number;
  富鼎翔水份: number;
  金鼎水份: number;
  富鼎翔Pb: number;
  金鼎Pb: number;
  富鼎翔Zn: number;
  金鼎Zn: number;
}

interface DonutDataItem {
  name: string;
  value: number;
  fill: string;
  maxValue: number;
  unit: string;
}

export default function IncomingOreDetailsPage() {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [fdxData, setFdxData] = useState<IncomingOreData[]>([]);
  const [jdxyData, setJdxyData] = useState<IncomingOreData[]>([]);
  const [activeTab, setActiveTab] = useState('jdxy'); // 'jdxy' 或 'fdx'
  const [singleDayTab, setSingleDayTab] = useState('jdxy'); // 单日详情选项卡状态
  
  // 日期状态
  const [trendStartDate, setTrendStartDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [trendEndDate, setTrendEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [singleDate, setSingleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tableStartDate, setTableStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [tableEndDate, setTableEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // 排序状态
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 排序函数
  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // 获取最新日期并设置为默认值
  const updateSingleDateToLatest = useCallback(() => {
    if (jdxyData.length > 0) {
      const latestDate = jdxyData
        .map(item => item.计量日期)
        .sort((a, b) => b.localeCompare(a))[0];
      if (latestDate) {
        setSingleDate(latestDate);
      }
    }
  }, [jdxyData]);

  // 日期快捷选择功能 - 趋势图
  const setDateRange = (days: number) => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(new Date(Date.now() - days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    setTrendStartDate(startDate);
    setTrendEndDate(endDate);
  };

  // 日期快捷选择功能 - 数据汇总表格
  const setTableDateRange = (days: number) => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(new Date(Date.now() - days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    setTableStartDate(startDate);
    setTableEndDate(endDate);
  };

  // 手动刷新趋势数据
  const refreshTrendData = () => {
    fetchIncomingOreData(trendStartDate, trendEndDate);
  };

  // 手动刷新单日详情数据
  const refreshSingleDayData = () => {
    // 扩展数据获取范围以包含选定的单日日期
    const startDate = singleDate < trendStartDate ? singleDate : trendStartDate;
    const endDate = singleDate > trendEndDate ? singleDate : trendEndDate;
    fetchIncomingOreData(startDate, endDate);
  };

  // 手动刷新表格数据
  const refreshTableData = () => {
    // 扩展数据获取范围以包含表格所需的日期范围
    const expandedStartDate = tableStartDate < trendStartDate ? tableStartDate : trendStartDate;
    const expandedEndDate = tableEndDate > trendEndDate ? tableEndDate : trendEndDate;
    fetchIncomingOreData(expandedStartDate, expandedEndDate);
  };

  // 导出Excel功能
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

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `进厂原矿数据汇总_${dataSource}_${tableStartDate}_${tableEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 处理表格聚合数据 - 按日期聚合JDXY数据
  const processTableData = useCallback(() => {
    const aggregatedData = new Map();

    // 筛选日期范围内的JDXY数据
    const filteredData = jdxyData.filter(
      item => item.计量日期 >= tableStartDate && item.计量日期 <= tableEndDate
    );

    // 按日期聚合数据
    filteredData.forEach(item => {
      const date = item.计量日期;
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);

      if (!aggregatedData.has(date)) {
        aggregatedData.set(date, {
          计量日期: date,
          湿重总计: 0,
          水份加权总和: 0,
          Pb加权总和: 0,
          Zn加权总和: 0,
          记录数: 0,
          总重量: 0
        });
      }

      const existing = aggregatedData.get(date);
      existing.湿重总计 += wetWeight;
      existing.水份加权总和 += moisture * wetWeight; // 按重量加权
      existing.Pb加权总和 += pb * wetWeight; // 按重量加权
      existing.Zn加权总和 += zn * wetWeight; // 按重量加权
      existing.记录数 += 1;
      existing.总重量 += wetWeight;
    });

    // 计算加权平均值并格式化结果
    return Array.from(aggregatedData.values()).map(item => ({
      计量日期: item.计量日期,
      进厂湿重: item.湿重总计,
      水份: item.总重量 > 0 ? item.水份加权总和 / item.总重量 : 0,
      Pb: item.总重量 > 0 ? item.Pb加权总和 / item.总重量 : 0,
      Zn: item.总重量 > 0 ? item.Zn加权总和 / item.总重量 : 0,
      记录数: item.记录数
    })).sort((a, b) => sortOrder === 'desc' ? b.计量日期.localeCompare(a.计量日期) : a.计量日期.localeCompare(b.计量日期));
  }, [jdxyData, tableStartDate, tableEndDate, sortOrder]);

  // 处理富鼎翔表格聚合数据
  const processFdxTableData = useCallback(() => {
    const aggregatedData = new Map();

    // 筛选日期范围内的FDX数据
    const filteredData = fdxData.filter(
      item => item.计量日期 >= tableStartDate && item.计量日期 <= tableEndDate
    );



    // 按日期聚合数据
    filteredData.forEach(item => {
      const date = item.计量日期;
      const wetWeight = Number(item['进厂湿重'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);

      if (!aggregatedData.has(date)) {
        aggregatedData.set(date, {
          计量日期: date,
          湿重总计: 0,
          水份加权总和: 0,
          Pb加权总和: 0,
          Zn加权总和: 0,
          记录数: 0,
          总重量: 0
        });
      }

      const existing = aggregatedData.get(date);
      existing.湿重总计 += wetWeight;
      existing.水份加权总和 += moisture * wetWeight; // 按重量加权
      existing.Pb加权总和 += pb * wetWeight; // 按重量加权
      existing.Zn加权总和 += zn * wetWeight; // 按重量加权
      existing.记录数 += 1;
      existing.总重量 += wetWeight;
    });

    // 计算加权平均值并格式化结果
    return Array.from(aggregatedData.values()).map(item => ({
      计量日期: item.计量日期,
      进厂湿重: item.湿重总计,
      水份: item.总重量 > 0 ? item.水份加权总和 / item.总重量 : 0,
      Pb: item.总重量 > 0 ? item.Pb加权总和 / item.总重量 : 0,
      Zn: item.总重量 > 0 ? item.Zn加权总和 / item.总重量 : 0,
      记录数: item.记录数
    })).sort((a, b) => sortOrder === 'desc' ? b.计量日期.localeCompare(a.计量日期) : a.计量日期.localeCompare(b.计量日期));
  }, [fdxData, tableStartDate, tableEndDate, sortOrder]);

  // 图表配置
  const chartConfig = {
    富鼎翔: {
      label: "富鼎翔",
      color: "var(--chart-1)",
    },
    金鼎: {
      label: "金鼎",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  // 甜甜圈图表配置
  const donutConfig = {
    value: {
      label: "数值",
      color: "var(--chart-1)",
    },
    remaining: {
      label: "剩余",
      color: "var(--muted)",
    },
  } satisfies ChartConfig;

  // 获取数据的API函数
  const fetchIncomingOreData = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // 获取富鼎翔数据
      const fdxResponse = await fetch('/api/lab/fdx-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      });

      // 获取金鼎数据
      const jdxyResponse = await fetch('/api/lab/jdxy-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      });

      if (fdxResponse.ok && jdxyResponse.ok) {
        const fdxResult = await fdxResponse.json();
        const jdxyResult = await jdxyResponse.json();
        
        if (fdxResult.success && jdxyResult.success) {
          console.log('=== API数据获取成功 ===');
          console.log('富鼎翔API返回数据:', fdxResult.data.incoming);
          console.log('金鼎API返回数据:', jdxyResult.data.incoming);
          setFdxData(fdxResult.data.incoming || []);
          setJdxyData(jdxyResult.data.incoming || []);
          console.log('=== 数据设置完成 ===');
        }
      }
    } catch (error) {
      console.error('获取进厂原矿数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 处理趋势图数据 - 支持同日期多条记录聚合
  const processTrendData = useCallback((): ChartDataItem[] => {
    const dateMap = new Map<string, {
      date: string;
      富鼎翔湿重总计: number;
      富鼎翔水份加权总和: number;
      富鼎翔Pb加权总和: number;
      富鼎翔Zn加权总和: number;
      富鼎翔总重量: number;
      金鼎湿重总计: number;
      金鼎水份加权总和: number;
      金鼎Pb加权总和: number;
      金鼎Zn加权总和: number;
      金鼎总重量: number;
    }>();

    // 处理富鼎翔数据 - 按日期聚合
    fdxData.forEach(item => {
      const date = item.计量日期;
      const wetWeight = Number(item['进厂湿重'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          富鼎翔湿重总计: 0, 富鼎翔水份加权总和: 0, 富鼎翔Pb加权总和: 0, 富鼎翔Zn加权总和: 0, 富鼎翔总重量: 0,
          金鼎湿重总计: 0, 金鼎水份加权总和: 0, 金鼎Pb加权总和: 0, 金鼎Zn加权总和: 0, 金鼎总重量: 0,
        });
      }

      const existing = dateMap.get(date)!;
      existing.富鼎翔湿重总计 += wetWeight;
      existing.富鼎翔水份加权总和 += moisture * wetWeight;
      existing.富鼎翔Pb加权总和 += pb * wetWeight;
      existing.富鼎翔Zn加权总和 += zn * wetWeight;
      existing.富鼎翔总重量 += wetWeight;
    });

    // 处理金鼎数据 - 按日期聚合
    jdxyData.forEach(item => {
      const date = item.计量日期;
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          富鼎翔湿重总计: 0, 富鼎翔水份加权总和: 0, 富鼎翔Pb加权总和: 0, 富鼎翔Zn加权总和: 0, 富鼎翔总重量: 0,
          金鼎湿重总计: 0, 金鼎水份加权总和: 0, 金鼎Pb加权总和: 0, 金鼎Zn加权总和: 0, 金鼎总重量: 0,
        });
      }

      const existing = dateMap.get(date)!;
      existing.金鼎湿重总计 += wetWeight;
      existing.金鼎水份加权总和 += moisture * wetWeight;
      existing.金鼎Pb加权总和 += pb * wetWeight;
      existing.金鼎Zn加权总和 += zn * wetWeight;
      existing.金鼎总重量 += wetWeight;
    });

    // 计算最终结果
    return Array.from(dateMap.values()).map(item => ({
      date: item.date,
      富鼎翔湿重: item.富鼎翔湿重总计,
      富鼎翔水份: item.富鼎翔总重量 > 0 ? item.富鼎翔水份加权总和 / item.富鼎翔总重量 : 0,
      富鼎翔Pb: item.富鼎翔总重量 > 0 ? item.富鼎翔Pb加权总和 / item.富鼎翔总重量 : 0,
      富鼎翔Zn: item.富鼎翔总重量 > 0 ? item.富鼎翔Zn加权总和 / item.富鼎翔总重量 : 0,
      金鼎湿重: item.金鼎湿重总计,
      金鼎水份: item.金鼎总重量 > 0 ? item.金鼎水份加权总和 / item.金鼎总重量 : 0,
      金鼎Pb: item.金鼎总重量 > 0 ? item.金鼎Pb加权总和 / item.金鼎总重量 : 0,
      金鼎Zn: item.金鼎总重量 > 0 ? item.金鼎Zn加权总和 / item.金鼎总重量 : 0,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [fdxData, jdxyData]);

  // 处理单日甜甜圈数据 - 支持多条数据聚合计算
  const processSingleDayData = useCallback((): DonutDataItem[] => {
    // 筛选指定日期的所有JDXY数据
    const jdxyItems = jdxyData.filter(item => item.计量日期 === singleDate);

    if (jdxyItems.length === 0) {
      // 如果没有数据，返回默认值
      return [
        {
          name: '进厂湿重',
          value: 0,
          fill: 'var(--chart-1)',
          maxValue: 8000,
          unit: 't'
        },
        {
          name: '水份',
          value: 0,
          fill: 'var(--chart-2)',
          maxValue: 50,
          unit: '%'
        },
        {
          name: '原矿Pb品位',
          value: 0,
          fill: 'var(--chart-3)',
          maxValue: 50,
          unit: '%'
        },
        {
          name: '原矿Zn品位',
          value: 0,
          fill: 'var(--chart-4)',
          maxValue: 50,
          unit: '%'
        }
      ];
    }

    // 聚合计算：t重量值汇总，%百分比加权平均
    let totalWetWeight = 0;
    let moistureWeightedSum = 0;
    let pbWeightedSum = 0;
    let znWeightedSum = 0;
    let totalWeight = 0;

    jdxyItems.forEach(item => {
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);

      totalWetWeight += wetWeight;
      moistureWeightedSum += moisture * wetWeight; // 按重量加权
      pbWeightedSum += pb * wetWeight; // 按重量加权
      znWeightedSum += zn * wetWeight; // 按重量加权
      totalWeight += wetWeight;
    });

    // 计算加权平均值
    const avgMoisture = totalWeight > 0 ? moistureWeightedSum / totalWeight : 0;
    const avgPb = totalWeight > 0 ? pbWeightedSum / totalWeight : 0;
    const avgZn = totalWeight > 0 ? znWeightedSum / totalWeight : 0;

    return [
      {
        name: '进厂湿重',
        value: totalWetWeight,
        fill: 'var(--chart-1)',
        maxValue: 8000,
        unit: 't'
      },
      {
        name: '水份',
        value: avgMoisture,
        fill: 'var(--chart-2)',
        maxValue: 50,
        unit: '%'
      },
      {
        name: '原矿Pb品位',
        value: avgPb,
        fill: 'var(--chart-3)',
        maxValue: 50,
        unit: '%'
      },
      {
        name: '原矿Zn品位',
        value: avgZn,
        fill: 'var(--chart-4)',
        maxValue: 50,
        unit: '%'
      }
    ];
  }, [jdxyData, singleDate]);

  // 处理富鼎翔单日甜甜圈数据 - 支持多条数据聚合计算
  const processSingleDayFdxData = useCallback((): DonutDataItem[] => {
    // 筛选指定日期的所有FDX数据
    const fdxItems = fdxData.filter(item => item.计量日期 === singleDate);

    // 调试信息
    console.log('=== 富鼎翔单日数据调试 ===');
    console.log('选中日期:', singleDate);
    console.log('富鼎翔总数据条数:', fdxData.length);
    console.log('筛选后数据条数:', fdxItems.length);
    console.log('所有富鼎翔日期:', fdxData.map(item => item.计量日期));
    console.log('筛选后的数据:', fdxItems);
    if (fdxData.length > 0) {
      console.log('富鼎翔数据样本:', fdxData[0]);
    }
    console.log('=== 调试结束 ===');



    if (fdxItems.length === 0) {
      // 如果没有数据，返回默认值
      return [
        {
          name: '进厂湿重',
          value: 0,
          fill: 'var(--chart-1)',
          maxValue: 8000,
          unit: 't'
        },
        {
          name: '水份',
          value: 0,
          fill: 'var(--chart-2)',
          maxValue: 50,
          unit: '%'
        },
        {
          name: '原矿Pb品位',
          value: 0,
          fill: 'var(--chart-3)',
          maxValue: 50,
          unit: '%'
        },
        {
          name: '原矿Zn品位',
          value: 0,
          fill: 'var(--chart-4)',
          maxValue: 50,
          unit: '%'
        }
      ];
    }

    // 聚合计算：t重量值汇总，%百分比加权平均
    let totalWetWeight = 0;
    let moistureWeightedSum = 0;
    let pbWeightedSum = 0;
    let znWeightedSum = 0;
    let totalWeight = 0;

    fdxItems.forEach(item => {
      console.log('处理富鼎翔数据项:', item);
      console.log('字段检查:', {
        '进厂湿重': item['进厂湿重'],
        '湿重(t)': item['湿重(t)'],
        '水份(%)': item['水份(%)'],
        'Pb': item.Pb,
        'Zn': item.Zn
      });

      // 富鼎翔数据使用 湿重(t) 字段，如果为null则使用默认值
      const wetWeight = Number(item['湿重(t)']) || 0;
      const moisture = Number(item['水份(%)']) || 0;
      const pb = Number(item.Pb) || 0;
      const zn = Number(item.Zn) || 0;

      console.log('转换后的数值:', { wetWeight, moisture, pb, zn });

      totalWetWeight += wetWeight;
      moistureWeightedSum += moisture * wetWeight; // 按重量加权
      pbWeightedSum += pb * wetWeight; // 按重量加权
      znWeightedSum += zn * wetWeight; // 按重量加权
      totalWeight += wetWeight;
    });

    // 计算加权平均值，如果总重量为0则使用简单平均
    let avgMoisture, avgPb, avgZn;

    if (totalWeight > 0) {
      // 按重量加权平均
      avgMoisture = moistureWeightedSum / totalWeight;
      avgPb = pbWeightedSum / totalWeight;
      avgZn = znWeightedSum / totalWeight;
    } else {
      // 如果没有重量数据，使用简单平均
      const validItems = fdxItems.filter(item =>
        Number(item['水份(%)']) > 0 || Number(item.Pb) > 0 || Number(item.Zn) > 0
      );

      if (validItems.length > 0) {
        avgMoisture = validItems.reduce((sum, item) => sum + Number(item['水份(%)'] || 0), 0) / validItems.length;
        avgPb = validItems.reduce((sum, item) => sum + Number(item.Pb || 0), 0) / validItems.length;
        avgZn = validItems.reduce((sum, item) => sum + Number(item.Zn || 0), 0) / validItems.length;
      } else {
        avgMoisture = avgPb = avgZn = 0;
      }
    }

    return [
      {
        name: '进厂湿重',
        value: totalWetWeight,
        fill: 'var(--chart-1)',
        maxValue: 8000,
        unit: 't'
      },
      {
        name: '水份',
        value: avgMoisture,
        fill: 'var(--chart-2)',
        maxValue: 50,
        unit: '%'
      },
      {
        name: '原矿Pb品位',
        value: avgPb,
        fill: 'var(--chart-3)',
        maxValue: 50,
        unit: '%'
      },
      {
        name: '原矿Zn品位',
        value: avgZn,
        fill: 'var(--chart-4)',
        maxValue: 50,
        unit: '%'
      }
    ];
  }, [fdxData, singleDate]);

  // 甜甜圈图表组件 - 与boss页面保持一致
  const DonutChart = ({ data, standard = "金鼎锌业" }: { data: DonutDataItem; standard?: string }) => {
    // 计算百分比和图表数据
    const chartData = React.useMemo(() => {
      const currentPercentage = Math.min((data.value / data.maxValue) * 100, 100);

      // 创建图表数据 - 悬浮显示实际数值，图表显示百分比
      const segments = [
        {
          name: "当前值",
          value: currentPercentage,
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

      return segments;
    }, [data]);

    // 自定义tooltip内容，显示实际数值而不是百分比
    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (data.name === "当前值" && data.actualValue !== undefined) {
          return (
            <div className="rounded-lg border bg-background p-2 shadow-md">
              <div className="grid gap-2">
                <div className="flex flex-col">
                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                    {data.name}
                  </span>
                  <span className="font-bold text-muted-foreground">
                    {data.actualValue.toFixed(2)}{data.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        }
      }
      return null;
    };

    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-sm">{data.name}</CardTitle>
          <CardDescription className="text-xs">按照{standard}标准</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={donutConfig}
            className="mx-auto aspect-square max-h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<CustomTooltip />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                strokeWidth={5}
              >
                <RechartsLabel
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {data.value.toFixed(1)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-sm"
                          >
                            {data.unit}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 pt-4">
          <div className="text-sm font-medium text-center">
            当前: {data.value.toFixed(2)}{data.unit}
          </div>
        </CardFooter>
      </Card>
    );
  };



  // 初始化数据加载
  useEffect(() => {
    fetchIncomingOreData(trendStartDate, trendEndDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);





  return (
    <div className="min-h-screen bg-background">
      {/* Header-2组件 */}
      <Header2 title="进厂原矿详情" />

      <div className="container mx-auto p-4 space-y-6">
        {/* PART1: 进厂趋势总览 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>进厂趋势总览</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshTrendData}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription>查看指定时间范围内的进厂原矿趋势变化</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日期范围选择器 */}
            <div className="space-y-4">
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
            </div>

            {/* 趋势图Carousel - 单列显示 */}
            <Carousel className="w-full">
              <CarouselContent>
                {/* 进厂湿重趋势图 */}
                <CarouselItem className="w-full">
                  <Card className="w-full">
                    <CardHeader className="pb-2 text-left">
                      <CardTitle className="text-lg text-left">进厂湿重</CardTitle>
                      <CardDescription className="text-sm text-left">单位: t</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full">
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={processTrendData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(5)}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent payload={[]} />} />
                          <Line
                            type="monotone"
                            dataKey="金鼎湿重"
                            stroke="var(--color-金鼎)"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* 水份趋势图 */}
                <CarouselItem className="w-full">
                  <Card className="w-full">
                    <CardHeader className="pb-2 text-left">
                      <CardTitle className="text-lg text-left">水份</CardTitle>
                      <CardDescription className="text-sm text-left">单位: %</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full">
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={processTrendData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(5)}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent payload={[]} />} />
                          <Line
                            type="monotone"
                            dataKey="富鼎翔水份"
                            stroke="var(--color-富鼎翔)"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="金鼎水份"
                            stroke="var(--color-金鼎)"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* 原矿Pb品位趋势图 */}
                <CarouselItem className="w-full">
                  <Card className="w-full">
                    <CardHeader className="pb-2 text-left">
                      <CardTitle className="text-lg text-left">原矿Pb品位</CardTitle>
                      <CardDescription className="text-sm text-left">单位: %</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full">
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={processTrendData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(5)}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent payload={[]} />} />
                          <Line
                            type="monotone"
                            dataKey="富鼎翔Pb"
                            stroke="var(--color-富鼎翔)"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="金鼎Pb"
                            stroke="var(--color-金鼎)"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* 原矿Zn品位趋势图 */}
                <CarouselItem className="w-full">
                  <Card className="w-full">
                    <CardHeader className="pb-2 text-left">
                      <CardTitle className="text-lg text-left">原矿Zn品位</CardTitle>
                      <CardDescription className="text-sm text-left">单位: %</CardDescription>
                    </CardHeader>
                    <CardContent className="w-full">
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={processTrendData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(5)}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent payload={[]} />} />
                          <Line
                            type="monotone"
                            dataKey="富鼎翔Zn"
                            stroke="var(--color-富鼎翔)"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="金鼎Zn"
                            stroke="var(--color-金鼎)"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm">
                      <div className="flex gap-2 leading-none font-medium">
                        趋势分析 <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="text-muted-foreground leading-none">
                        显示最近时间段的进厂原矿数据变化趋势
                      </div>
                    </CardFooter>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        {/* PART2: 进厂单日详情 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle>进厂单日详情</CardTitle>
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
            <CardDescription>查看指定日期的进厂原矿详细数据</CardDescription>
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
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setSingleDate(newDate);
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* 选项卡 */}
            <Tabs value={singleDayTab} onValueChange={setSingleDayTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
              </TabsList>

              {/* 金鼎数据选项卡 */}
              <TabsContent value="jdxy" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {processSingleDayData().map((item, index) => (
                    <DonutChart key={`jdxy-${index}`} data={item} standard="金鼎锌业" />
                  ))}
                </div>
              </TabsContent>

              {/* 富鼎翔数据选项卡 */}
              <TabsContent value="fdx" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    console.log('富鼎翔选项卡渲染中...');
                    const data = processSingleDayFdxData();
                    console.log('富鼎翔甜甜圈数据:', data);
                    return data.map((item, index) => (
                      <DonutChart key={`fdx-${index}`} data={item} standard="富鼎翔" />
                    ));
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* PART3: 进厂数据汇总 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="h-5 w-5 text-primary" />
                <CardTitle>进厂数据汇总</CardTitle>
              </div>
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
            <CardDescription>查看和管理进厂原矿数据记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日期范围选择器 */}
            <div className="space-y-4">
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
            </div>

            {/* 选项卡 */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
              </TabsList>

              {/* 金鼎数据选项卡 */}
              <TabsContent value="jdxy" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={toggleSort}
                        >
                          日期 {sortOrder === 'desc' ? '↓' : '↑'}
                        </TableHead>
                        <TableHead>进厂湿重(t)</TableHead>
                        <TableHead>水份(%)</TableHead>
                        <TableHead>原矿Pb品位(%)</TableHead>
                        <TableHead>原矿Zn品位(%)</TableHead>
                        <TableHead>记录数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processTableData().map((item, index) => (
                        <TableRow key={`jdxy-aggregated-${item.计量日期}-${index}`}>
                          <TableCell>{item.计量日期}</TableCell>
                          <TableCell>{item.进厂湿重.toFixed(2)}</TableCell>
                          <TableCell>{item.水份.toFixed(2)}</TableCell>
                          <TableCell>{item.Pb.toFixed(2)}</TableCell>
                          <TableCell>{item.Zn.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.记录数}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* 富鼎翔数据选项卡 */}
              <TabsContent value="fdx" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={toggleSort}
                        >
                          日期 {sortOrder === 'desc' ? '↓' : '↑'}
                        </TableHead>
                        <TableHead>进厂湿重(t)</TableHead>
                        <TableHead>水份(%)</TableHead>
                        <TableHead>原矿Pb品位(%)</TableHead>
                        <TableHead>原矿Zn品位(%)</TableHead>
                        <TableHead>记录数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processFdxTableData().map((item, index) => (
                        <TableRow key={`fdx-aggregated-${item.计量日期}-${index}`}>
                          <TableCell>{item.计量日期}</TableCell>
                          <TableCell>{item.进厂湿重.toFixed(2)}</TableCell>
                          <TableCell>{item.水份.toFixed(2)}</TableCell>
                          <TableCell>{item.Pb.toFixed(2)}</TableCell>
                          <TableCell>{item.Zn.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.记录数}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>

            {/* 导出按钮 */}
            <div className="flex justify-end">
              <Button
                onClick={exportToExcel}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                导出表格
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Footer组件 */}
      <Footer />
    </div>
  );
}
