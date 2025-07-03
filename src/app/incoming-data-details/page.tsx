"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Truck, Scale, FlaskConical,
  TrendingUp, TrendingDown, BarChart3, FileText,
  Download, Search, RefreshCw, AlertTriangle,
  CheckCircle, Package, MapPin, Clock, Calendar as CalendarIcon,
  Edit, Save, X, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// Chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Label as RechartsLabel, Legend } from "recharts";

// 进厂原矿数据接口
interface IncomingRawMaterialData {
  id: string;
  计量日期: string;
  班次: string;
  湿重: number; // 湿重 (t)
  水份: number; // 水份 (%)
  Pb品位: number; // Pb品位 (%)
  Zn品位: number; // Zn品位 (%)
  发货单位: string;
  收货单位: string;
  车牌号?: string;
  备注?: string;
}

// 趋势图表数据接口
interface TrendChartData {
  date: string;
  湿重: number;
  水份: number;
  Pb品位: number;
  Zn品位: number;
}

// 单日详情数据接口
interface DailyDetailData {
  湿重: { value: number; unit: string; percentage: number };
  水份: { value: number; unit: string; percentage: number };
  Pb品位: { value: number; unit: string; percentage: number };
  Zn品位: { value: number; unit: string; percentage: number };
}

export default function IncomingDataDetailsPage() {
  const router = useRouter();

  // 日期状态管理
  const [trendStartDate, setTrendStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // 默认最近30天
    return date;
  });
  const [trendEndDate, setTrendEndDate] = useState<Date | undefined>(() => new Date());

  const [dailyDate, setDailyDate] = useState<Date | undefined>(() => new Date());

  const [tableStartDate, setTableStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 默认最近7天
    return date;
  });
  const [tableEndDate, setTableEndDate] = useState<Date | undefined>(() => new Date());

  // 数据状态管理
  const [trendData, setTrendData] = useState<{ jdxy: TrendChartData[]; fdx: TrendChartData[] }>({
    jdxy: [],
    fdx: []
  });
  const [dailyData, setDailyData] = useState<{ jdxy: DailyDetailData | null; fdx: DailyDetailData | null }>({
    jdxy: null,
    fdx: null
  });
  const [tableData, setTableData] = useState<{ jdxy: IncomingRawMaterialData[]; fdx: IncomingRawMaterialData[] }>({
    jdxy: [],
    fdx: []
  });

  // 加载状态
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  // 快速日期选择功能
  const setTrendQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTrendStartDate(start);
    setTrendEndDate(end);
  }, []);

  const setTableQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setTableStartDate(start);
    setTableEndDate(end);
  }, []);



  // 通过API获取趋势数据
  const fetchTrendDataFromSupabase = useCallback(async (startDate: Date, endDate: Date, tableName: string): Promise<TrendChartData[]> => {
    try {
      const response = await fetch('/api/incoming-data/trend-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('获取趋势数据失败:', result.message);
        return [];
      }

      const data = result.data;

      // 按日期聚合数据（如果同一天有多条记录）
      const aggregatedData: { [key: string]: TrendChartData } = {};

      data?.forEach(item => {
        const date = item.计量日期;
        if (!aggregatedData[date]) {
          aggregatedData[date] = {
            date,
            湿重: 0,
            水份: 0,
            Pb品位: 0,
            Zn品位: 0,
          };
        }

        // 累加湿重，平均其他指标
        aggregatedData[date].湿重 += item.湿重 || 0;
        aggregatedData[date].水份 = (aggregatedData[date].水份 + (item.水份 || 0)) / 2;
        aggregatedData[date].Pb品位 = (aggregatedData[date].Pb品位 + (item.Pb品位 || 0)) / 2;
        aggregatedData[date].Zn品位 = (aggregatedData[date].Zn品位 + (item.Zn品位 || 0)) / 2;
      });

      return Object.values(aggregatedData).map(item => ({
        ...item,
        湿重: Math.round(item.湿重 * 100) / 100,
        水份: Math.round(item.水份 * 100) / 100,
        Pb品位: Math.round(item.Pb品位 * 100) / 100,
        Zn品位: Math.round(item.Zn品位 * 100) / 100,
      }));
    } catch (error) {
      console.error('连接Supabase失败:', error);
      // 返回空数据，不使用模拟数据
      return [];
    }
  }, []);

  // 通过API获取单日详情数据
  const fetchDailyDataFromSupabase = useCallback(async (date: Date, tableName: string): Promise<DailyDetailData | null> => {
    try {
      const response = await fetch('/api/incoming-data/daily-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName,
          date: format(date, 'yyyy-MM-dd')
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('获取单日数据失败:', result.message);
        return null;
      }

      const data = result.data;

      if (!data || data.length === 0) {
        return null;
      }

      // 计算当日总计和平均值
      const totals = data.reduce((acc, item) => ({
        湿重: acc.湿重 + (item.湿重 || 0),
        水份: acc.水份 + (item.水份 || 0),
        Pb品位: acc.Pb品位 + (item.Pb品位 || 0),
        Zn品位: acc.Zn品位 + (item.Zn品位 || 0),
      }), { 湿重: 0, 水份: 0, Pb品位: 0, Zn品位: 0 });

      const count = data.length;

      return {
        湿重: {
          value: Math.round(totals.湿重 * 100) / 100,
          unit: 't',
          percentage: Math.min(100, Math.round((totals.湿重 / 8000) * 100)) // 湿重t：当前值/8000t × 100%
        },
        水份: {
          value: Math.round((totals.水份 / count) * 100) / 100,
          unit: '%',
          percentage: Math.min(100, Math.round(((totals.水份 / count) / 50) * 100)) // 水份：当前值/50% × 100%
        },
        Pb品位: {
          value: Math.round((totals.Pb品位 / count) * 100) / 100,
          unit: '%',
          percentage: Math.min(100, Math.round(((totals.Pb品位 / count) / 50) * 100)) // Pb品位：当前值/50% × 100%
        },
        Zn品位: {
          value: Math.round((totals.Zn品位 / count) * 100) / 100,
          unit: '%',
          percentage: Math.min(100, Math.round(((totals.Zn品位 / count) / 50) * 100)) // Zn品位：当前值/50% × 100%
        },
      };
    } catch (error) {
      console.error('连接Supabase失败:', error);
      // 返回null，不使用模拟数据
      return null;
    }
  }, []);

  // 通过API获取表格数据
  const fetchTableDataFromSupabase = useCallback(async (startDate: Date, endDate: Date, tableName: string): Promise<IncomingRawMaterialData[]> => {
    try {
      const response = await fetch('/api/incoming-data/table-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('获取表格数据失败:', result.message);
        return [];
      }

      const data = result.data;

      return data?.map(item => ({
        id: item.id?.toString() || '',
        计量日期: item.计量日期 || '',
        班次: item.班次 || '',
        湿重: item.湿重 || 0,
        水份: item.水份 || 0,
        Pb品位: item.Pb品位 || 0,
        Zn品位: item.Zn品位 || 0,
        发货单位: item.发货单位 || '',
        收货单位: item.收货单位 || '',
        车牌号: item.车牌号 || '',
        备注: item.备注 || '',
      })) || [];
    } catch (error) {
      console.error('连接Supabase失败:', error);
      // 返回空数据，不使用模拟数据
      return [];
    }
  }, []);

  // 加载趋势数据
  const loadTrendData = useCallback(async () => {
    if (!trendStartDate || !trendEndDate) return;

    setIsLoadingTrend(true);
    try {
      // 并行获取金鼎和富鼎翔数据
      const [jdxyData, fdxData] = await Promise.all([
        fetchTrendDataFromSupabase(trendStartDate, trendEndDate, '进厂原矿-JDXY'),
        fetchTrendDataFromSupabase(trendStartDate, trendEndDate, '进厂原矿-FDX')
      ]);

      setTrendData({ jdxy: jdxyData, fdx: fdxData });
    } catch (error) {
      console.error('加载趋势数据失败:', error);
      // 如果Supabase连接失败，显示空数据
      setTrendData({ jdxy: [], fdx: [] });
    } finally {
      setIsLoadingTrend(false);
    }
  }, [trendStartDate, trendEndDate, fetchTrendDataFromSupabase]);

  // 加载单日详情数据
  const loadDailyData = useCallback(async () => {
    if (!dailyDate) return;

    setIsLoadingDaily(true);
    try {
      // 并行获取金鼎和富鼎翔数据
      const [jdxyData, fdxData] = await Promise.all([
        fetchDailyDataFromSupabase(dailyDate, '进厂原矿-JDXY'),
        fetchDailyDataFromSupabase(dailyDate, '进厂原矿-FDX')
      ]);

      setDailyData({ jdxy: jdxyData, fdx: fdxData });
    } catch (error) {
      console.error('加载单日详情数据失败:', error);
      // 如果Supabase连接失败，显示空数据
      setDailyData({ jdxy: null, fdx: null });
    } finally {
      setIsLoadingDaily(false);
    }
  }, [dailyDate, fetchDailyDataFromSupabase]);

  // 加载表格数据
  const loadTableData = useCallback(async () => {
    if (!tableStartDate || !tableEndDate) return;

    setIsLoadingTable(true);
    try {
      // 并行获取金鼎和富鼎翔数据
      const [jdxyData, fdxData] = await Promise.all([
        fetchTableDataFromSupabase(tableStartDate, tableEndDate, '进厂原矿-JDXY'),
        fetchTableDataFromSupabase(tableStartDate, tableEndDate, '进厂原矿-FDX')
      ]);

      setTableData({ jdxy: jdxyData, fdx: fdxData });
    } catch (error) {
      console.error('加载表格数据失败:', error);
      // 如果Supabase连接失败，显示空数据
      setTableData({ jdxy: [], fdx: [] });
    } finally {
      setIsLoadingTable(false);
    }
  }, [tableStartDate, tableEndDate, fetchTableDataFromSupabase]);

  // 监听日期变化，自动加载数据
  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  // 图表配置
  const trendChartConfig = {
    湿重: {
      label: "湿重(t)",
      color: "var(--chart-1)",
    },
    水份: {
      label: "水份(%)",
      color: "var(--chart-2)",
    },
    Pb品位: {
      label: "Pb品位(%)",
      color: "var(--chart-3)",
    },
    Zn品位: {
      label: "Zn品位(%)",
      color: "var(--chart-4)",
    },
  } satisfies ChartConfig;

  const dailyChartConfig = {
    value: {
      label: "数值",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">进厂数据详情</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* 1. 进厂原矿趋势分析模块 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              进厂原矿趋势分析
            </CardTitle>
            <CardDescription>
              指定日期范围内的进厂原矿数据趋势变化
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 日期选择器 */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                趋势分析日期范围
              </h3>
              <div className="space-y-4">
                {/* 日期输入 */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
                    <Input
                      type="date"
                      value={trendStartDate ? trendStartDate.toISOString().split('T')[0] : ""}
                      onChange={(e) => setTrendStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
                    <Input
                      type="date"
                      value={trendEndDate ? trendEndDate.toISOString().split('T')[0] : ""}
                      onChange={(e) => setTrendEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 快速选择按钮 */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTrendQuickDateRange(7)}
                    className="text-xs"
                  >
                    最近一周
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTrendQuickDateRange(30)}
                    className="text-xs"
                  >
                    最近一月
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTrendQuickDateRange(90)}
                    className="text-xs"
                  >
                    最近三月
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTrendQuickDateRange(180)}
                    className="text-xs"
                  >
                    最近半年
                  </Button>
                </div>
              </div>
            </div>

            {/* 趋势图表选项卡 */}
            <Tabs defaultValue="jdxy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
              </TabsList>

              <TabsContent value="jdxy" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">金鼎进厂原矿趋势分析</h3>
                  {isLoadingTrend ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : (
                    <ChartContainer config={trendChartConfig} className="min-h-[400px] w-full">
                      <AreaChart
                        accessibilityLayer
                        data={trendData.jdxy}
                        margin={{
                          left: 12,
                          right: 12,
                          top: 12,
                          bottom: 12,
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
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                          dataKey="湿重"
                          type="natural"
                          fill="var(--color-湿重)"
                          fillOpacity={0.4}
                          stroke="var(--color-湿重)"
                          stackId="a"
                        />
                        <Area
                          dataKey="水份"
                          type="natural"
                          fill="var(--color-水份)"
                          fillOpacity={0.4}
                          stroke="var(--color-水份)"
                          stackId="b"
                        />
                        <Area
                          dataKey="Pb品位"
                          type="natural"
                          fill="var(--color-Pb品位)"
                          fillOpacity={0.4}
                          stroke="var(--color-Pb品位)"
                          stackId="c"
                        />
                        <Area
                          dataKey="Zn品位"
                          type="natural"
                          fill="var(--color-Zn品位)"
                          fillOpacity={0.4}
                          stroke="var(--color-Zn品位)"
                          stackId="d"
                        />
                        <Legend />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="fdx" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">富鼎翔进厂原矿趋势分析</h3>
                  {isLoadingTrend ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : (
                    <ChartContainer config={trendChartConfig} className="min-h-[400px] w-full">
                      <AreaChart
                        accessibilityLayer
                        data={trendData.fdx}
                        margin={{
                          left: 12,
                          right: 12,
                          top: 12,
                          bottom: 12,
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
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                          dataKey="湿重"
                          type="natural"
                          fill="var(--color-湿重)"
                          fillOpacity={0.4}
                          stroke="var(--color-湿重)"
                          stackId="a"
                        />
                        <Area
                          dataKey="水份"
                          type="natural"
                          fill="var(--color-水份)"
                          fillOpacity={0.4}
                          stroke="var(--color-水份)"
                          stackId="b"
                        />
                        <Area
                          dataKey="Pb品位"
                          type="natural"
                          fill="var(--color-Pb品位)"
                          fillOpacity={0.4}
                          stroke="var(--color-Pb品位)"
                          stackId="c"
                        />
                        <Area
                          dataKey="Zn品位"
                          type="natural"
                          fill="var(--color-Zn品位)"
                          fillOpacity={0.4}
                          stroke="var(--color-Zn品位)"
                          stackId="d"
                        />
                        <Legend />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 2. 进厂原矿单日详情模块 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              进厂原矿单日详情
            </CardTitle>
            <CardDescription>
              指定单日的进厂原矿详细数据分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 单日期选择器 */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                单日详情日期选择
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">选择日期</label>
                  <Input
                    type="date"
                    value={dailyDate ? dailyDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setDailyDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 单日详情选项卡 */}
            <Tabs defaultValue="jdxy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
              </TabsList>

              <TabsContent value="jdxy" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">金鼎单日详情数据分布</h3>
                  {isLoadingDaily ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : dailyData.jdxy ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 湿重 */}
                      <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                          <CardTitle className="text-sm">湿重</CardTitle>
                          <CardDescription className="text-xs">{dailyDate ? format(dailyDate, 'yyyy-MM-dd') : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                          <ChartContainer
                            config={dailyChartConfig}
                            className="mx-auto aspect-square max-h-[200px]"
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "当前值", value: dailyData.jdxy.湿重.percentage, fill: "var(--chart-1)" },
                                  { name: "剩余", value: 100 - dailyData.jdxy.湿重.percentage, fill: "var(--muted)" }
                                ]}
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
                                            {dailyData.jdxy.湿重.value}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 20}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            {dailyData.jdxy.湿重.unit}
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
                      </Card>

                      {/* 水份 */}
                      <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                          <CardTitle className="text-sm">水份</CardTitle>
                          <CardDescription className="text-xs">{dailyDate ? format(dailyDate, 'yyyy-MM-dd') : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                          <ChartContainer
                            config={dailyChartConfig}
                            className="mx-auto aspect-square max-h-[200px]"
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "当前值", value: dailyData.jdxy.水份.percentage, fill: "var(--chart-2)" },
                                  { name: "剩余", value: 100 - dailyData.jdxy.水份.percentage, fill: "var(--muted)" }
                                ]}
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
                                            {dailyData.jdxy.水份.value}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 20}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            {dailyData.jdxy.水份.unit}
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
                      </Card>

                      {/* Pb品位 */}
                      <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                          <CardTitle className="text-sm">Pb品位</CardTitle>
                          <CardDescription className="text-xs">{dailyDate ? format(dailyDate, 'yyyy-MM-dd') : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                          <ChartContainer
                            config={dailyChartConfig}
                            className="mx-auto aspect-square max-h-[200px]"
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "当前值", value: dailyData.jdxy.Pb品位.percentage, fill: "var(--chart-3)" },
                                  { name: "剩余", value: 100 - dailyData.jdxy.Pb品位.percentage, fill: "var(--muted)" }
                                ]}
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
                                            {dailyData.jdxy.Pb品位.value}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 20}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            {dailyData.jdxy.Pb品位.unit}
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
                      </Card>

                      {/* Zn品位 */}
                      <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                          <CardTitle className="text-sm">Zn品位</CardTitle>
                          <CardDescription className="text-xs">{dailyDate ? format(dailyDate, 'yyyy-MM-dd') : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                          <ChartContainer
                            config={dailyChartConfig}
                            className="mx-auto aspect-square max-h-[200px]"
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "当前值", value: dailyData.jdxy.Zn品位.percentage, fill: "var(--chart-4)" },
                                  { name: "剩余", value: 100 - dailyData.jdxy.Zn品位.percentage, fill: "var(--muted)" }
                                ]}
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
                                            {dailyData.jdxy.Zn品位.value}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 20}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            {dailyData.jdxy.Zn品位.unit}
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
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      暂无数据
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="fdx" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">富鼎翔单日详情数据分布</h3>
                  {isLoadingDaily ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : dailyData.fdx ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 湿重 */}
                      <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                          <CardTitle className="text-sm">湿重</CardTitle>
                          <CardDescription className="text-xs">{dailyDate ? format(dailyDate, 'yyyy-MM-dd') : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                          <ChartContainer
                            config={dailyChartConfig}
                            className="mx-auto aspect-square max-h-[200px]"
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "当前值", value: dailyData.fdx.湿重.percentage, fill: "var(--chart-1)" },
                                  { name: "剩余", value: 100 - dailyData.fdx.湿重.percentage, fill: "var(--muted)" }
                                ]}
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
                                            {dailyData.fdx.湿重.value}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 20}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            {dailyData.fdx.湿重.unit}
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
                      </Card>

                      {/* 水份 */}
                      <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                          <CardTitle className="text-sm">水份</CardTitle>
                          <CardDescription className="text-xs">{dailyDate ? format(dailyDate, 'yyyy-MM-dd') : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                          <ChartContainer
                            config={dailyChartConfig}
                            className="mx-auto aspect-square max-h-[200px]"
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "当前值", value: dailyData.fdx.水份.percentage, fill: "var(--chart-2)" },
                                  { name: "剩余", value: 100 - dailyData.fdx.水份.percentage, fill: "var(--muted)" }
                                ]}
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
                                            {dailyData.fdx.水份.value}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 20}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            {dailyData.fdx.水份.unit}
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
                      </Card>

                      {/* Pb品位 */}
                      <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                          <CardTitle className="text-sm">Pb品位</CardTitle>
                          <CardDescription className="text-xs">{dailyDate ? format(dailyDate, 'yyyy-MM-dd') : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                          <ChartContainer
                            config={dailyChartConfig}
                            className="mx-auto aspect-square max-h-[200px]"
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "当前值", value: dailyData.fdx.Pb品位.percentage, fill: "var(--chart-3)" },
                                  { name: "剩余", value: 100 - dailyData.fdx.Pb品位.percentage, fill: "var(--muted)" }
                                ]}
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
                                            {dailyData.fdx.Pb品位.value}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 20}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            {dailyData.fdx.Pb品位.unit}
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
                      </Card>

                      {/* Zn品位 */}
                      <Card className="flex flex-col">
                        <CardHeader className="items-center pb-0">
                          <CardTitle className="text-sm">Zn品位</CardTitle>
                          <CardDescription className="text-xs">{dailyDate ? format(dailyDate, 'yyyy-MM-dd') : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0">
                          <ChartContainer
                            config={dailyChartConfig}
                            className="mx-auto aspect-square max-h-[200px]"
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "当前值", value: dailyData.fdx.Zn品位.percentage, fill: "var(--chart-4)" },
                                  { name: "剩余", value: 100 - dailyData.fdx.Zn品位.percentage, fill: "var(--muted)" }
                                ]}
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
                                            {dailyData.fdx.Zn品位.value}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 20}
                                            className="fill-muted-foreground text-sm"
                                          >
                                            {dailyData.fdx.Zn品位.unit}
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
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      暂无数据
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 3. 进厂原矿数据表模块 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              进厂原矿数据表
            </CardTitle>
            <CardDescription>
              指定日期范围内的完整进厂原矿数据表格
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 表格日期选择器 */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                数据表日期范围
              </h3>
              <div className="space-y-4">
                {/* 日期输入 */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
                    <Input
                      type="date"
                      value={tableStartDate ? tableStartDate.toISOString().split('T')[0] : ""}
                      onChange={(e) => setTableStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
                    <Input
                      type="date"
                      value={tableEndDate ? tableEndDate.toISOString().split('T')[0] : ""}
                      onChange={(e) => setTableEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 快速选择按钮 */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTableQuickDateRange(7)}
                    className="text-xs"
                  >
                    最近一周
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTableQuickDateRange(30)}
                    className="text-xs"
                  >
                    最近一月
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTableQuickDateRange(90)}
                    className="text-xs"
                  >
                    最近三月
                  </Button>
                </div>
              </div>
            </div>

            {/* 数据表选项卡 */}
            <Tabs defaultValue="jdxy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
              </TabsList>

              <TabsContent value="jdxy" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">金鼎进厂原矿数据表</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // 导出CSV功能
                          const csvContent = "data:text/csv;charset=utf-8," +
                            "ID,计量日期,班次,湿重(t),水份(%),Pb品位(%),Zn品位(%),发货单位,收货单位,车牌号,备注\n" +
                            tableData.jdxy.map(row =>
                              `${row.id},${row.计量日期},${row.班次},${row.湿重},${row.水份},${row.Pb品位},${row.Zn品位},${row.发货单位},${row.收货单位},${row.车牌号 || ''},${row.备注 || ''}`
                            ).join("\n");

                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `金鼎进厂数据_${new Date().toISOString().split('T')[0]}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        导出CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadTableData}
                        disabled={isLoadingTable}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingTable ? 'animate-spin' : ''}`} />
                        刷新
                      </Button>
                    </div>
                  </div>

                  {/* 金鼎数据表格 */}
                  {isLoadingTable ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">ID</TableHead>
                            <TableHead className="text-center">计量日期</TableHead>
                            <TableHead className="text-center">班次</TableHead>
                            <TableHead className="text-center">湿重(t)</TableHead>
                            <TableHead className="text-center">水份(%)</TableHead>
                            <TableHead className="text-center">Pb品位(%)</TableHead>
                            <TableHead className="text-center">Zn品位(%)</TableHead>
                            <TableHead className="text-center">发货单位</TableHead>
                            <TableHead className="text-center">收货单位</TableHead>
                            <TableHead className="text-center">车牌号</TableHead>
                            <TableHead className="text-center">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.jdxy.length > 0 ? (
                            tableData.jdxy.slice(0, 10).map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="text-center font-medium">{item.id}</TableCell>
                                <TableCell className="text-center">{item.计量日期}</TableCell>
                                <TableCell className="text-center">{item.班次}</TableCell>
                                <TableCell className="text-center">{item.湿重}</TableCell>
                                <TableCell className="text-center">{item.水份}</TableCell>
                                <TableCell className="text-center">{item.Pb品位}</TableCell>
                                <TableCell className="text-center">{item.Zn品位}</TableCell>
                                <TableCell className="text-center">{item.发货单位}</TableCell>
                                <TableCell className="text-center">{item.收货单位}</TableCell>
                                <TableCell className="text-center">{item.车牌号 || '--'}</TableCell>
                                <TableCell className="text-center">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center text-muted-foreground py-4">
                                暂无数据
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="fdx" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">富鼎翔进厂原矿数据表</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // 导出CSV功能
                          const csvContent = "data:text/csv;charset=utf-8," +
                            "ID,计量日期,班次,湿重(t),水份(%),Pb品位(%),Zn品位(%),发货单位,收货单位,车牌号,备注\n" +
                            tableData.fdx.map(row =>
                              `${row.id},${row.计量日期},${row.班次},${row.湿重},${row.水份},${row.Pb品位},${row.Zn品位},${row.发货单位},${row.收货单位},${row.车牌号 || ''},${row.备注 || ''}`
                            ).join("\n");

                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `富鼎翔进厂数据_${new Date().toISOString().split('T')[0]}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        导出CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadTableData}
                        disabled={isLoadingTable}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingTable ? 'animate-spin' : ''}`} />
                        刷新
                      </Button>
                    </div>
                  </div>

                  {/* 富鼎翔数据表格 */}
                  {isLoadingTable ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">ID</TableHead>
                            <TableHead className="text-center">计量日期</TableHead>
                            <TableHead className="text-center">班次</TableHead>
                            <TableHead className="text-center">湿重(t)</TableHead>
                            <TableHead className="text-center">水份(%)</TableHead>
                            <TableHead className="text-center">Pb品位(%)</TableHead>
                            <TableHead className="text-center">Zn品位(%)</TableHead>
                            <TableHead className="text-center">发货单位</TableHead>
                            <TableHead className="text-center">收货单位</TableHead>
                            <TableHead className="text-center">车牌号</TableHead>
                            <TableHead className="text-center">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.fdx.length > 0 ? (
                            tableData.fdx.slice(0, 10).map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="text-center font-medium">{item.id}</TableCell>
                                <TableCell className="text-center">{item.计量日期}</TableCell>
                                <TableCell className="text-center">{item.班次}</TableCell>
                                <TableCell className="text-center">{item.湿重}</TableCell>
                                <TableCell className="text-center">{item.水份}</TableCell>
                                <TableCell className="text-center">{item.Pb品位}</TableCell>
                                <TableCell className="text-center">{item.Zn品位}</TableCell>
                                <TableCell className="text-center">{item.发货单位}</TableCell>
                                <TableCell className="text-center">{item.收货单位}</TableCell>
                                <TableCell className="text-center">{item.车牌号 || '--'}</TableCell>
                                <TableCell className="text-center">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center text-muted-foreground py-4">
                                暂无数据
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
