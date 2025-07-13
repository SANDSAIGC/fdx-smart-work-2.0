"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Bell, CalendarCheck, Shield,
  FileChartLine, FileImage, FileOutput,
  Gauge, Wrench, ShoppingCart, Bot,
  TrendingUp, BarChart3, DollarSign,
  Activity, Target, Award, Zap, Factory, Package,
  RefreshCw, TestTube, Truck, Beaker, Users, Building, Filter, Settings, CheckCircle, Calendar, FileInput
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartStyle } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Label as RechartsLabel, Sector, LineChart, Line, LabelList } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginatedTable } from "@/components/ui/paginated-table";

import { ThemeToggle } from "@/components/theme-toggle";
import ProductionDataChart from "@/components/charts/ProductionDataChart";
import { BossHamburgerMenu } from "@/components/boss-hamburger-menu";
import { Footer } from "@/components/ui/footer";
import DataVs1 from "@/components/data-vs-1";
import DataVsFuke from "@/components/data-vs-fuke";
import { formatValue, formatWeight, formatPercentage, formatChartValue } from "@/lib/formatters";

// 类型定义
interface ManagementModule {
  icon: React.ReactNode;
  label: string;
  path: string;
  description: string;
  status?: "active" | "development" | "completed";
}

interface BusinessMetric {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
  color: string;
}



interface ProductionCycle {
  id: string;
  name: string;
  dateRange: string;
}

