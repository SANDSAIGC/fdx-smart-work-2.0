"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Bell, CalendarCheck, Truck,
  FileChartLine, FileImage, FileOutput,
  Gauge, Wrench, ShoppingCart, Bot,
  TrendingUp, BarChart3, DollarSign,
  Activity, Target, Award, Zap, Factory, Package,
  RefreshCw, TestTube, Beaker, Users, Building, Filter, Settings, CheckCircle, Calendar, FileInput, Upload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartStyle } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Label as RechartsLabel, Sector, LineChart, Line, LabelList } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { CollaboratorHeader1 } from "@/components/headers/collaborator-header-1";
import ProductionDataChart from "@/components/charts/ProductionDataChart";
import { Footer } from "@/components/ui/footer";
import DataVsFuke from "@/components/data-vs-fuke";

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

export default function CollaboratorPage() {
  const router = useRouter();

  // 周期核心生产指标数据状态
  const [coreProductionData, setCoreProductionData] = useState([
    { indicator: "原矿干重处理量", value: 0, unit: "t", fill: "var(--color-processing)" },
    { indicator: "Zn精矿平均品位", value: 0, unit: "%", fill: "var(--color-grade)" },
    { indicator: "金属产出量", value: 0, unit: "t", fill: "var(--color-output)" },
    { indicator: "回收率", value: 0, unit: "%", fill: "var(--color-recovery)" },
  ]);

  // 生产计划数据状态
  const [productionPlan, setProductionPlan] = useState({
    原矿干重处理量: 0,
    产出精矿Zn品位: 0,
    产出精矿Zn金属量: 0,
    回收率: 0,
  });

  // 生产周期状态
  const [selectedCycle, setSelectedCycle] = useState("第一期（4月26日-5月25日）");

  // 生产周期配置 - 与数据表中的实际值匹配
  const productionCycles: ProductionCycle[] = [
    { id: "第一期（4月26日-5月25日）", name: "第一期", dateRange: "4月26日-5月25日" },
    { id: "第二期（5月26日-6月25日）", name: "第二期", dateRange: "5月26日-6月25日" },
    { id: "第三期（6月26日-7月25日）", name: "第三期", dateRange: "6月26日-7月25日" },
    { id: "2024年12月", name: "2024年12月", dateRange: "2024年12月1日-12月31日" },
    { id: "2024年11月", name: "2024年11月", dateRange: "2024年11月1日-11月30日" },
  ];

  // 生产累计数据状态
  const [activeTab, setActiveTab] = useState("原料累计");
  const [rawMaterialData, setRawMaterialData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [isLoadingRawMaterial, setIsLoadingRawMaterial] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [rawMaterialError, setRawMaterialError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  // 核心生产指标状态
  const [isLoadingCoreProduction, setIsLoadingCoreProduction] = useState(false);
  const [coreProductionError, setCoreProductionError] = useState<string | null>(null);

  // 数据对比分析状态
  const [isRefreshingComparison, setIsRefreshingComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>({});

  // 指导意见提交表单状态
  const [guidanceForm, setGuidanceForm] = useState({
    date: new Date().toISOString().split('T')[0], // 默认当前日期
    subject: '',
    content: ''
  });
  const [isSubmittingGuidance, setIsSubmittingGuidance] = useState(false);
  const [guidanceSubmitError, setGuidanceSubmitError] = useState<string | null>(null);
  const [guidanceSubmitSuccess, setGuidanceSubmitSuccess] = useState(false);

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

  // 获取当前周期日期范围
  const getCurrentCycleDateRange = useCallback(() => {
    const cycle = productionCycles.find(c => c.id === selectedCycle);
    return cycle ? cycle.dateRange : "4月26日-5月25日";
  }, [selectedCycle, productionCycles]);

  // 通过API获取原料累计数据
  const fetchRawMaterialData = React.useCallback(async (cycle: string) => {
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

      const newRawMaterialData = [
        { parameter: "期初库存", company: "富鼎翔", value: fdxData?.月初库存 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "期初库存", company: "金鼎锌业", value: jdxyData?.月初库存 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "周期倒入量", company: "富鼎翔", value: fdxData?.本月倒入量 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "周期倒入量", company: "金鼎锌业", value: jdxyData?.本月倒入量 || 0, fill: "var(--color-金鼎锌业)" },
        { parameter: "周期消耗量", company: "富鼎翔", value: fdxData?.本月消耗量 || 0, fill: "var(--color-富鼎翔)" },
        { parameter: "周期消耗量", company: "金鼎锌业", value: jdxyData?.本月消耗量 || 0, fill: "var(--color-金鼎锌业)" },
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
      handleError(error, '获取原料累计数据');
      setRawMaterialError('连接数据库失败，请检查网络连接');
      setRawMaterialData([]);
    } finally {
      setIsLoadingRawMaterial(false);
    }
  }, []);

  // 通过API获取产品累计数据
  const fetchProductData = React.useCallback(async (cycle: string) => {
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

      // 构建图表数据
      const data = result.data;
      const fdxData = data.fdx;
      const jdxyData = data.jdxy;

      // 计算FDX和JDXY的汇总数据
      const fdxSummary = fdxData ? fdxData.reduce((acc: any, item: any) => ({
        月初库存: acc.月初库存 + parseFloat(item.月初库存 || 0),
        本月产量: acc.本月产量 + parseFloat(item.本月产量 || 0),
        本月出厂量: acc.本月出厂量 + parseFloat(item.本月出厂量 || 0),
        期末总库存: acc.期末总库存 + parseFloat(item.期末总库存 || 0),
        期末有效库存: acc.期末有效库存 + parseFloat(item.期末有效库存 || 0),
        矿仓底部库存: acc.矿仓底部库存 + parseFloat(item.矿仓底部库存 || 0),
      }), { 月初库存: 0, 本月产量: 0, 本月出厂量: 0, 期末总库存: 0, 期末有效库存: 0, 矿仓底部库存: 0 }) : null;

      const jdxySummary = jdxyData ? jdxyData.reduce((acc: any, item: any) => ({
        月初库存: acc.月初库存 + parseFloat(item.月初库存 || 0),
        本月产量: acc.本月产量 + parseFloat(item.本月产量 || 0),
        本月出厂量: acc.本月出厂量 + parseFloat(item.本月出厂量 || 0),
        期末总库存: acc.期末总库存 + parseFloat(item.期末总库存 || 0),
        期末有效库存: acc.期末有效库存 + parseFloat(item.期末有效库存 || 0),
        矿仓底部库存: acc.矿仓底部库存 + parseFloat(item.矿仓底部库存 || 0),
      }), { 月初库存: 0, 本月产量: 0, 本月出厂量: 0, 期末总库存: 0, 期末有效库存: 0, 矿仓底部库存: 0 }) : null;

      const newProductData = [
        { parameter: "期初库存", company: "富鼎翔", value: Math.round(fdxSummary?.月初库存 || 0), fill: "var(--color-富鼎翔)" },
        { parameter: "期初库存", company: "金鼎锌业", value: Math.round(jdxySummary?.月初库存 || 0), fill: "var(--color-金鼎锌业)" },
        { parameter: "周期产量", company: "富鼎翔", value: Math.round(fdxSummary?.本月产量 || 0), fill: "var(--color-富鼎翔)" },
        { parameter: "周期产量", company: "金鼎锌业", value: Math.round(jdxySummary?.本月产量 || 0), fill: "var(--color-金鼎锌业)" },
        { parameter: "周期出厂量", company: "富鼎翔", value: Math.round(fdxSummary?.本月出厂量 || 0), fill: "var(--color-富鼎翔)" },
        { parameter: "周期出厂量", company: "金鼎锌业", value: Math.round(jdxySummary?.本月出厂量 || 0), fill: "var(--color-金鼎锌业)" },
        { parameter: "期末有效库存", company: "富鼎翔", value: Math.round(fdxSummary?.期末有效库存 || 0), fill: "var(--color-富鼎翔)" },
        { parameter: "期末有效库存", company: "金鼎锌业", value: Math.round(jdxySummary?.期末有效库存 || 0), fill: "var(--color-金鼎锌业)" },
        { parameter: "矿仓底部库存", company: "富鼎翔", value: Math.round(fdxSummary?.矿仓底部库存 || 0), fill: "var(--color-富鼎翔)" },
        { parameter: "矿仓底部库存", company: "金鼎锌业", value: Math.round(jdxySummary?.矿仓底部库存 || 0), fill: "var(--color-金鼎锌业)" },
        { parameter: "期末总库存", company: "富鼎翔", value: Math.round(fdxSummary?.期末总库存 || 0), fill: "var(--color-富鼎翔)" },
        { parameter: "期末总库存", company: "金鼎锌业", value: Math.round(jdxySummary?.期末总库存 || 0), fill: "var(--color-金鼎锌业)" },
      ];

      setProductData(newProductData);
      setProductError(null);
    } catch (error) {
      handleError(error, '获取产品数据');
      setProductError('获取产品数据时发生异常');
      setProductData([]);
    } finally {
      setIsLoadingProduct(false);
    }
  }, []);

  // 通过API获取核心生产指标和计划数据
  const fetchCoreProductionData = React.useCallback(async (cycle: string) => {
    setIsLoadingCoreProduction(true);
    setCoreProductionError(null);
    try {
      // 并行获取生产计划数据和原料累计数据
      const [planResponse, rawMaterialResponse] = await Promise.all([
        fetch('/api/boss/core-production-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cycle }),
        }),
        fetch('/api/boss/raw-material-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cycle }),
        })
      ]);

      const planResult = await planResponse.json();
      const rawMaterialResult = await rawMaterialResponse.json();

      if (!planResult.success) {
        console.error('获取生产计划数据失败:', planResult.message);
        setCoreProductionError(planResult.message || '无法获取生产计划数据');
        return;
      }

      // 设置生产计划数据
      const planData = planResult.data;
      setProductionPlan({
        原矿干重处理量: planData?.['原矿干重处理量t'] || 0,
        产出精矿Zn品位: planData?.['产出精矿Zn品位%'] || 0,
        产出精矿Zn金属量: planData?.['产出精矿Zn金属量t'] || 0,
        回收率: planData?.['回收率%'] || 0,
      });

      // 获取原矿干重处理量的实际值
      let actualProcessingAmount = 0;
      if (rawMaterialResult.success && rawMaterialResult.data?.jdxy) {
        const jdxyData = rawMaterialResult.data.jdxy;
        // 根据生产周期类型选择对应字段
        if (cycle.includes('期')) {
          // 月度周期：使用本月消耗量
          actualProcessingAmount = jdxyData['本月消耗量'] || 0;
        } else if (cycle.includes('年')) {
          // 年度周期：使用本年消耗量
          actualProcessingAmount = jdxyData['本年消耗量'] || 0;
        }
      }

      // 构建实际生产数据（原矿干重处理量使用真实数据，其他暂时使用模拟数据）
      const actualCurrentData = [
        { indicator: "原矿干重处理量", value: actualProcessingAmount, unit: "t", fill: "var(--color-processing)" },
        { indicator: "Zn精矿平均品位", value: 52.8, unit: "%", fill: "var(--color-grade)" },
        { indicator: "金属产出量", value: 6640, unit: "t", fill: "var(--color-output)" },
        { indicator: "回收率", value: 89.2, unit: "%", fill: "var(--color-recovery)" },
      ];

      setCoreProductionData(actualCurrentData);

      setCoreProductionError(null);
    } catch (error) {
      handleError(error, '获取核心生产指标数据');
      setCoreProductionError('获取核心生产指标数据时发生异常');
    } finally {
      setIsLoadingCoreProduction(false);
    }
  }, []);

  // 监听生产周期变化，自动加载数据
  useEffect(() => {
    fetchRawMaterialData(selectedCycle);
    fetchProductData(selectedCycle);
    fetchCoreProductionData(selectedCycle);
  }, [selectedCycle, fetchRawMaterialData, fetchProductData, fetchCoreProductionData]);

  // 数据对比分析刷新函数
  const refreshComparisonData = useCallback(() => {
    setIsRefreshingComparison(true);
    // 模拟刷新延迟
    setTimeout(() => {
      setIsRefreshingComparison(false);
      console.log('数据对比分析已刷新');
    }, 1000);
  }, []);

  // 错误处理函数
  const handleError = useCallback((error: any, context: string) => {
    console.error(`${context}错误:`, error);
    // 这里可以添加更多的错误处理逻辑，比如显示通知等
  }, []);

  // 指导意见表单处理函数
  const handleGuidanceFormChange = useCallback((field: string, value: string) => {
    setGuidanceForm(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除之前的错误和成功状态
    if (guidanceSubmitError) setGuidanceSubmitError(null);
    if (guidanceSubmitSuccess) setGuidanceSubmitSuccess(false);
  }, [guidanceSubmitError, guidanceSubmitSuccess]);

  // 表单验证
  const validateGuidanceForm = useCallback(() => {
    if (!guidanceForm.date) {
      setGuidanceSubmitError('请选择日期');
      return false;
    }
    if (!guidanceForm.subject.trim()) {
      setGuidanceSubmitError('请输入主题');
      return false;
    }
    if (!guidanceForm.content.trim()) {
      setGuidanceSubmitError('请输入正文内容');
      return false;
    }
    return true;
  }, [guidanceForm]);

  // 提交指导意见
  const handleGuidanceSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateGuidanceForm()) {
      return;
    }

    setIsSubmittingGuidance(true);
    setGuidanceSubmitError(null);

    try {
      const response = await fetch('/api/guidance-opinions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guidanceForm),
      });

      const result = await response.json();

      if (!result.success) {
        setGuidanceSubmitError(result.message || '提交失败，请重试');
        return;
      }

      // 提交成功
      setGuidanceSubmitSuccess(true);
      setGuidanceForm({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        content: ''
      });

      // 3秒后清除成功状态
      setTimeout(() => {
        setGuidanceSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      handleError(error, '提交指导意见');
      setGuidanceSubmitError('网络错误，请检查连接后重试');
    } finally {
      setIsSubmittingGuidance(false);
    }
  }, [guidanceForm, validateGuidanceForm, handleError]);

  // 专项数据明细配置 - 移除进厂数据和出厂数据，新增上传文件
  const dataDetailModules = [
    {
      icon: <FileChartLine className="h-6 w-6" />,
      label: "生产数据",
      path: "/shift-report-details",
      description: "生产过程数据监控",
      color: "green"
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
      icon: <Upload className="h-6 w-6" />,
      label: "文件管理",
      path: "/file-management",
      description: "云文档管理中心",
      color: "blue"
    },
  ];

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
          maxValue = 20000; // 20000t
          currentPercentage = (data.value / maxValue) * 100;
          break;
        case "Zn精矿平均品位":
          maxValue = 50; // 50%
          currentPercentage = (data.value / maxValue) * 100;
          break;
        case "金属产出量":
          maxValue = 10000; // 10000t
          currentPercentage = (data.value / maxValue) * 100;
          break;
        case "回收率":
          maxValue = 100; // 100%
          currentPercentage = (data.value / maxValue) * 100;
          break;
        default:
          currentPercentage = data.value;
      }

      // 确保百分比在0-100之间
      currentPercentage = Math.max(0, Math.min(100, currentPercentage));

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

    // 自定义Tooltip组件
    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (data.name === "当前值") {
          return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                    当前值
                  </span>
                  <span className="font-bold text-muted-foreground">
                    {data.actualValue}{data.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        }
      }
      return null;
    };

    // 根据指标类型渲染不同的底部内容 - 使用useCallback优化性能
    const renderFooterContent = React.useCallback(() => {
      switch (data.indicator) {
        case "原矿干重处理量":
          const progressPercentage = Math.min((data.value / productionPlan.原矿干重处理量) * 100, 100);
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="text-xs text-muted-foreground text-center">
                计划处理量: {productionPlan.原矿干重处理量}t | 当前: {data.value}t
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
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="text-xs text-muted-foreground text-center">
                当前值：{data.value.toFixed(2)}%
              </div>
            </CardFooter>
          );

        case "金属产出量":
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="text-xs text-muted-foreground text-center">
                当前值：{data.value.toFixed(3)}t
              </div>
            </CardFooter>
          );

        case "回收率":
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="text-xs text-muted-foreground text-center">
                当前值：{data.value.toFixed(2)}%
              </div>
            </CardFooter>
          );

        default:
          return (
            <CardFooter className="flex-col gap-2 pt-4">
              <div className="text-xs text-muted-foreground text-center">
                当前值：{data.value}{data.unit}
              </div>
            </CardFooter>
          );
      }
    }, [data, productionPlan]);

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
                            className="fill-foreground text-3xl font-bold"
                          >
                            {percentage.toFixed(0)}%
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            完成度
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

  return (
    <div className="min-h-screen bg-background">
      {/* 使用合作者专用Header组件 */}
      <CollaboratorHeader1
        title="FDX协力工作台"
        subtitle="双企联动·数智协同·精准管控"
        icon={Users}
      />

      <div className="container mx-auto px-6 pb-6">
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
                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="选择生产周期" />
                  </SelectTrigger>
                  <SelectContent>
                    {productionCycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        生产周期: {cycle.name} ({cycle.dateRange})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 原料累计选项卡 */}
              <TabsContent value="原料累计" className="space-y-4">
                {isLoadingRawMaterial ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                      <div className="text-muted-foreground mb-2">正在加载原料累计数据...</div>
                      <div className="text-muted-foreground text-sm">请稍候</div>
                    </CardContent>
                  </Card>
                ) : rawMaterialError || rawMaterialData.length === 0 ? (
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

              {/* 产品累计选项卡 */}
              <TabsContent value="产品累计" className="space-y-4">
                {isLoadingProduct ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                      <div className="text-muted-foreground mb-2">正在加载产品累计数据...</div>
                      <div className="text-muted-foreground text-sm">请稍候</div>
                    </CardContent>
                  </Card>
                ) : productError || productData.length === 0 ? (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {dataDetailModules.map((module, index) => {
                const colorClasses = {
                  blue: "border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400",
                  green: "border-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400",
                  purple: "border-purple-500 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400",
                  indigo: "border-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
                };

                const colorClass = colorClasses[module.color as keyof typeof colorClasses] || colorClasses.blue;

                return (
                  <div
                    key={index}
                    onClick={() => router.push(module.path)}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${colorClass}`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div>
                        {module.icon}
                      </div>
                      <div className="text-center">
                        <span className="font-medium text-sm">
                          {module.label}
                        </span>
                        <p className="text-xs mt-1 opacity-75">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 数据对比分析-富科 */}
        <DataVsFuke
          title="数据对比分析"
          description="富科生产数据与生产质量对比分析"
          badgeText="富科"
          badgeVariant="secondary"
          badgeClassName="bg-green-600 text-white"
          onRefresh={refreshComparisonData}
          isRefreshing={isRefreshingComparison}
        />

        {/* 指导意见提交系统 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              科力指导意见提交
            </CardTitle>
            <CardDescription>
              提交生产指导意见和建议，助力生产优化
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGuidanceSubmit} className="space-y-6">
              {/* 日期选择器 */}
              <div className="space-y-2">
                <Label htmlFor="guidance-date" className="text-sm font-medium">
                  日期 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guidance-date"
                  type="date"
                  value={guidanceForm.date}
                  onChange={(e) => handleGuidanceFormChange('date', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* 主题输入框 */}
              <div className="space-y-2">
                <Label htmlFor="guidance-subject" className="text-sm font-medium">
                  主题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guidance-subject"
                  type="text"
                  placeholder="请输入指导意见主题"
                  value={guidanceForm.subject}
                  onChange={(e) => handleGuidanceFormChange('subject', e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* 正文输入区域 */}
              <div className="space-y-2">
                <Label htmlFor="guidance-content" className="text-sm font-medium">
                  正文内容 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="guidance-content"
                  placeholder="请输入详细的指导意见内容..."
                  value={guidanceForm.content}
                  onChange={(e) => handleGuidanceFormChange('content', e.target.value)}
                  className="w-full min-h-[120px] resize-y"
                  required
                />
              </div>

              {/* 错误提示 */}
              {guidanceSubmitError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800">
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {guidanceSubmitError}
                  </div>
                </div>
              )}

              {/* 成功提示 */}
              {guidanceSubmitSuccess && (
                <div className="p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✅ 指导意见提交成功！
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingGuidance}
                  className="min-w-[120px]"
                >
                  {isSubmittingGuidance ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      提交意见
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 页面构建完成 */}
        <div className="text-center py-8">
          <div className="text-muted-foreground text-sm">页面构建完成</div>
        </div>
      </div>

      {/* Footer组件 */}
      <Footer />
    </div>
  );
}
