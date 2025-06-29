"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/ui/footer";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { HamburgerMenu } from "@/components/hamburger-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Beaker,
  Clock,
  Filter,
  Truck,
  FlaskConical,
  Search,
  RefreshCw,
  Moon,
  Sun,
  Calendar,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

// 简化的数据类型定义
interface SampleData {
  id: string;
  record_date?: string;
  shipment_date?: string;
  shift?: string;
  mineral_type?: string;
  element?: string;
  grade_value?: number | null;
  moisture_value?: number | null;
  filter_press_number?: string;
  supplier?: string;
  purchasing_unit_name?: string;
  assayed_metal_element?: string;
  shipment_sample_grade_percentage?: number | null;
  shipment_sample_moisture_percentage?: number | null;
  created_at?: string;
  updated_at?: string;
}

type DataSource = 'shift_samples' | 'filter_samples' | 'incoming_samples' | 'outgoing_sample';

interface LabDateRange {
  from: Date;
  to: Date;
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
    label: "金鼎水分",
    color: "var(--chart-3)",
  },
  fudingxiang_moisture: {
    label: "富鼎翔水分",
    color: "var(--chart-4)",
  },
  jinding_weight: {
    label: "金鼎湿重",
    color: "var(--chart-1)",
  },
  fudingxiang_weight: {
    label: "富鼎翔湿重",
    color: "var(--chart-2)",
  },
  jinding_metal: {
    label: "金鼎金属量",
    color: "var(--chart-3)",
  },
  fudingxiang_metal: {
    label: "富鼎翔金属量",
    color: "var(--chart-4)",
  },
  moisture: {
    label: "原矿水份",
    color: "var(--chart-1)",
  },
  zn_grade: {
    label: "Zn品位",
    color: "var(--chart-2)",
  },
  pb_grade: {
    label: "Pb品位",
    color: "var(--chart-3)",
  },
  zn_recovery: {
    label: "Zn回收率",
    color: "var(--chart-1)",
  },
  pb_recovery: {
    label: "Pb回收率",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

// 模拟数据生成函数
const generateMockData = () => {
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return {
    // 进厂数据
    incoming: {
      gradeAndMoisture: dates.map(date => ({
        date,
        jinding_grade: (Math.random() * 5 + 15).toFixed(2),
        fudingxiang_grade: (Math.random() * 5 + 16).toFixed(2),
        jinding_moisture: (Math.random() * 3 + 8).toFixed(2),
        fudingxiang_moisture: (Math.random() * 3 + 7).toFixed(2),
      })),
      weightAndMetal: dates.map(date => ({
        date,
        jinding_weight: (Math.random() * 50 + 200).toFixed(1),
        fudingxiang_weight: (Math.random() * 50 + 220).toFixed(1),
        jinding_metal: (Math.random() * 20 + 30).toFixed(1),
        fudingxiang_metal: (Math.random() * 20 + 35).toFixed(1),
      })),
    },
    // 生产数据
    production: {
      originalOre: dates.map(date => ({
        date,
        moisture: (Math.random() * 2 + 8).toFixed(2),
        zn_grade: (Math.random() * 3 + 12).toFixed(2),
        pb_grade: (Math.random() * 2 + 3).toFixed(2),
      })),
      concentrate: dates.map(date => ({
        date,
        zn_grade: (Math.random() * 5 + 50).toFixed(2),
        pb_grade: (Math.random() * 5 + 60).toFixed(2),
      })),
      tailings: dates.map(date => ({
        date,
        zn_grade: (Math.random() * 1 + 1).toFixed(2),
        pb_grade: (Math.random() * 0.5 + 0.5).toFixed(2),
      })),
      recovery: dates.map(date => ({
        date,
        zn_recovery: (Math.random() * 5 + 85).toFixed(2),
        pb_recovery: (Math.random() * 5 + 88).toFixed(2),
      })),
    },
    // 出厂数据
    outgoing: {
      gradeAndMoisture: dates.map(date => ({
        date,
        jinding_grade: (Math.random() * 3 + 52).toFixed(2),
        fudingxiang_grade: (Math.random() * 3 + 53).toFixed(2),
        jinding_moisture: (Math.random() * 2 + 6).toFixed(2),
        fudingxiang_moisture: (Math.random() * 2 + 5).toFixed(2),
      })),
      weightAndMetal: dates.map(date => ({
        date,
        jinding_weight: (Math.random() * 30 + 100).toFixed(1),
        fudingxiang_weight: (Math.random() * 30 + 110).toFixed(1),
        jinding_metal: (Math.random() * 15 + 50).toFixed(1),
        fudingxiang_metal: (Math.random() * 15 + 55).toFixed(1),
      })),
    },
  };
};

// 主题切换组件
function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          深色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        <ChartContainer config={chartConfig}>
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
              tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {lines.map((line, index) => (
              <Line
                key={line.dataKey}
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
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {trendText} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              显示最近30天的数据趋势
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function LabPageContent() {
  const router = useRouter();

  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tableData, setTableData] = useState<SampleData[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource>('shift_samples');

  // 图表数据状态
  const [chartData, setChartData] = useState(() => generateMockData());

  // 日期选择状态
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 默认最近一周
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  // 快速日期选择功能
  const setQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start);
    setEndDate(end);
  }, []);

  // 数据源标签映射
  const dataSourceLabel = {
    'shift_samples': '班样',
    'filter_samples': '压滤样',
    'incoming_samples': '进厂样',
    'outgoing_sample': '出厂样'
  };

  // 专项作业区配置
  const workAreas = [
    {
      icon: Clock,
      label: "班样",
      description: "班次样品化验",
      dataSource: 'shift_samples' as DataSource,
      isNavigationButton: true,
      route: '/shift-sample'
    },
    {
      icon: Filter,
      label: "压滤样",
      description: "压滤机样品化验",
      dataSource: 'filter_samples' as DataSource,
      isNavigationButton: true,
      route: '/filter-sample'
    },
    {
      icon: Beaker,
      label: "进厂样",
      description: "进厂原矿化验",
      dataSource: 'incoming_samples' as DataSource,
      isNavigationButton: true,
      route: '/incoming-sample'
    },
    {
      icon: Truck,
      label: "出厂样",
      description: "出厂精矿化验",
      dataSource: 'outgoing_sample' as DataSource,
      isNavigationButton: true,
      route: '/outgoing-sample'
    }
  ];

  // 模拟数据获取函数
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lab-data?sampleType=${selectedDataSource}&limit=20`);
      const result = await response.json();

      if (result.success) {
        // 转换API数据格式以匹配组件期望的格式
        const transformedData: SampleData[] = result.data.map((item: any) => ({
          id: item.id,
          record_date: item.日期 || item.出厂日期,
          shipment_date: item.出厂日期,
          element: item.元素 || item.化验元素,
          grade_value: parseFloat(item.品位 || item.出厂样品位),
          moisture_value: parseFloat(item.水分 || item.出厂样水分),
          shift: item.班次,
          mineral_type: item.矿物类型,
          supplier: item.供应商,
          purchasing_unit_name: item.采购单位,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

        setTableData(transformedData);
      } else {
        console.error('API 错误:', result.error);
        setTableData([]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDataSource]);

  // 数据源切换
  const handleDataSourceChange = useCallback(async (source: DataSource) => {
    setSelectedDataSource(source);
  }, []);

  // 处理专项作业区点击
  const handleWorkAreaClick = useCallback((area: typeof workAreas[0]) => {
    if (area.isNavigationButton && area.route) {
      router.push(area.route);
    } else {
      handleDataSourceChange(area.dataSource);
    }
  }, [router, handleDataSourceChange]);

  // 行点击处理
  const handleRowClick = useCallback((item: SampleData) => {
    console.log('查看详情:', item);
    // 这里可以添加详情查看逻辑
  }, []);

  // 页面初始化
  useEffect(() => {
    const initializePage = async () => {
      setIsInitialLoading(true);
      try {
        await fetchData();
      } catch (error) {
        console.error('页面初始化失败:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializePage();
  }, []);

  // 数据源变化时重新获取数据
  useEffect(() => {
    if (!isInitialLoading) {
      fetchData();
    }
  }, [selectedDataSource, fetchData, isInitialLoading]);

  if (isInitialLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-8">
          <Skeleton className="h-8 w-48 mx-auto" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 页面头部 */}
      <div className="relative">
        {/* 汉堡菜单 - 左上角 */}
        <div className="absolute top-0 left-0">
          <HamburgerMenu />
        </div>

        {/* 主题切换按钮 - 右上角 */}
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>

        {/* 页面标题 - 居中 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <FlaskConical className="h-6 w-6 sm:h-8 sm:w-8" />
            化验室
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            样品化验数据管理与查询系统
          </p>
        </div>
      </div>

      {/* 专项作业区域 */}
      <Card>
        <CardHeader>
          <CardTitle>专项作业区</CardTitle>
          <CardDescription>
            点击选择专项作业区
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workAreas.map((area) => {
              const IconComponent = area.icon;

              return (
                <Button
                  key={area.dataSource}
                  variant="outline"
                  className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-primary/5 hover:border-primary"
                  onClick={() => handleWorkAreaClick(area)}
                >
                  <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  <div className="text-center">
                    <h3 className="font-semibold text-xs sm:text-sm">{area.label}</h3>
                    <p className="text-xs text-muted-foreground hidden sm:block">{area.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 化验数据查询区域 */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl">化验数据查询</CardTitle>
            <CardDescription className="text-sm">
              查看 {dataSourceLabel[selectedDataSource]} 的历史化验记录
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 数据源切换按钮 */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-4">
            {(['shift_samples', 'filter_samples', 'incoming_samples', 'outgoing_sample'] as const).map((source) => (
              <Button
                key={source}
                variant={selectedDataSource === source ? "default" : "outline"}
                size="sm"
                onClick={() => handleDataSourceChange(source)}
                className="text-xs sm:text-sm"
              >
                {dataSourceLabel[source]}
              </Button>
            ))}
          </div>

          {/* 日期选择功能 */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              日期范围选择
            </h3>
            <div className="space-y-4">
              {/* 日期输入 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
                  <Input
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
                  <Input
                    type="date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* 快速选择按钮 */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(7)}
                  className="text-xs"
                >
                  最近一周
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(30)}
                  className="text-xs"
                >
                  最近一月
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(180)}
                  className="text-xs"
                >
                  最近半年
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(365)}
                  className="text-xs"
                >
                  最近一年
                </Button>
              </div>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="relative overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tableData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无 {dataSourceLabel[selectedDataSource]} 数据</p>
                <p className="text-sm mt-2">所选日期范围内没有找到相关记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>元素</TableHead>
                      <TableHead>品位(%)</TableHead>
                      <TableHead>水分(%)</TableHead>
                      {selectedDataSource === 'shift_samples' && <TableHead>班次</TableHead>}
                      {selectedDataSource === 'shift_samples' && <TableHead>矿物类型</TableHead>}
                      {selectedDataSource === 'incoming_samples' && <TableHead>供应商</TableHead>}
                      {selectedDataSource === 'outgoing_sample' && <TableHead>采购单位</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(item)}
                      >
                        <TableCell>{item.record_date || item.shipment_date}</TableCell>
                        <TableCell>{item.element}</TableCell>
                        <TableCell>{item.grade_value?.toFixed(2) || '-'}</TableCell>
                        <TableCell>{item.moisture_value?.toFixed(2) || '-'}</TableCell>
                        {selectedDataSource === 'shift_samples' && <TableCell>{item.shift}</TableCell>}
                        {selectedDataSource === 'shift_samples' && <TableCell>{item.mineral_type}</TableCell>}
                        {selectedDataSource === 'incoming_samples' && <TableCell>{item.supplier}</TableCell>}
                        {selectedDataSource === 'outgoing_sample' && <TableCell>{item.purchasing_unit_name}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 数据对比模块 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            数据对比分析
          </CardTitle>
          <CardDescription>
            金鼎 VS 富鼎翔各环节数据对比
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="incoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="incoming">进厂数据</TabsTrigger>
              <TabsTrigger value="production">生产数据</TabsTrigger>
              <TabsTrigger value="outgoing">出厂数据</TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">进厂原矿数据趋势</h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.incoming.gradeAndMoisture}
                        title="品位% + 水份% 对比"
                        description="金鼎 VS 富鼎翔进厂原矿品位和水分对比"
                        lines={[
                          { dataKey: "jinding_grade" },
                          { dataKey: "fudingxiang_grade" },
                          { dataKey: "jinding_moisture" },
                          { dataKey: "fudingxiang_moisture" },
                        ]}
                        trendText="品位和水分指标稳定"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.incoming.weightAndMetal}
                        title="湿重t + 金属量t 对比"
                        description="金鼎 VS 富鼎翔进厂原矿重量和金属量对比"
                        lines={[
                          { dataKey: "jinding_weight" },
                          { dataKey: "fudingxiang_weight" },
                          { dataKey: "jinding_metal" },
                          { dataKey: "fudingxiang_metal" },
                        ]}
                        trendText="重量和金属量指标正常"
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </TabsContent>

            <TabsContent value="production" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">生产过程数据分析</h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.production.originalOre}
                        title="原矿水份 + 原矿Zn品位 + 原矿Pb品位"
                        description="原矿入选前的关键指标监控"
                        lines={[
                          { dataKey: "moisture" },
                          { dataKey: "zn_grade" },
                          { dataKey: "pb_grade" },
                        ]}
                        trendText="原矿指标稳定在正常范围"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.production.concentrate}
                        title="精矿Zn品位 + 精矿Pb品位"
                        description="精矿产品质量指标"
                        lines={[
                          { dataKey: "zn_grade" },
                          { dataKey: "pb_grade" },
                        ]}
                        trendText="精矿品位保持高水平"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.production.tailings}
                        title="尾矿Zn品位 + 尾矿Pb品位"
                        description="尾矿损失控制指标"
                        lines={[
                          { dataKey: "zn_grade" },
                          { dataKey: "pb_grade" },
                        ]}
                        trendText="尾矿品位控制良好"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.production.recovery}
                        title="回收率"
                        description="金属回收效率指标"
                        lines={[
                          { dataKey: "zn_recovery" },
                          { dataKey: "pb_recovery" },
                        ]}
                        trendText="回收率保持优秀水平"
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </TabsContent>

            <TabsContent value="outgoing" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">出厂精矿质量分析</h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.outgoing.gradeAndMoisture}
                        title="品位% + 水份% 对比"
                        description="金鼎 VS 富鼎翔出厂精矿品位和水分对比"
                        lines={[
                          { dataKey: "jinding_grade" },
                          { dataKey: "fudingxiang_grade" },
                          { dataKey: "jinding_moisture" },
                          { dataKey: "fudingxiang_moisture" },
                        ]}
                        trendText="出厂精矿质量稳定优良"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.outgoing.weightAndMetal}
                        title="湿重t + 金属量t 对比"
                        description="金鼎 VS 富鼎翔出厂精矿重量和金属量对比"
                        lines={[
                          { dataKey: "jinding_weight" },
                          { dataKey: "fudingxiang_weight" },
                          { dataKey: "jinding_metal" },
                          { dataKey: "fudingxiang_metal" },
                        ]}
                        trendText="出厂产量保持稳定增长"
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 统一底部签名 */}
      <Footer />
    </div>
  );
}

export default function LabPage() {
  return (
    <AuthGuard>
      <LabPageContent />
    </AuthGuard>
  );
}