export default function BossPage() {
  const router = useRouter();

  // 周期核心生产指标数据状态
  const [coreProductionData, setCoreProductionData] = useState([
    { indicator: "原矿干重处理量", value: 0, unit: "t", fill: "var(--color-processing)" },
    { indicator: "Zn精矿平均品位", value: 0, unit: "%", fill: "var(--color-grade)" },
    { indicator: "金属产出量", value: 0, unit: "t", fill: "var(--color-output)" },
    { indicator: "回收率", value: 0, unit: "%", fill: "var(--color-recovery)" },
  ]);

  // 生产计划数据状态 - 恢复达标与否判定组件
  const [productionPlan, setProductionPlan] = useState({
    原矿干重处理量t: 0,
    产出精矿Zn品位: 0,
    产出精矿Zn金属量t: 0,
    回收率: 0,
  });

  const [isLoadingCoreProduction, setIsLoadingCoreProduction] = useState(false);
  const [coreProductionError, setCoreProductionError] = useState<string | null>(null);

  // 状态管理
  const [productionRate, setProductionRate] = useState(72);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState("全部周期");
  const [activeTab, setActiveTab] = useState("原料累计");

  // 数据对比相关状态 - 默认为全部周期的日期范围
  const [comparisonStartDate, setComparisonStartDate] = useState<Date | undefined>(() => {
    // 全部周期开始日期：2025年4月26日
    return new Date('2025-04-26');
  });
  const [comparisonEndDate, setComparisonEndDate] = useState<Date | undefined>(new Date());
  const [isRefreshingComparison, setIsRefreshingComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>({
    incoming: [],
    outgoing: [],
    production: []
  });

  // 数据对比分析生产周期状态
  const [comparisonSelectedCycle, setComparisonSelectedCycle] = useState("全部周期");

  // 动态生产周期配置
  const [productionCycles, setProductionCycles] = useState<string[]>([]);
  const [isLoadingCycles, setIsLoadingCycles] = useState(false);

  // 图表配置 - 移动端优化版本
  const chartConfig = {
    value: {
      label: "数值",
    },
    富鼎翔: {
      label: "富鼎翔",
      color: "hsl(var(--chart-1))",
    },
    金鼎锌业: {
      label: "金鼎锌业",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // 原料累计数据状态 - 从空数据开始，只显示真实数据
  const [rawMaterialData, setRawMaterialData] = useState<any[]>([]);
  const [isLoadingRawMaterial, setIsLoadingRawMaterial] = useState(false);
  const [rawMaterialError, setRawMaterialError] = useState<string | null>(null);

  // 产品累计数据状态 - 真实数据
  const [productData, setProductData] = useState<any[]>([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);





  // 核心生产指标图表配置
  const coreProductionConfig = {
    processing: {
      label: "原矿干重处理量",
      color: "var(--chart-1)",
    },
    grade: {
      label: "Zn精矿平均品位",
      color: "var(--chart-2)",
    },
    output: {
      label: "金属产出量",
      color: "var(--chart-3)",
    },
    recovery: {
      label: "回收率",
      color: "var(--chart-4)",
    },
  } satisfies ChartConfig;

  // 数据对比图表配置
  const comparisonChartConfig = {
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
    jinding_weight: {
      label: "金鼎重量",
      color: "var(--chart-1)",
    },
    fudingxiang_weight: {
      label: "富鼎翔重量",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;



  // 专项数据明细配置
  const dataDetailModules = [
    {
      icon: <FileInput className="h-6 w-6" />,
      label: "进厂数据",
      path: "/incoming-ore-details",
      description: "进厂原矿数据详情",
      color: "blue"
    },
    {
      icon: <FileChartLine className="h-6 w-6" />,
      label: "生产数据",
      path: "/shift-report-details",
      description: "生产过程数据监控",
      color: "green"
    },
    {
      icon: <FileOutput className="h-6 w-6" />,
      label: "出厂数据",
      path: "/outgoing-concentrate-details",
      description: "产品出厂数据",
      color: "orange"
    },
    {
      icon: <FileImage className="h-6 w-6" />,
      label: "压滤数据",
      path: "/filter-press-data-details",
      description: "压滤工艺数据",
      color: "purple"
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      label: "生产质量",
      path: "/concentration-fineness-monitor",
      description: "生产质量数据中心",
      color: "indigo"
    },
    {
      icon: <Wrench className="h-6 w-6" />,
      label: "机器设备",
      path: "/machine-running-details",
      description: "设备运行状态",
      color: "red"
    }
  ];

  // 业务指标数据
  const businessMetrics: BusinessMetric[] = [
    {
      title: "月度营收",
      value: "¥2,847万",
      change: "+15.3%",
      trend: "up",
      icon: <DollarSign className="h-4 w-4" />,
      color: "text-green-600"
    },
    {
      title: "生产效率",
      value: "87.2%",
      change: "+5.1%",
      trend: "up", 
      icon: <Activity className="h-4 w-4" />,
      color: "text-blue-600"
    },
    {
      title: "员工满意度",
      value: "94.5%",
      change: "+2.3%",
      trend: "up",
      icon: <Users className="h-4 w-4" />,
      color: "text-purple-600"
    },
    {
      title: "质量达标率",
      value: "98.7%",
      change: "-0.2%",
      trend: "down",
      icon: <Target className="h-4 w-4" />,
      color: "text-orange-600"
    }
  ];

  // 获取趋势颜色
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      case "stable": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  // 获取生产周期列表
  const fetchProductionCycles = React.useCallback(async () => {
    setIsLoadingCycles(true);
    try {
      const response = await fetch('/api/boss/production-cycles');
      const result = await response.json();

      if (result.success) {
        setProductionCycles(result.data);
        // 如果当前选择的周期不在列表中，设置为第一个
        if (!result.data.includes(selectedCycle)) {
          setSelectedCycle(result.data[0] || '全部周期');
        }
      } else {
        console.error('获取生产周期失败:', result.message);
      }
    } catch (error) {
      console.error('获取生产周期失败:', error);
    } finally {
      setIsLoadingCycles(false);
    }
  }, [selectedCycle]);

  // 获取当前选中周期的日期范围
  const getCurrentCycleDateRange = () => {
    if (selectedCycle === '全部周期') {
      return "所有周期聚合数据";
    }
    // 简单的日期范围解析
    const match = selectedCycle.match(/（(.+?)）/);
    return match ? match[1] : "未知日期范围";
  };

  // 通过API获取原料累计数据（带重试机制）
  const fetchRawMaterialData = React.useCallback(async (cycle: string, retryCount = 0) => {
    setIsLoadingRawMaterial(true);
    setRawMaterialError(null);
    try {
      const response = await fetch('/api/boss/raw-material-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cycle }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('获取原料累计数据失败:', result.message);
        setRawMaterialError(result.message || '无法获取原料累计数据');
        setRawMaterialData([]);
        return;
      }

      // 构建图表数据
      const fdxData = result.data.fdx;
      const jdxyData = result.data.jdxy;

      // 使用智能字段映射构建图表数据
      const newRawMaterialData = [
        { parameter: "期初库存", company: "富鼎翔", value: fdxData?.期初库存 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "期初库存", company: "金鼎锌业", value: jdxyData?.期初库存 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "周期倒入量", company: "富鼎翔", value: fdxData?.周期倒入量 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "周期倒入量", company: "金鼎锌业", value: jdxyData?.周期倒入量 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "周期消耗量", company: "富鼎翔", value: fdxData?.周期消耗量 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "周期消耗量", company: "金鼎锌业", value: jdxyData?.周期消耗量 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "期末有效库存", company: "富鼎翔", value: fdxData?.期末有效库存 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "期末有效库存", company: "金鼎锌业", value: jdxyData?.期末有效库存 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "矿仓底部库存", company: "富鼎翔", value: fdxData?.矿仓底部库存 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "矿仓底部库存", company: "金鼎锌业", value: jdxyData?.矿仓底部库存 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "期末总库存", company: "富鼎翔", value: fdxData?.期末总库存 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "期末总库存", company: "金鼎锌业", value: jdxyData?.期末总库存 || 0, fill: "var(--color-金鼎锌业)" },
      ];

      setRawMaterialData(newRawMaterialData);
      setRawMaterialError(null);
    } catch (error) {
      console.error('连接Supabase失败:', error);

      // 重试机制：最多重试2次
      if (retryCount < 2) {
        console.log(`原料累计数据获取失败，正在重试... (${retryCount + 1}/2)`);
        setTimeout(() => {
          fetchRawMaterialData(cycle, retryCount + 1);
        }, 2000); // 2秒后重试
        return;
      }

      setRawMaterialError('连接数据库失败，请检查网络连接');
      setRawMaterialData([]);
    } finally {
      setIsLoadingRawMaterial(false); // 总是设置loading状态为false
    }
  }, []);

  // 通过API获取核心生产指标数据
  const fetchCoreProductionData = React.useCallback(async (cycle: string) => {
    setIsLoadingCoreProduction(true);
    setCoreProductionError(null);
    try {
      const response = await fetch('/api/boss/core-production-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cycle }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('获取核心生产数据失败:', result.message);
        setCoreProductionError(result.message || '无法获取核心生产数据');
        setCoreProductionData([]);
        return;
      }

      // 构建核心生产指标数据 - 使用API返回的真实数据
      const actualData = result.data.actual;
      const planData = result.data.plan;

      // 设置生产计划数据
      setProductionPlan({
        原矿干重处理量t: planData.原矿干重处理量t || 0,
        产出精矿Zn品位: planData.产出精矿Zn品位 || 0,
        产出精矿Zn金属量t: planData.产出精矿Zn金属量t || 0,
        回收率: planData.回收率 || 0,
      });

      const actualCurrentData = [
        {
          indicator: "原矿干重处理量",
          value: parseFloat((actualData.原矿干重处理量 || 0).toFixed(3)),
          unit: "t",
          fill: "var(--color-processing)"
        },
        {
          indicator: "Zn精矿平均品位",
          value: parseFloat((actualData.Zn精矿平均品位 || 0).toFixed(2)),
          unit: "%",
          fill: "var(--color-grade)"
        },
        {
          indicator: "金属产出量",
          value: parseFloat((actualData.金属产出量 || 0).toFixed(3)),
          unit: "t",
          fill: "var(--color-output)"
        },
        {
          indicator: "回收率",
          value: parseFloat((actualData.回收率 || 0).toFixed(2)),
          unit: "%",
          fill: "var(--color-recovery)"
        },
      ];

      setCoreProductionData(actualCurrentData);
      setCoreProductionError(null);
    } catch (error) {
      console.error('获取核心生产数据失败:', error);
      setCoreProductionError('获取核心生产数据失败，请检查网络连接');
      setCoreProductionData([]);
    } finally {
      setIsLoadingCoreProduction(false);
    }
  }, []);

  // 通过API获取产品累计数据（带重试机制）
  const fetchProductData = React.useCallback(async (cycle: string, retryCount = 0) => {
    setIsLoadingProduct(true);
    setProductError(null);
    try {
      const response = await fetch('/api/boss/product-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cycle }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('获取产品数据失败:', result.message);
        setProductError(result.message || '无法获取产品数据');
        setProductData([]);
        return;
      }

      // 构建图表数据 - 基于API返回的标准化产品累计数据
      const data = result.data;
      const fdxData = data.fdx;
      const jdxyData = data.jdxy;

      const newProductData = [
        { parameter: "期初库存", company: "富鼎翔", value: fdxData?.期初库存 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "期初库存", company: "金鼎锌业", value: jdxyData?.期初库存 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "周期产量", company: "富鼎翔", value: fdxData?.周期产量 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "周期产量", company: "金鼎锌业", value: jdxyData?.周期产量 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "周期出厂量", company: "富鼎翔", value: fdxData?.周期出厂量 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "周期出厂量", company: "金鼎锌业", value: jdxyData?.周期出厂量 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "期末有效库存", company: "富鼎翔", value: fdxData?.期末有效库存 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "期末有效库存", company: "金鼎锌业", value: jdxyData?.期末有效库存 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "期末总库存", company: "富鼎翔", value: fdxData?.期末总库存 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "期末总库存", company: "金鼎锌业", value: jdxyData?.期末总库存 || 0, fill: "var(--color-金鼎锌业)" },
      ];

      setProductData(newProductData);
      setProductError(null);
    } catch (error) {
      console.error('获取产品数据失败:', error);

      // 重试机制：最多重试2次
      if (retryCount < 2) {
        console.log(`产品数据获取失败，正在重试... (${retryCount + 1}/2)`);
        setTimeout(() => {
          fetchProductData(cycle, retryCount + 1);
        }, 2000); // 2秒后重试
        return;
      }

      setProductError('获取产品数据时发生异常');
      setProductData([]);
    } finally {
      setIsLoadingProduct(false); // 总是设置loading状态为false
    }
  }, []);

  // 移除重复的useEffect，避免数据竞争

  // 数据对比图表组件
  const ComparisonChart = ({ data, title, description, lines, trendText = "数据趋势稳定" }: {
    data: any[],
    title: string,
    description: string,
    lines: { dataKey: string }[],
    trendText?: string
  }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={comparisonChartConfig}>
            <LineChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
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
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            {trendText} <TrendingUp className="h-4 w-4" />
          </div>
        </CardFooter>
      </Card>
    );
  };

  // 数据对比分析专用快速日期选择功能
  const setComparisonQuickDateRange = React.useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setComparisonStartDate(start);
    setComparisonEndDate(end);
  }, []);

  // 根据生产周期获取日期范围并自动同步
  const syncComparisonDatesByCycle = React.useCallback(async (cycle: string) => {
    try {
      const response = await fetch(`/api/boss/production-cycle-dates?cycle=${encodeURIComponent(cycle)}`);
      const result = await response.json();

      if (result.success) {
        const startDate = new Date(result.data.startDate);
        const endDate = new Date(result.data.endDate);
        setComparisonStartDate(startDate);
        setComparisonEndDate(endDate);
        console.log(`🔄 [数据对比分析] 生产周期 "${cycle}" 日期范围已同步:`, result.data.startDate, '至', result.data.endDate);
      } else {
        console.error('获取生产周期日期范围失败:', result.message);
      }
    } catch (error) {
      console.error('同步生产周期日期失败:', error);
    }
  }, []);

  // 处理数据对比分析生产周期变更 - 临时版本，稍后会重新定义
  const handleComparisonCycleChange = React.useCallback(async (cycle: string) => {
    console.log(`🔄 [数据对比分析] 生产周期变更为: ${cycle}`);
    setComparisonSelectedCycle(cycle);

    // 先同步日期范围
    await syncComparisonDatesByCycle(cycle);
  }, [syncComparisonDatesByCycle]);

  // 生成模拟图表数据
  const generateMockChartData = React.useCallback(() => {
    const generateDateRange = (days: number) => {
      const data = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // 使用确定性的数据而不是随机数（避免Hydration错误）
        const dayIndex = i % 7; // 使用日期索引生成确定性变化
        data.push({
          date: date.toISOString().split('T')[0],
          jinding_grade: 45 + (dayIndex * 1.4),
          fudingxiang_grade: 43 + (dayIndex * 1.7),
          jinding_moisture: 6 + (dayIndex * 0.3),
          fudingxiang_moisture: 5.5 + (dayIndex * 0.35),
          jinding_day_moisture: 6.2 + (dayIndex * 0.2),
          jinding_night_moisture: 6.0 + (dayIndex * 0.25),
          fudingxiang_day_moisture: 5.8 + (dayIndex * 0.28),
          fudingxiang_night_moisture: 5.6 + (dayIndex * 0.31),
          jinding_weight: 25 + (dayIndex * 1.4),
          fudingxiang_weight: 23 + (dayIndex * 1.7),
          internal_grade: 44 + (dayIndex * 1.5),
          internal_moisture: 5.8 + (dayIndex * 0.32),
        });
      }
      return data;
    };

    const mockData = generateDateRange(7);
    return {
      incoming: { gradeAndMoisture: mockData },
      production: { originalOre: mockData },
      outgoing: { gradeAndMoisture: mockData, weightAndMetal: mockData }
    };
  }, []);



  // 刷新数据对比分析数据 - 使用真实API
  const refreshComparisonData = React.useCallback(async () => {
    setIsRefreshingComparison(true);
    try {
      // 使用当前选择的日期范围，如果没有则使用默认值（最近一周）
      let startDate = comparisonStartDate;
      let endDate = comparisonEndDate;

      if (!startDate || !endDate) {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
      }

      console.log(`🔄 [数据对比分析API] 使用日期范围:`, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        selectedCycle: comparisonSelectedCycle
      });

      // 调用真实API获取对比数据
      const response = await fetch('/api/lab/comparison-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const apiData = result.data || { incoming: [], outgoing: [], production: [] };

      console.log('🔄 [API调用] 获取到的数据:', {
        incoming: apiData.incoming?.length || 0,
        outgoing: apiData.outgoing?.length || 0,
        production: apiData.production?.length || 0
      });
      console.log('🔄 [API调用] 详细数据:', apiData);

      // 检查数据样本
      if (apiData.incoming?.length > 0) {
        console.log('🔄 [API调用] 进厂数据样本:', apiData.incoming[0]);
      }
      if (apiData.production?.length > 0) {
        console.log('🔄 [API调用] 生产数据样本:', apiData.production[0]);
      }
      if (apiData.outgoing?.length > 0) {
        console.log('🔄 [API调用] 出厂数据样本:', apiData.outgoing[0]);
      }

      setComparisonData(apiData);
    } catch (error) {
      console.error('刷新数据对比分析数据失败:', error);

      // 如果API失败，使用空数据
      setComparisonData({ incoming: [], outgoing: [], production: [] });
    } finally {
      setIsRefreshingComparison(false);
    }
  }, [comparisonStartDate, comparisonEndDate, comparisonSelectedCycle]);

  // 重新定义处理数据对比分析生产周期变更函数（在refreshComparisonData定义之后）
  const handleComparisonCycleChangeWithRefresh = React.useCallback(async (cycle: string) => {
    console.log(`🔄 [数据对比分析] 生产周期变更为: ${cycle}`);
    setComparisonSelectedCycle(cycle);

    // 先同步日期范围
    await syncComparisonDatesByCycle(cycle);

    // 然后刷新数据对比分析数据
    console.log(`🔄 [数据对比分析] 开始刷新数据...`);
    await refreshComparisonData();
  }, [syncComparisonDatesByCycle, refreshComparisonData]);

  // 客户端初始化数据（避免Hydration错误）
  useEffect(() => {
    // 初始化时自动获取对比数据
    refreshComparisonData();
  }, [refreshComparisonData]);

  // 监听日期范围变化，自动刷新数据对比分析数据
  useEffect(() => {
    if (comparisonStartDate && comparisonEndDate) {
      console.log(`🔄 [数据对比分析] 日期范围变化，自动刷新数据:`, {
        startDate: comparisonStartDate.toISOString().split('T')[0],
        endDate: comparisonEndDate.toISOString().split('T')[0]
      });
      refreshComparisonData();
    }
  }, [comparisonStartDate, comparisonEndDate]);

  // 单个Donut图表组件 - 优化版本
  const DonutChart = ({ data, title }: {
    data: { indicator: string; value: number; unit: string; fill: string },
    title: string
  }) => {
    // 计算百分比和图表数据
    const { percentage, chartData } = React.useMemo(() => {
      let maxValue = 100;
      let currentPercentage = 0;

      // 根据指标类型设置最大值和计算百分比
      switch (data.indicator) {
        case "原矿干重处理量":
          maxValue = productionPlan.原矿干重处理量t || 20000; // 使用计划处理量作为最大值
          currentPercentage = (data.value / maxValue) * 100;
          break;
        case "Zn精矿平均品位":
          maxValue = 50; // 50%
          currentPercentage = (data.value / maxValue) * 100;
          break;
        case "金属产出量":
          maxValue = productionPlan.产出精矿Zn金属量t || 10000; // 使用计划产出量作为最大值
          currentPercentage = (data.value / maxValue) * 100;
          break;
        case "回收率":
          maxValue = 100; // 100%
          currentPercentage = (data.value / maxValue) * 100;
          break;
        default:
          currentPercentage = data.value;
      }

      // 创建图表数据 - 悬浮显示实际数值，图表显示百分比
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

      return { percentage: currentPercentage, chartData: segments };
    }, [data, productionPlan]);

    // 根据指标类型渲染不同的底部内容 - 恢复达标与否判定组件
    const renderFooterContent = React.useCallback(() => {
      switch (data.indicator) {
        case "原矿干重处理量":
          const progressPercentage = Math.min((data.value / productionPlan.原矿干重处理量t) * 100, 100);
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="text-xs text-muted-foreground text-center">
                计划处理量: {productionPlan.原矿干重处理量t.toFixed(3)}t | 当前: {data.value}t
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs">
                  <span>处理进度</span>
                  <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardFooter>
          );

        case "Zn精矿平均品位":
          const isGradeQualified = data.value >= productionPlan.产出精矿Zn品位;
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-muted-foreground">达标状态</span>
                <Badge variant={isGradeQualified ? "default" : "destructive"} className="text-xs">
                  {isGradeQualified ? "达标" : "未达标"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                标准: {productionPlan.产出精矿Zn品位.toFixed(2)}% | 当前: {data.value}%
              </div>
            </CardFooter>
          );

        case "金属产出量":
          const outputProgressPercentage = Math.min((data.value / productionPlan.产出精矿Zn金属量t) * 100, 100);
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="text-xs text-muted-foreground text-center">
                计划产出量: {productionPlan.产出精矿Zn金属量t.toFixed(3)}t | 当前: {data.value}t
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs">
                  <span>产出进度</span>
                  <span className="font-medium">{outputProgressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={outputProgressPercentage} className="h-2" />
              </div>
            </CardFooter>
          );

        case "回收率":
          const isRecoveryQualified = data.value >= productionPlan.回收率;
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-muted-foreground">达标状态</span>
                <Badge variant={isRecoveryQualified ? "default" : "destructive"} className="text-xs">
                  {isRecoveryQualified ? "达标" : "未达标"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                标准: {productionPlan.回收率.toFixed(2)}% | 当前: {data.value}%
              </div>
            </CardFooter>
          );

        default:
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="text-xs text-muted-foreground text-center">
                当前{data.indicator}: {data.value}{data.unit}
              </div>
            </CardFooter>
          );
      }
    }, [data.indicator, data.value, data.unit, productionPlan]);

    // 自定义tooltip内容，显示实际数值而不是百分比
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
                    {formatValue(data.actualValue, data.unit)}
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
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription className="text-xs">{selectedCycle}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={coreProductionConfig}
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
                            {formatValue(data.value, '')}
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
        {renderFooterContent()}
      </Card>
    );
  };

  // 核心生产指标四宫格组件
  const CoreProductionChart = () => {
    if (isLoadingCoreProduction) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-[400px]">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>加载核心生产指标数据中...</span>
          </CardContent>
        </Card>
      );
    }

    if (coreProductionError) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="text-red-500 mb-2">⚠️ 数据加载失败</div>
            <div className="text-muted-foreground text-sm">{coreProductionError}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchCoreProductionData(selectedCycle)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新加载
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (coreProductionData.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="text-muted-foreground mb-2">📊 暂无数据</div>
            <div className="text-muted-foreground text-sm">当前生产周期暂无核心生产指标数据</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => fetchCoreProductionData(selectedCycle)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新数据
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            周期核心生产指标
          </CardTitle>
          <CardDescription>按金鼎锌业数据标准</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {coreProductionData.map((item, index) => (
              <DonutChart
                key={index}
                data={item}
                title={item.indicator}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            核心生产指标概览 <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none text-center w-full">
            {selectedCycle} ({getCurrentCycleDateRange()}) 核心生产指标数据
          </div>
        </CardFooter>
      </Card>
    );
  };



  // 页面加载时获取生产周期列表
  React.useEffect(() => {
    fetchProductionCycles();
  }, [fetchProductionCycles]);

  // 当生产周期列表加载完成或选择的周期改变时获取数据
  React.useEffect(() => {
    if (productionCycles.length > 0) {
      fetchRawMaterialData(selectedCycle);
      fetchProductData(selectedCycle);
      fetchCoreProductionData(selectedCycle);
    }
  }, [selectedCycle, productionCycles.length, fetchRawMaterialData, fetchProductData, fetchCoreProductionData]);

  // 移除持续刷新的定时器，保持静态数据显示
  // 生产率数据现在保持静态，只在页面加载时设置一次
  // 如需更新，可通过用户操作或页面刷新触发

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <div className="container mx-auto p-6">
        <div className="relative mb-6">
          {/* 汉堡菜单 - 左上角 */}
          <div className="absolute top-0 left-0">
            <BossHamburgerMenu />
          </div>

          {/* 右上角按钮组 */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {/* 主题切换按钮 */}
            <ThemeToggle />
          </div>

          {/* 页面标题 - 居中 */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
              决策中心
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              智能决策 · 数据驱动 · 高效管理
            </p>
          </div>
        </div>

        {/* 生产累计数据大盘 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              生产累计数据大盘
            </CardTitle>
            <CardDescription>
              宏观数据统计 · 生产累计分析 · 库存流转监控
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="原料累计">原料累计</TabsTrigger>
                <TabsTrigger value="产品累计">产品累计</TabsTrigger>
              </TabsList>

              {/* 生产周期选择器 */}
              <div className="flex items-center gap-4 mt-4 mb-6">
                <Select value={selectedCycle} onValueChange={setSelectedCycle} disabled={isLoadingCycles}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder={isLoadingCycles ? "加载中..." : "选择生产周期"} />
                  </SelectTrigger>
                  <SelectContent>
                    {productionCycles.map((cycle) => (
                      <SelectItem key={cycle} value={cycle}>
                        {cycle === '全部周期' ? '全部周期 (聚合数据)' : `生产周期: ${cycle}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingCycles && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              <TabsContent value="原料累计" className="space-y-4">
                {isLoadingRawMaterial ? (
                  <Card>
                    <CardContent className="flex items-center justify-center h-[400px]">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>加载原料累计数据中...</span>
                    </CardContent>
                  </Card>
                ) : rawMaterialError ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                      <div className="text-red-500 mb-2">⚠️ 数据加载失败</div>
                      <div className="text-muted-foreground text-sm">{rawMaterialError}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => fetchRawMaterialData(selectedCycle)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重新加载
                      </Button>
                    </CardContent>
                  </Card>
                ) : rawMaterialData.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                      <div className="text-muted-foreground mb-2">📊 暂无数据</div>
                      <div className="text-muted-foreground text-sm">当前生产周期暂无原料累计数据</div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => fetchRawMaterialData(selectedCycle)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        刷新数据
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <ProductionDataChart
                    data={rawMaterialData}
                    title="原料累计数据对比"
                    type="原料"
                    selectedCycle={selectedCycle}
                    getCurrentCycleDateRange={getCurrentCycleDateRange}
                  />
                )}
              </TabsContent>

              <TabsContent value="产品累计" className="space-y-4">
                {isLoadingProduct ? (
                  <Card>
                    <CardContent className="flex items-center justify-center h-[400px]">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>加载产品累计数据中...</span>
                    </CardContent>
                  </Card>
                ) : productError ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                      <div className="text-destructive mb-2">⚠️ 加载失败</div>
                      <div className="text-muted-foreground text-sm mb-4">{productError}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchProductData(selectedCycle)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重试
                      </Button>
                    </CardContent>
                  </Card>
                ) : productData.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                      <div className="text-muted-foreground mb-2">📊 暂无数据</div>
                      <div className="text-muted-foreground text-sm">当前生产周期暂无产品累计数据</div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => fetchProductData(selectedCycle)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        刷新数据
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <ProductionDataChart
                    data={productData}
                    title="产品累计数据对比"
                    type="产品"
                    selectedCycle={selectedCycle}
                    getCurrentCycleDateRange={getCurrentCycleDateRange}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 周期核心生产指标 */}
        <div className="mb-8">
          <CoreProductionChart />
        </div>

        {/* 专项数据明细 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>专项数据明细</CardTitle>
            <p className="text-sm text-muted-foreground">点击进入相应数据明细模块</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {dataDetailModules.map((module, index) => {
                const colorClasses = {
                  blue: "border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400",
                  green: "border-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400",
                  orange: "border-orange-500 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400",
                  purple: "border-purple-500 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400",
                  indigo: "border-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
                  red: "border-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400",
                  gray: "border-gray-300 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                };

                const isDisabled = module.disabled || !module.path;
                const colorClass = isDisabled ? colorClasses.gray : colorClasses[module.color as keyof typeof colorClasses];

                return (
                  <div
                    key={index}
                    onClick={() => !isDisabled && router.push(module.path)}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${colorClass} ${isDisabled ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={isDisabled ? 'text-gray-400' : ''}>
                        {module.icon}
                      </div>
                      <div className="text-center">
                        <span className={`font-medium text-sm ${isDisabled ? 'text-gray-400' : ''}`}>
                          {module.label}
                        </span>
                        <p className={`text-xs mt-1 ${isDisabled ? 'text-gray-400' : 'opacity-75'}`}>
                          {module.description}
                        </p>
                      </div>
                      {isDisabled && (
                        <div className="absolute top-2 right-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 数据对比分析 富金 */}
        <DataVs1
          title="数据对比分析"
          description="金鼎 VS 富鼎翔各环节数据对比"
          badgeText="富金"
          badgeVariant="default"
          badgeClassName="bg-blue-600"
          onRefresh={refreshComparisonData}
          isRefreshing={isRefreshingComparison}
          comparisonData={comparisonData}
          chartData={{
            incoming: { gradeAndMoisture: [] },
            production: { originalOre: [] },
            outgoing: { gradeAndMoisture: [], weightAndMetal: [] }
          }} // 空的图表数据结构
          // 生产周期相关props
          productionCycles={productionCycles}
          selectedCycle={comparisonSelectedCycle}
          onCycleChange={handleComparisonCycleChangeWithRefresh}
          comparisonStartDate={comparisonStartDate}
          comparisonEndDate={comparisonEndDate}
          onDateChange={(start, end) => {
            setComparisonStartDate(start);
            setComparisonEndDate(end);
          }}
        />

        {/* 数据对比分析 富科 */}
        <DataVsFuke
          title="数据对比分析"
          description="富科生产数据与生产质量对比分析"
          badgeText="富科"
          badgeVariant="secondary"
          badgeClassName="bg-green-600 text-white"
          onRefresh={refreshComparisonData}
          isRefreshing={isRefreshingComparison}
          // 生产周期相关props
          productionCycles={productionCycles}
          selectedCycle={comparisonSelectedCycle}
          onCycleChange={handleComparisonCycleChangeWithRefresh}
          comparisonStartDate={comparisonStartDate}
          comparisonEndDate={comparisonEndDate}
          onDateChange={(start, end) => {
            setComparisonStartDate(start);
            setComparisonEndDate(end);
          }}
        />

        {/* 多页面Cosplay */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              多页面Cosplay
            </CardTitle>
            <CardDescription>
              以不同身份进入对应的工作页面查看
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 化验室 */}
              <div
                onClick={() => router.push('/lab')}
                className="relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
              >
                <div className="flex flex-col items-center space-y-2">
                  <TestTube className="h-6 w-6 text-blue-600" />
                  <span className="font-medium text-blue-700 dark:text-blue-400 text-sm">化验室</span>
                </div>
              </div>

              {/* 进料记录 */}
              <div
                onClick={() => router.push('/raw-material-feeding-record')}
                className="relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 border-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Truck className="h-6 w-6 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400 text-sm">进料记录</span>
                </div>
              </div>

              {/* 浓细度记录 */}
              <div
                onClick={() => router.push('/concentration-fineness-monitor')}
                className="relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 border-orange-500 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Beaker className="h-6 w-6 text-orange-600" />
                  <span className="font-medium text-orange-700 dark:text-orange-400 text-sm">浓细度记录</span>
                </div>
              </div>

              {/* 压滤记录 */}
              <div
                onClick={() => router.push('/filter-press-workshop')}
                className="relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 border-purple-500 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/30"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Filter className="h-6 w-6 text-purple-600" />
                  <span className="font-medium text-purple-700 dark:text-purple-400 text-sm">压滤记录</span>
                </div>
              </div>

              {/* 设备运行记录 */}
              <div
                onClick={() => router.push('/machine-operation-record')}
                className="relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 border-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Settings className="h-6 w-6 text-red-600" />
                  <span className="font-medium text-red-700 dark:text-red-400 text-sm">设备运行记录</span>
                </div>
              </div>

              {/* 采购申请 */}
              <div
                onClick={() => router.push('/purchase-request')}
                className="relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 border-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30"
              >
                <div className="flex flex-col items-center space-y-2">
                  <ShoppingCart className="h-6 w-6 text-indigo-600" />
                  <span className="font-medium text-indigo-700 dark:text-indigo-400 text-sm">采购申请</span>
                </div>
              </div>

              {/* 采购管理 */}
              <div
                onClick={() => router.push('/purchase-management')}
                className="relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 border-teal-500 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/30"
              >
                <div className="flex flex-col items-center space-y-2">
                  <ShoppingCart className="h-6 w-6 text-teal-600" />
                  <span className="font-medium text-teal-700 dark:text-teal-400 text-sm">采购管理</span>
                </div>
              </div>

              {/* 办公室 */}
              <div
                onClick={() => router.push('/manager')}
                className="relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 border-gray-500 bg-gray-50 hover:bg-gray-100 dark:bg-gray-950/20 dark:hover:bg-gray-950/30"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Building className="h-6 w-6 text-gray-600" />
                  <span className="font-medium text-gray-700 dark:text-gray-400 text-sm">办公室</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="flex justify-around items-center p-4">
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => router.push("/situation-management")}
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs">情况处理</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => router.push("/task-assignment")}
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">任务指派</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => router.push("/attendance-management")}
          >
            <CalendarCheck className="w-5 h-5" />
            <span className="text-xs">考勤查看</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => router.push("/purchase-management")}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-xs">采购管理</span>
          </Button>
        </div>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
