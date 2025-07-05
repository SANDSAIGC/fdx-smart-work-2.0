"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from 'date-fns';
import { Header2 } from '@/components/headers';
import {
  TrendingUp, Download, Calendar, PieChartIcon,
  RefreshCw, Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Footer } from "@/components/ui/footer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LabelList, Label as RechartsLabel } from 'recharts';

// 压滤样化验记录数据接口
interface FilterPressData {
  id: number;
  化验人员: string;
  开始时间: string;
  结束时间: string;
  水份?: number;
  铅品位?: number;
  锌品位?: number;
  备注?: string;
  created_at?: string;
  updated_at?: string;
}

// 压滤记录汇总数据接口
interface FilterPressSummaryData {
  id: number;
  日期: string;
  板数合计: number;
  操作员?: string;
  班次?: string;
  备注?: string;
  created_at?: string;
  updated_at?: string;
}

// 甜甜圈图数据接口
interface DonutDataItem {
  name: string;
  value: number;
  maxValue: number;
  unit: string;
  fill: string;
}

// 趋势图数据接口
interface TrendDataItem {
  date: string;
  水份: number | null;
  铅品位: number | null;
  锌品位: number | null;
  板数合计?: number | null;
}

export default function FilterPressDataDetailsPage() {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [filterData, setFilterData] = useState<FilterPressData[]>([]);
  const [summaryData, setSummaryData] = useState<FilterPressSummaryData[]>([]);

  // 趋势图日期范围
  const [trendStartDate, setTrendStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [trendEndDate, setTrendEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // 单日详情日期 - 设置为前两日
  const [singleDate, setSingleDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    return format(date, 'yyyy-MM-dd');
  });

  // 表格数据日期范围
  const [tableStartDate, setTableStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return format(date, 'yyyy-MM-dd');
  });
  const [tableEndDate, setTableEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

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

  // 数据获取函数
  const fetchFilterPressData = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // 获取压滤样化验记录
      const samplesResponse = await fetch('/api/filter-press-data-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dataType: 'samples'
        })
      });

      const samplesResult = await samplesResponse.json();

      if (samplesResult.success) {
        console.log('压滤样化验数据获取成功:', samplesResult.data);
        setFilterData(samplesResult.data || []);
      } else {
        console.error('压滤样化验数据获取失败:', samplesResult.error);
      }

      // 获取压滤记录汇总数据
      const summaryResponse = await fetch('/api/filter-press-data-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dataType: 'summary'
        })
      });

      const summaryResult = await summaryResponse.json();

      if (summaryResult.success) {
        console.log('压滤记录汇总数据获取成功:', summaryResult.data);
        console.log('汇总数据样本:', summaryResult.data.slice(0, 3));
        setSummaryData(summaryResult.data || []);
      } else {
        console.error('压滤记录汇总数据获取失败:', summaryResult.error);
        // 如果汇总表不存在，创建模拟数据用于演示
        setSummaryData([]);
      }
    } catch (error) {
      console.error('API调用失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 手动刷新趋势数据
  const refreshTrendData = () => {
    fetchFilterPressData(trendStartDate, trendEndDate);
  };

  // 手动刷新单日详情数据
  const refreshSingleDayData = () => {
    const startDate = singleDate < trendStartDate ? singleDate : trendStartDate;
    const endDate = singleDate > trendEndDate ? singleDate : trendEndDate;
    fetchFilterPressData(startDate, endDate);
  };

  // 手动刷新表格数据
  const refreshTableData = () => {
    const expandedStartDate = tableStartDate < trendStartDate ? tableStartDate : trendStartDate;
    const expandedEndDate = tableEndDate > trendEndDate ? tableEndDate : trendEndDate;
    fetchFilterPressData(expandedStartDate, expandedEndDate);
  };

  // 图表配置
  const chartConfig = {
    水份: {
      label: "水份",
      color: "var(--chart-1)",
    },
    铅品位: {
      label: "铅品位",
      color: "var(--chart-2)",
    },
    锌品位: {
      label: "锌品位",
      color: "var(--chart-3)",
    },
    板数合计: {
      label: "板数合计",
      color: "var(--chart-4)",
    },
  } satisfies ChartConfig;

  // 甜甜圈图配置
  const donutConfig = {
    value: {
      label: "数值",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // 处理趋势图数据
  const processTrendData = useCallback(() => {
    // 按日期分组数据
    const dateGroups = new Map();

    filterData.forEach(item => {
      if (!item.开始时间) return;
      const itemDate = new Date(item.开始时间).toISOString().split('T')[0];
      if (itemDate >= trendStartDate && itemDate <= trendEndDate) {
        if (!dateGroups.has(itemDate)) {
          dateGroups.set(itemDate, []);
        }
        dateGroups.get(itemDate).push(item);
      }
    });

    // 转换为图表数据格式
    const chartData: TrendDataItem[] = [];

    Array.from(dateGroups.keys()).sort().forEach(date => {
      const dayData = dateGroups.get(date);

      // 聚合计算
      const totals = dayData.reduce((acc: any, item: FilterPressData) => {
        if (item.水份) acc.水份 += item.水份;
        if (item.铅品位) acc.铅品位 += item.铅品位;
        if (item.锌品位) acc.锌品位 += item.锌品位;
        acc.count += 1;
        return acc;
      }, { 水份: 0, 铅品位: 0, 锌品位: 0, count: 0 });

      chartData.push({
        date,
        水份: totals.count > 0 ? totals.水份 / totals.count : null,
        铅品位: totals.count > 0 ? totals.铅品位 / totals.count : null,
        锌品位: totals.count > 0 ? totals.锌品位 / totals.count : null
      });
    });

    return chartData;
  }, [filterData, trendStartDate, trendEndDate]);

  // 处理板数合计趋势数据
  const processBoardCountTrendData = useCallback((): TrendDataItem[] => {
    // 筛选指定日期范围的汇总数据
    const filteredSummaryData = summaryData.filter(item => {
      if (!item.日期) return false;
      return item.日期 >= trendStartDate && item.日期 <= trendEndDate;
    });

    if (filteredSummaryData.length === 0) {
      return [];
    }

    // 按日期分组并聚合板数合计
    const dateGroups = new Map<string, FilterPressSummaryData[]>();
    filteredSummaryData.forEach(item => {
      const date = item.日期;
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(item);
    });

    // 转换为图表数据格式
    const chartData: TrendDataItem[] = [];

    Array.from(dateGroups.keys()).sort().forEach(date => {
      const dayData = dateGroups.get(date);

      // 聚合计算板数合计
      const totalBoards = dayData.reduce((acc, item) => {
        return acc + (item.板数合计 || 0);
      }, 0);

      chartData.push({
        date,
        水份: null,
        铅品位: null,
        锌品位: null,
        板数合计: totalBoards
      });
    });

    return chartData;
  }, [summaryData, trendStartDate, trendEndDate]);

  // 处理单日详情甜甜圈数据
  const processSingleDayData = useCallback((): DonutDataItem[] => {
    // 筛选指定日期的数据
    const dayData = filterData.filter(item => {
      if (!item.开始时间) return false;
      const itemDate = new Date(item.开始时间).toISOString().split('T')[0];
      return itemDate === singleDate;
    });

    if (dayData.length === 0) {
      return [];
    }

    // 聚合计算
    const aggregated = dayData.reduce((acc, item) => {
      if (item.水份) acc.水份 += item.水份;
      if (item.铅品位) acc.铅品位 += item.铅品位;
      if (item.锌品位) acc.锌品位 += item.锌品位;
      acc.count += 1;
      return acc;
    }, { 水份: 0, 铅品位: 0, 锌品位: 0, count: 0 });

    const result: DonutDataItem[] = [];

    if (aggregated.count > 0) {
      if (aggregated.水份 > 0) {
        result.push({
          name: '水份',
          value: aggregated.水份 / aggregated.count,
          maxValue: 50, // 统一设置最大值为50%
          unit: '%',
          fill: 'var(--chart-1)'
        });
      }

      if (aggregated.铅品位 > 0) {
        result.push({
          name: '铅品位',
          value: aggregated.铅品位 / aggregated.count,
          maxValue: 50, // 统一设置最大值为50%
          unit: '%',
          fill: 'var(--chart-2)'
        });
      }

      if (aggregated.锌品位 > 0) {
        result.push({
          name: '锌品位',
          value: aggregated.锌品位 / aggregated.count,
          maxValue: 50, // 统一设置最大值为50%
          unit: '%',
          fill: 'var(--chart-3)'
        });
      }
    }

    return result;
  }, [filterData, singleDate]);

  // 处理单日板数合计甜甜圈数据
  const processSingleDayBoardCountData = useCallback((): DonutDataItem[] => {
    // 筛选指定日期的汇总数据
    const dayData = summaryData.filter(item => {
      if (!item.日期) return false;
      return item.日期 === singleDate;
    });

    if (dayData.length === 0) {
      return [];
    }

    // 聚合计算板数合计
    const totalBoards = dayData.reduce((acc, item) => {
      return acc + (item.板数合计 || 0);
    }, 0);

    if (totalBoards > 0) {
      return [{
        name: '板数合计',
        value: totalBoards,
        maxValue: 100, // 以100板为基准值
        unit: '板',
        fill: 'var(--chart-4)'
      }];
    }

    return [];
  }, [summaryData, singleDate]);

  // 处理表格数据
  const processTableData = useCallback(() => {
    return filterData
      .filter(item => {
        if (!item.开始时间) return false;
        const itemDate = new Date(item.开始时间).toISOString().split('T')[0];
        return itemDate >= tableStartDate && itemDate <= tableEndDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.开始时间).toISOString().split('T')[0];
        const dateB = new Date(b.开始时间).toISOString().split('T')[0];
        return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      });
  }, [filterData, tableStartDate, tableEndDate, sortOrder]);

  // 导出EXCEL功能
  const exportToExcel = useCallback(() => {
    const data = processTableData();

    if (data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 创建CSV内容
    const headers = [
      '化验人员', '开始时间', '结束时间', '水份(%)', '铅品位(%)', '锌品位(%)', '备注'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.化验人员,
        item.开始时间,
        item.结束时间,
        item.水份?.toFixed(2) || '--',
        item.铅品位?.toFixed(2) || '--',
        item.锌品位?.toFixed(2) || '--',
        item.备注 || '--'
      ].join(','))
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `压滤数据详情_${tableStartDate}_${tableEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processTableData, tableStartDate, tableEndDate]);

  // 数据详情对话框组件
  const DataDetailDialog = ({ data }: { data: FilterPressData }) => {
    const fields = [
      { key: '化验人员', label: '化验人员' },
      { key: '开始时间', label: '开始时间' },
      { key: '结束时间', label: '结束时间' },
      { key: '水份', label: '水份(%)' },
      { key: '铅品位', label: '铅品位(%)' },
      { key: '锌品位', label: '锌品位(%)' },
      { key: '备注', label: '备注' }
    ];

    return (
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>数据详情 - {data.化验人员}</DialogTitle>
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
    dataKey: keyof TrendDataItem;
    title: string;
    unit: string;
  }) => {
    const chartData = data.map(item => ({
      date: item.date.slice(5), // 只显示月-日
      value: item[dataKey] || 0
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>压滤数据趋势变化</CardDescription>
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
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  // 甜甜圈图表组件 - 与进厂原矿详情页面保持一致
  const DonutChart = ({ data, standard = "压滤标准" }: { data: DonutDataItem; standard?: string }) => {
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
          <CardDescription className="text-xs">按照{standard}</CardDescription>
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
                            {data.unit === '板' ? Math.round(data.value) : data.value.toFixed(1)}
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
            当前值: {data.unit === '板' ? Math.round(data.value) : data.value.toFixed(2)}{data.unit}
          </div>
        </CardFooter>
      </Card>
    );
  };

  // 甜甜圈图组件容器
  const DonutChartComponent = ({ data, title }: {
    data: DonutDataItem[];
    title: string;
  }) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">暂无数据</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item, index) => (
          <DonutChart key={index} data={item} standard="压滤标准" />
        ))}
      </div>
    );
  };

  // 初始化数据加载
  useEffect(() => {
    fetchFilterPressData(trendStartDate, trendEndDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听单日详情日期变化，自动获取数据
  useEffect(() => {
    if (singleDate) {
      const needsRefresh = singleDate < trendStartDate || singleDate > trendEndDate;
      if (needsRefresh) {
        const startDate = singleDate < trendStartDate ? singleDate : trendStartDate;
        const endDate = singleDate > trendEndDate ? singleDate : trendEndDate;
        fetchFilterPressData(startDate, endDate);
      }
    }
  }, [singleDate, trendStartDate, trendEndDate, fetchFilterPressData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header2 title="压滤数据详情" />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* PART1: 压滤趋势总览 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">压滤趋势总览</CardTitle>
                <CardDescription>压滤数据时间序列分析</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshTrendData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日期选择器 */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="trend-start-date">开始日期</Label>
                  <Input
                    id="trend-start-date"
                    type="date"
                    value={trendStartDate}
                    onChange={(e) => setTrendStartDate(e.target.value)}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="trend-end-date">结束日期</Label>
                  <Input
                    id="trend-end-date"
                    type="date"
                    value={trendEndDate}
                    onChange={(e) => setTrendEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 快捷日期按钮 */}
              <div className="flex gap-2 flex-wrap">
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
            </div>

            {/* 趋势图轮播 */}
            <Carousel className="w-full">
              <CarouselContent>
                {[
                  { key: '板数合计' as keyof TrendDataItem, title: '板数合计趋势', unit: '板', data: processBoardCountTrendData() },
                  { key: '水份' as keyof TrendDataItem, title: '水份趋势', unit: '%', data: processTrendData() },
                  { key: '铅品位' as keyof TrendDataItem, title: '铅品位趋势', unit: '%', data: processTrendData() },
                  { key: '锌品位' as keyof TrendDataItem, title: '锌品位趋势', unit: '%', data: processTrendData() }
                ].map((chart) => (
                  <CarouselItem key={chart.key}>
                    <TrendChartComponent
                      data={chart.data}
                      dataKey={chart.key}
                      title={chart.title}
                      unit={chart.unit}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        {/* PART2: 压滤单日详情 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">压滤单日详情</CardTitle>
                <CardDescription>选定日期的压滤数据详细分析</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSingleDayData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日期选择器 */}
            <div className="flex items-center gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="single-date">选择日期</Label>
                <Input
                  id="single-date"
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                />
              </div>
            </div>

            {/* 甜甜圈图显示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 压滤样化验数据甜甜圈图 */}
              {processSingleDayData().map((item, index) => (
                <DonutChart key={`filter-${index}`} data={item} standard="压滤标准" />
              ))}

              {/* 板数合计甜甜圈图 */}
              {processSingleDayBoardCountData().map((item, index) => (
                <DonutChart key={`board-${index}`} data={item} standard="压滤标准" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PART3: 压滤数据汇总 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">压滤数据汇总</CardTitle>
                <CardDescription>压滤数据列表和详细信息</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  disabled={processTableData().length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出EXCEL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshTableData}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  刷新
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日期选择器 */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="table-start-date">开始日期</Label>
                  <Input
                    id="table-start-date"
                    type="date"
                    value={tableStartDate}
                    onChange={(e) => setTableStartDate(e.target.value)}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="table-end-date">结束日期</Label>
                  <Input
                    id="table-end-date"
                    type="date"
                    value={tableEndDate}
                    onChange={(e) => setTableEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 快捷日期按钮 */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setTableDateRange(7)}>
                  最近七天
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTableDateRange(30)}>
                  最近一月
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTableDateRange(180)}>
                  最近半年
                </Button>
              </div>
            </div>

            {/* 数据表格 */}
            <div className="overflow-x-auto">
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
                    <TableHead>化验人员</TableHead>
                    <TableHead>开始时间</TableHead>
                    <TableHead>结束时间</TableHead>
                    <TableHead>水份(%)</TableHead>
                    <TableHead>铅品位(%)</TableHead>
                    <TableHead>锌品位(%)</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const tableData = processTableData();
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedData = tableData.slice(startIndex, endIndex);

                    if (paginatedData.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            暂无数据
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                详情
                              </Button>
                            </DialogTrigger>
                            <DataDetailDialog data={item} />
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          {item.开始时间 ? new Date(item.开始时间).toLocaleDateString() : '--'}
                        </TableCell>
                        <TableCell className="font-medium">{item.化验人员}</TableCell>
                        <TableCell>
                          {item.开始时间 ? new Date(item.开始时间).toLocaleTimeString() : '--'}
                        </TableCell>
                        <TableCell>
                          {item.结束时间 ? new Date(item.结束时间).toLocaleTimeString() : '--'}
                        </TableCell>
                        <TableCell>{item.水份?.toFixed(2) || '--'}</TableCell>
                        <TableCell>{item.铅品位?.toFixed(2) || '--'}</TableCell>
                        <TableCell>{item.锌品位?.toFixed(2) || '--'}</TableCell>
                        <TableCell className="max-w-32 truncate">{item.备注 || '--'}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* 分页控制 */}
            {(() => {
              const tableData = processTableData();
              const totalPages = Math.ceil(tableData.length / itemsPerPage);

              if (totalPages <= 1) return null;

              return (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    共 {tableData.length} 条记录，第 {currentPage} 页，共 {totalPages} 页
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
