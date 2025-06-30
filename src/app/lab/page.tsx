"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/ui/footer";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { HamburgerMenu } from "@/components/hamburger-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  TrendingUp,
  Edit,
  Save,
  X,
  Undo2,
  Package,
  Mountain
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
  operator?: string; // 操作员字段
  supplier?: string;
  purchasing_unit_name?: string;
  assayed_metal_element?: string;
  sample_number?: string; // 样品编号字段
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
  // 生产数据字段（注意：jinding_moisture和fudingxiang_moisture已在上面定义，这里不重复定义）
  jinding_zn_grade: {
    label: "金鼎Zn品位",
    color: "var(--chart-3)",
  },
  fudingxiang_zn_grade: {
    label: "富鼎翔Zn品位",
    color: "var(--chart-4)",
  },
  jinding_pb_grade: {
    label: "金鼎Pb品位",
    color: "var(--chart-5)",
  },
  fudingxiang_pb_grade: {
    label: "富鼎翔Pb品位",
    color: "var(--chart-6)",
  },
  jinding_zn_recovery: {
    label: "金鼎Zn回收率",
    color: "var(--chart-1)",
  },
  fudingxiang_zn_recovery: {
    label: "富鼎翔Zn回收率",
    color: "var(--chart-2)",
  },
  jinding_pb_recovery: {
    label: "金鼎Pb回收率",
    color: "var(--chart-3)",
  },
  fudingxiang_pb_recovery: {
    label: "富鼎翔Pb回收率",
    color: "var(--chart-4)",
  },
  // 内部取样字段
  internal_grade: {
    label: "内部取样品位",
    color: "var(--chart-5)",
  },
  internal_moisture: {
    label: "内部取样水份",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig

// 模拟数据生成函数
const generateMockData = (startDate?: Date, endDate?: Date) => {
  // 如果没有提供日期范围，默认使用最近30天
  const start = startDate || (() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return date;
  })();
  const end = endDate || new Date();

  // 计算日期范围内的所有日期
  const dates: string[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

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
        jinding_moisture: (Math.random() * 2 + 8).toFixed(2),
        fudingxiang_moisture: (Math.random() * 2 + 7.5).toFixed(2),
        jinding_zn_grade: (Math.random() * 3 + 12).toFixed(2),
        fudingxiang_zn_grade: (Math.random() * 3 + 11.5).toFixed(2),
        jinding_pb_grade: (Math.random() * 2 + 3).toFixed(2),
        fudingxiang_pb_grade: (Math.random() * 2 + 2.8).toFixed(2),
      })),
      concentrate: dates.map(date => ({
        date,
        jinding_zn_grade: (Math.random() * 5 + 50).toFixed(2),
        fudingxiang_zn_grade: (Math.random() * 5 + 51).toFixed(2),
        jinding_pb_grade: (Math.random() * 5 + 60).toFixed(2),
        fudingxiang_pb_grade: (Math.random() * 5 + 61).toFixed(2),
      })),
      tailings: dates.map(date => ({
        date,
        jinding_zn_grade: (Math.random() * 1 + 1).toFixed(2),
        fudingxiang_zn_grade: (Math.random() * 1 + 0.9).toFixed(2),
        jinding_pb_grade: (Math.random() * 0.5 + 0.5).toFixed(2),
        fudingxiang_pb_grade: (Math.random() * 0.5 + 0.4).toFixed(2),
      })),
      recovery: dates.map(date => ({
        date,
        jinding_zn_recovery: (Math.random() * 5 + 85).toFixed(2),
        fudingxiang_zn_recovery: (Math.random() * 5 + 86).toFixed(2),
        jinding_pb_recovery: (Math.random() * 5 + 88).toFixed(2),
        fudingxiang_pb_recovery: (Math.random() * 5 + 89).toFixed(2),
      })),
    },
    // 出厂数据
    outgoing: {
      gradeAndMoisture: dates.map(date => ({
        date,
        jinding_grade: (Math.random() * 3 + 52).toFixed(2),
        fudingxiang_grade: (Math.random() * 3 + 53).toFixed(2),
        internal_grade: (Math.random() * 3 + 52.5).toFixed(2), // 内部取样品位
        jinding_moisture: (Math.random() * 2 + 6).toFixed(2),
        fudingxiang_moisture: (Math.random() * 2 + 5).toFixed(2),
        internal_moisture: (Math.random() * 2 + 5.5).toFixed(2), // 内部取样水分
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
          <div className="grid gap-1">
            {trendText.split('\n').map((line, index) => (
              <div key={index} className="leading-none font-medium text-xs">
                {line}
              </div>
            ))}
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

  // 详情对话框状态
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<SampleData | null>(null);
  const [rawRowData, setRawRowData] = useState<any>(null);

  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 图表数据状态
  const [chartData, setChartData] = useState(() => generateMockData());

  // 日期选择状态
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 默认最近一周
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  // 数据对比分析专用日期范围状态
  const [comparisonStartDate, setComparisonStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // 默认最近30天
    return date;
  });
  const [comparisonEndDate, setComparisonEndDate] = useState<Date | undefined>(() => new Date());

  // 数据对比分析刷新状态
  const [isRefreshingComparison, setIsRefreshingComparison] = useState(false);

  // 快速日期选择功能
  const setQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start);
    setEndDate(end);
  }, []);

  // 数据对比分析专用快速日期选择功能
  const setComparisonQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setComparisonStartDate(start);
    setComparisonEndDate(end);
  }, []);

  // 通过API获取进厂数据
  const fetchIncomingData = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/lab/incoming-data', {
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
      return result.data || [];
    } catch (error) {
      console.error('获取进厂数据失败:', error);
      return [];
    }
  }, []);

  // 通过API获取生产数据
  const fetchProductionData = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/lab/production-data', {
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
      return result.data || [];
    } catch (error) {
      console.error('获取生产数据失败:', error);
      return [];
    }
  }, []);

  // 通过API获取出厂数据
  const fetchOutgoingData = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/lab/outgoing-data', {
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
      return result.data || [];
    } catch (error) {
      console.error('获取出厂数据失败:', error);
      return [];
    }
  }, []);

  // 根据日期范围更新图表数据
  const updateChartDataByDateRange = useCallback(async () => {
    if (comparisonStartDate && comparisonEndDate) {
      try {
        // 获取真实数据
        const [incomingData, productionData, outgoingData] = await Promise.all([
          fetchIncomingData(comparisonStartDate, comparisonEndDate),
          fetchProductionData(comparisonStartDate, comparisonEndDate),
          fetchOutgoingData(comparisonStartDate, comparisonEndDate)
        ]);

        // 如果没有真实数据，使用模拟数据
        if (incomingData.length === 0 && productionData.length === 0 && outgoingData.length === 0) {
          const newChartData = generateMockData(comparisonStartDate, comparisonEndDate);
          setChartData(newChartData);
        } else {
          // 转换真实数据为图表格式
          const transformedData = transformSupabaseDataToChartData(incomingData, productionData, outgoingData);
          setChartData(transformedData);
        }
      } catch (error) {
        console.error('更新图表数据失败:', error);
        // 出错时使用模拟数据
        const newChartData = generateMockData(comparisonStartDate, comparisonEndDate);
        setChartData(newChartData);
      }
    }
  }, [comparisonStartDate, comparisonEndDate, fetchIncomingData, fetchProductionData, fetchOutgoingData]);

  // 手动刷新数据对比分析数据
  const refreshComparisonData = useCallback(async () => {
    if (!comparisonStartDate || !comparisonEndDate) return;

    setIsRefreshingComparison(true);
    try {
      await updateChartDataByDateRange();
    } catch (error) {
      console.error('刷新数据对比分析数据失败:', error);
    } finally {
      setIsRefreshingComparison(false);
    }
  }, [comparisonStartDate, comparisonEndDate, updateChartDataByDateRange]);

  // 监听日期变化，自动更新图表数据
  useEffect(() => {
    updateChartDataByDateRange();
  }, [updateChartDataByDateRange]);



  // 转换Supabase数据为图表数据格式
  const transformSupabaseDataToChartData = useCallback((incomingData: any[], productionData: any[], outgoingData: any[]) => {
    // 获取所有日期
    const allDates = new Set<string>();
    incomingData.forEach(item => allDates.add(item.计量日期));
    productionData.forEach(item => allDates.add(item.日期));
    outgoingData.forEach(item => allDates.add(item.计量日期));

    const sortedDates = Array.from(allDates).sort();

    // 转换进厂数据
    const incomingChartData = {
      gradeAndMoisture: sortedDates.map(date => {
        const jindingItem = incomingData.find(item => item.计量日期 === date && item.发货单位名称 === '金鼎锌业');
        const fudingxiangItem = incomingData.find(item => item.计量日期 === date && item.发货单位名称 === '富鼎翔');

        return {
          date,
          jinding_grade: jindingItem ? Number(jindingItem.zn).toFixed(2) : '0.00',
          fudingxiang_grade: fudingxiangItem ? Number(fudingxiangItem.zn).toFixed(2) : '0.00',
          jinding_moisture: jindingItem ? Number(jindingItem['水份(%)']).toFixed(2) : '0.00',
          fudingxiang_moisture: fudingxiangItem ? Number(fudingxiangItem['水份(%)']).toFixed(2) : '0.00',
        };
      }),
      weightAndMetal: sortedDates.map(date => {
        const jindingItem = incomingData.find(item => item.计量日期 === date && item.发货单位名称 === '金鼎锌业');
        const fudingxiangItem = incomingData.find(item => item.计量日期 === date && item.发货单位名称 === '富鼎翔');

        return {
          date,
          jinding_weight: jindingItem ? Number(jindingItem['湿重(t)']).toFixed(1) : '0.0',
          fudingxiang_weight: fudingxiangItem ? Number(fudingxiangItem['湿重(t)']).toFixed(1) : '0.0',
          jinding_metal: jindingItem ? Number(jindingItem['Zn^M']).toFixed(1) : '0.0',
          fudingxiang_metal: fudingxiangItem ? Number(fudingxiangItem['Zn^M']).toFixed(1) : '0.0',
        };
      }),
    };

    // 转换生产数据
    const productionChartData = {
      originalOre: sortedDates.map(date => {
        const dayShift = productionData.find(item => item.日期 === date && item.班次 === '白班');
        const nightShift = productionData.find(item => item.日期 === date && item.班次 === '夜班');

        return {
          date,
          jinding_moisture: dayShift ? Number(dayShift['氧化锌原矿-水份（%）']).toFixed(2) : '0.00',
          fudingxiang_moisture: nightShift ? Number(nightShift['氧化锌原矿-水份（%）']).toFixed(2) : '0.00',
          jinding_zn_grade: dayShift ? Number(dayShift['氧化锌原矿-Zn全品位（%）']).toFixed(2) : '0.00',
          fudingxiang_zn_grade: nightShift ? Number(nightShift['氧化锌原矿-Zn全品位（%）']).toFixed(2) : '0.00',
          jinding_pb_grade: dayShift ? Number(dayShift['氧化锌原矿-Pb全品位（%）']).toFixed(2) : '0.00',
          fudingxiang_pb_grade: nightShift ? Number(nightShift['氧化锌原矿-Pb全品位（%）']).toFixed(2) : '0.00',
        };
      }),
      concentrate: sortedDates.map(date => {
        const dayShift = productionData.find(item => item.日期 === date && item.班次 === '白班');
        const nightShift = productionData.find(item => item.日期 === date && item.班次 === '夜班');

        return {
          date,
          jinding_zn_grade: dayShift ? Number(dayShift['氧化锌精矿-Zn品位（%）']).toFixed(2) : '0.00',
          fudingxiang_zn_grade: nightShift ? Number(nightShift['氧化锌精矿-Zn品位（%）']).toFixed(2) : '0.00',
          jinding_pb_grade: dayShift ? Number(dayShift['氧化锌精矿-Pb品位（%）']).toFixed(2) : '0.00',
          fudingxiang_pb_grade: nightShift ? Number(nightShift['氧化锌精矿-Pb品位（%）']).toFixed(2) : '0.00',
        };
      }),
      tailings: sortedDates.map(date => {
        const dayShift = productionData.find(item => item.日期 === date && item.班次 === '白班');
        const nightShift = productionData.find(item => item.日期 === date && item.班次 === '夜班');

        return {
          date,
          jinding_zn_grade: dayShift ? Number(dayShift['尾矿-Zn全品位（%）']).toFixed(2) : '0.00',
          fudingxiang_zn_grade: nightShift ? Number(nightShift['尾矿-Zn全品位（%）']).toFixed(2) : '0.00',
          jinding_pb_grade: dayShift ? Number(dayShift['尾矿-Pb全品位（%）']).toFixed(2) : '0.00',
          fudingxiang_pb_grade: nightShift ? Number(nightShift['尾矿-Pb全品位（%）']).toFixed(2) : '0.00',
        };
      }),
      recovery: sortedDates.map(date => {
        const dayShift = productionData.find(item => item.日期 === date && item.班次 === '白班');
        const nightShift = productionData.find(item => item.日期 === date && item.班次 === '夜班');

        return {
          date,
          jinding_zn_recovery: dayShift ? Number(dayShift['氧化矿Zn理论回收率（%）']).toFixed(2) : '0.00',
          fudingxiang_zn_recovery: nightShift ? Number(nightShift['氧化矿Zn理论回收率（%）']).toFixed(2) : '0.00',
          jinding_pb_recovery: '0.00', // 生产数据中没有Pb回收率
          fudingxiang_pb_recovery: '0.00',
        };
      }),
    };

    // 转换出厂数据
    const outgoingChartData = {
      gradeAndMoisture: sortedDates.map(date => {
        const jindingItem = outgoingData.find(item => item.计量日期 === date && item.发货单位名称 === '金鼎锌业');
        const fudingxiangItem = outgoingData.find(item => item.计量日期 === date && item.发货单位名称 === '富鼎翔');

        return {
          date,
          jinding_grade: jindingItem ? Number(jindingItem.zn).toFixed(2) : '0.00',
          fudingxiang_grade: fudingxiangItem ? Number(fudingxiangItem.zn).toFixed(2) : '0.00',
          internal_grade: (Math.random() * 3 + 52.5).toFixed(2), // 内部取样数据暂时使用模拟数据
          jinding_moisture: jindingItem ? Number(jindingItem['水份(%)']).toFixed(2) : '0.00',
          fudingxiang_moisture: fudingxiangItem ? Number(fudingxiangItem['水份(%)']).toFixed(2) : '0.00',
          internal_moisture: (Math.random() * 2 + 5.5).toFixed(2), // 内部取样数据暂时使用模拟数据
        };
      }),
      weightAndMetal: sortedDates.map(date => {
        const jindingItem = outgoingData.find(item => item.计量日期 === date && item.发货单位名称 === '金鼎锌业');
        const fudingxiangItem = outgoingData.find(item => item.计量日期 === date && item.发货单位名称 === '富鼎翔');

        return {
          date,
          jinding_weight: jindingItem ? Number(jindingItem['湿重(t)']).toFixed(1) : '0.0',
          fudingxiang_weight: fudingxiangItem ? Number(fudingxiangItem['湿重(t)']).toFixed(1) : '0.0',
          jinding_metal: jindingItem ? Number(jindingItem['Zn^M']).toFixed(1) : '0.0',
          fudingxiang_metal: fudingxiangItem ? Number(fudingxiangItem['Zn^M']).toFixed(1) : '0.0',
        };
      }),
    };

    return {
      incoming: incomingChartData,
      production: productionChartData,
      outgoing: outgoingChartData,
    };
  }, []);

  // 计算单个指标的统计信息
  const calculateSingleStat = useCallback((data: any[], jindingKey: string, fudingxiangKey: string, isPercentage: boolean = false) => {
    if (!data || data.length === 0) return { difference: '0', type: isPercentage ? '平均差值' : '累计差值' };

    let jindingTotal = 0;
    let fudingxiangTotal = 0;
    let validCount = 0;

    data.forEach(item => {
      const jindingValue = parseFloat(item[jindingKey] || '0');
      const fudingxiangValue = parseFloat(item[fudingxiangKey] || '0');

      if (!isNaN(jindingValue) && !isNaN(fudingxiangValue)) {
        jindingTotal += jindingValue;
        fudingxiangTotal += fudingxiangValue;
        validCount++;
      }
    });

    if (validCount === 0) return { difference: '0', type: isPercentage ? '平均差值' : '累计差值' };

    let difference: number;
    if (isPercentage) {
      // 百分比数据计算平均差值
      const jindingAvg = jindingTotal / validCount;
      const fudingxiangAvg = fudingxiangTotal / validCount;
      difference = Math.abs(jindingAvg - fudingxiangAvg);
    } else {
      // 重量数据计算累计差值
      difference = Math.abs(jindingTotal - fudingxiangTotal);
    }

    return {
      difference: difference.toFixed(isPercentage ? 2 : 1),
      type: isPercentage ? '平均差值' : '累计差值'
    };
  }, []);

  // 生成多指标趋势文本
  const generateMultiTrendText = useCallback((data: any[], indicators: Array<{jindingKey: string, fudingxiangKey: string, label: string, isPercentage: boolean}>) => {
    const results = indicators.map(indicator => {
      const stats = calculateSingleStat(data, indicator.jindingKey, indicator.fudingxiangKey, indicator.isPercentage);
      const unit = indicator.isPercentage ? '%' : 't';
      return `${indicator.label}${stats.type} ${stats.difference}${unit}`;
    });
    return results.join('\n');
  }, [calculateSingleStat]);

  // 生成单指标趋势文本（用于重量数据等）
  const generateSingleTrendText = useCallback((data: any[], jindingKey: string, fudingxiangKey: string, isPercentage: boolean = false) => {
    const stats = calculateSingleStat(data, jindingKey, fudingxiangKey, isPercentage);
    const unit = isPercentage ? '%' : 't';
    return `${stats.difference}${unit} ${stats.type}`;
  }, [calculateSingleStat]);

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
    },
    {
      icon: Package,
      label: "出厂样内部取样",
      description: "内部取样化验",
      dataSource: 'outgoing_sample' as DataSource,
      isNavigationButton: true,
      route: '/outgoing-sample-internal'
    },
    {
      icon: Mountain,
      label: "精矿堆摸底样",
      description: "精矿堆摸底取样",
      dataSource: 'shift_samples' as DataSource,
      isNavigationButton: true,
      route: '/concentrate-pile-sampling'
    }
  ];

  // 数据获取函数
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 构建API URL参数
      const params = new URLSearchParams({
        sampleType: selectedDataSource,
        limit: '50'
      });

      // 添加日期范围参数
      if (startDate) {
        params.append('startDate', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/lab-data?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // 转换API数据格式以匹配组件期望的格式
        const transformedData: SampleData[] = result.data.map((item: any) => ({
          id: item.id,
          record_date: item.日期 || item.出厂日期,
          shipment_date: item.出厂日期,
          element: item.元素 || item.化验元素,
          grade_value: parseFloat(item.品位 || item.出厂样品位) || 0,
          moisture_value: parseFloat(item.水分 || item.出厂样水分) || 0,
          shift: item.班次,
          mineral_type: item.矿物类型,
          supplier: item.供应商,
          purchasing_unit_name: item.采购单位,
          filter_press_number: item.压滤机编号,
          operator: item.操作员, // 添加操作员字段映射
          sample_number: item.样品编号, // 添加样品编号字段映射
          assayed_metal_element: item.元素,
          shipment_sample_grade_percentage: parseFloat(item.出厂样品位) || null,
          shipment_sample_moisture_percentage: parseFloat(item.出厂样水分) || null,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

        setTableData(transformedData);
        console.log(`成功获取 ${transformedData.length} 条 ${dataSourceLabel[selectedDataSource]} 数据`);
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
  }, [selectedDataSource, startDate, endDate]);

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

  // 格式化日期显示
  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  }, []);

  // 格式化数值显示
  const formatValue = useCallback((value: any, precision: number = 2) => {
    if (value === null || value === undefined || value === '') return '--';
    if (typeof value === 'number') return value.toFixed(precision);
    return value.toString();
  }, []);

  // 处理表单字段变化
  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [fieldKey]: value
    }));
  }, []);

  // 渲染详情对话框内容
  const renderDetailContent = useCallback(() => {
    if (!rawRowData || !selectedRowData) return null;

    const dataSourceTitles = {
      'shift_samples': '班样数据详情',
      'filter_samples': '压滤样数据详情',
      'incoming_samples': '进厂样数据详情',
      'outgoing_sample': '出厂样数据详情'
    };

    const dataSourceTables = {
      'shift_samples': '生产日报-FDX',
      'filter_samples': '压滤样化验记录',
      'incoming_samples': '进厂原矿-FDX',
      'outgoing_sample': '出厂精矿-FDX'
    };

    // 使用编辑数据或原始数据
    const displayData = isEditMode ? editFormData : rawRowData;

    // 根据数据源类型定义字段显示顺序（与数据库字段顺序一致）
    const getFieldsForDataSource = () => {
      switch (selectedDataSource) {
        case 'shift_samples':
          return [
            { key: 'id', label: '记录ID', type: 'text' },
            { key: '日期', label: '日期', type: 'date' },
            { key: '班次', label: '班次', type: 'text' },
            { key: '氧化锌原矿-湿重（t）', label: '氧化锌原矿-湿重（t）', type: 'number' },
            { key: '氧化锌原矿-水份（%）', label: '氧化锌原矿-水份（%）', type: 'number' },
            { key: '氧化锌原矿-干重（t）', label: '氧化锌原矿-干重（t）', type: 'number' },
            { key: '氧化锌原矿-Pb全品位（%）', label: '氧化锌原矿-Pb全品位（%）', type: 'number' },
            { key: '氧化锌原矿-Zn全品位（%）', label: '氧化锌原矿-Zn全品位（%）', type: 'number' },
            { key: '氧化锌原矿-Pb氧化率（%）', label: '氧化锌原矿-Pb氧化率（%）', type: 'number' },
            { key: '氧化锌原矿-Zn氧化率（%）', label: '氧化锌原矿-Zn氧化率（%）', type: 'number' },
            { key: '氧化锌原矿-全金属（t）', label: '氧化锌原矿-全金属（t）', type: 'number' },
            { key: '氧化锌精矿-数量（t）', label: '氧化锌精矿-数量（t）', type: 'number' },
            { key: '氧化锌精矿-Pb品位（%）', label: '氧化锌精矿-Pb品位（%）', type: 'number' },
            { key: '氧化锌精矿-Zn品位（%）', label: '氧化锌精矿-Zn品位（%）', type: 'number' },
            { key: '氧化锌精矿-Pb金属量（t）', label: '氧化锌精矿-Pb金属量（t）', type: 'number' },
            { key: '氧化锌精矿-Zn金属量（t）', label: '氧化锌精矿-Zn金属量（t）', type: 'number' },
            { key: '尾矿-数量（t）', label: '尾矿-数量（t）', type: 'number' },
            { key: '尾矿-Pb全品位（%）', label: '尾矿-Pb全品位（%）', type: 'number' },
            { key: '尾矿-Zn全品位（%）', label: '尾矿-Zn全品位（%）', type: 'number' },
            { key: '尾矿-Pb全金属（t）', label: '尾矿-Pb全金属（t）', type: 'number' },
            { key: '尾矿-Zn全金属（t）', label: '尾矿-Zn全金属（t）', type: 'number' },
            { key: '氧化矿Zn理论回收率（%）', label: '氧化矿Zn理论回收率（%）', type: 'number' },
            { key: 'created_at', label: '创建时间', type: 'datetime' },
            { key: 'updated_at', label: '更新时间', type: 'datetime' }
          ];
        case 'filter_samples':
          return [
            { key: 'id', label: '记录ID', type: 'text' },
            { key: '操作员', label: '操作员', type: 'text' },
            { key: '开始时间', label: '开始时间', type: 'datetime' },
            { key: '结束时间', label: '结束时间', type: 'datetime' },
            { key: '水份', label: '水份(%)', type: 'number' },
            { key: '铅品位', label: '铅品位(%)', type: 'number' },
            { key: '锌品位', label: '锌品位(%)', type: 'number' },
            { key: '备注', label: '备注', type: 'text' },
            { key: 'created_at', label: '创建时间', type: 'datetime' },
            { key: 'updated_at', label: '更新时间', type: 'datetime' }
          ];
        case 'incoming_samples':
          return [
            { key: 'id', label: '记录ID', type: 'text' },
            { key: '化验人员', label: '化验人员', type: 'text' },
            { key: '原矿类型', label: '原矿类型', type: 'text' },
            { key: '计量日期', label: '计量日期', type: 'date' },
            { key: '湿重(t)', label: '湿重(t)', type: 'number' },
            { key: '水份(%)', label: '水份(%)', type: 'number' },
            { key: '干重(t)', label: '干重(t)', type: 'number' },
            { key: 'Pb', label: 'Pb品位(%)', type: 'number' },
            { key: 'Zn', label: 'Zn品位(%)', type: 'number' },
            { key: 'Zn氧化率', label: 'Zn氧化率(%)', type: 'number' },
            { key: 'Pb^M', label: 'Pb金属量(t)', type: 'number' },
            { key: 'Zn^M', label: 'Zn金属量(t)', type: 'number' },
            { key: 'Zn氧化率^M', label: 'Zn氧化率^M(%)', type: 'number' },
            { key: '发货单位名称', label: '发货单位名称', type: 'text' },
            { key: '收货单位名称', label: '收货单位名称', type: 'text' },
            { key: 'created_at', label: '创建时间', type: 'datetime' },
            { key: 'updated_at', label: '更新时间', type: 'datetime' }
          ];
        case 'outgoing_sample':
          return [
            { key: 'id', label: '记录ID', type: 'text' },
            { key: '化验人员', label: '化验人员', type: 'text' },
            { key: '样品编号', label: '样品编号', type: 'text' },
            { key: '计量日期', label: '计量日期', type: 'date' },
            { key: '车牌号', label: '车牌号', type: 'text' },
            { key: '湿重(t)', label: '湿重(t)', type: 'number' },
            { key: '水份(%)', label: '水份(%)', type: 'number' },
            { key: '干重(t)', label: '干重(t)', type: 'number' },
            { key: 'Pb', label: 'Pb品位(%)', type: 'number' },
            { key: 'Zn', label: 'Zn品位(%)', type: 'number' },
            { key: 'Pb^M', label: 'Pb金属量(t)', type: 'number' },
            { key: 'Zn^M', label: 'Zn金属量(t)', type: 'number' },
            { key: '发货单位名称', label: '发货单位名称', type: 'text' },
            { key: '收货单位名称', label: '收货单位名称', type: 'text' },
            { key: '流向', label: '流向', type: 'text' },
            { key: 'created_at', label: '创建时间', type: 'datetime' },
            { key: 'updated_at', label: '更新时间', type: 'datetime' }
          ];
        default:
          return [];
      }
    };

    const fields = getFieldsForDataSource();

    return (
      <div className="space-y-4">
        <div className="text-center pb-2">
          <h3 className="text-lg font-semibold text-primary">{dataSourceTitles[selectedDataSource]}</h3>
          <Badge variant="secondary" className="mt-1">
            {dataSourceTables[selectedDataSource]}
          </Badge>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">基础信息</CardTitle>
              {/* 编辑按钮移动到基础信息框右上角 */}
              <div className="flex items-center gap-1">
                {isEditMode ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="h-8 w-8 p-0"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="h-8 w-8 p-0"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditMode}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3">
              {fields.filter(field => field.key !== 'created_at' && field.key !== 'updated_at' && field.key !== 'id').map((field) => {
                const value = displayData[field.key];

                // 不可编辑的字段（ID和系统时间字段）
                const isReadOnlyField = field.key === 'id' || field.type === 'datetime';

                if (isEditMode && !isReadOnlyField) {
                  // 编辑模式下的输入组件
                  return (
                    <div key={field.key} className="space-y-2 py-2 border-b border-border/30 last:border-b-0">
                      <Label htmlFor={field.key} className="text-sm font-medium">
                        {field.label}
                      </Label>
                      {field.type === 'number' ? (
                        <Input
                          id={field.key}
                          type="number"
                          step="0.01"
                          value={value || ''}
                          onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
                          className="text-sm"
                        />
                      ) : field.type === 'date' ? (
                        <Input
                          id={field.key}
                          type="date"
                          value={value || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="text-sm"
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type="text"
                          value={value || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="text-sm"
                        />
                      )}
                    </div>
                  );
                } else {
                  // 查看模式下的显示
                  let displayValue: string;

                  switch (field.type) {
                    case 'datetime':
                      displayValue = formatDate(value);
                      break;
                    case 'date':
                      displayValue = value || '--';
                      break;
                    case 'number':
                      displayValue = formatValue(value, 2);
                      break;
                    default:
                      displayValue = value || '--';
                  }

                  return (
                    <div key={field.key} className="flex justify-between items-start py-2 border-b border-border/30 last:border-b-0">
                      <span className="font-medium text-sm text-foreground/80 min-w-0 flex-shrink-0 mr-3">
                        {field.label}
                      </span>
                      <span className="text-sm text-right break-all">
                        {displayValue}
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">系统信息</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3">
              {fields.filter(field => field.key === 'created_at' || field.key === 'updated_at').map((field) => {
                const value = displayData[field.key];
                const displayValue = formatDate(value);

                return (
                  <div key={field.key} className="flex justify-between items-start py-2 border-b border-border/30 last:border-b-0">
                    <span className="font-medium text-sm text-muted-foreground min-w-0 flex-shrink-0 mr-3">
                      {field.label}
                    </span>
                    <span className="text-xs text-muted-foreground text-right break-all">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }, [rawRowData, selectedRowData, selectedDataSource, formatDate, formatValue, isEditMode, editFormData, handleFieldChange]);

  // 进入编辑模式
  const handleEditMode = useCallback(() => {
    if (rawRowData) {
      setEditFormData({ ...rawRowData });
      setIsEditMode(true);
    }
  }, [rawRowData]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditFormData(null);
  }, []);

  // 保存编辑
  const handleSaveEdit = useCallback(async () => {
    if (!editFormData || !selectedRowData) return;

    setIsSaving(true);
    try {
      // 获取用户头信息
      const getCurrentUserHeaders = async (): Promise<Record<string, string>> => {
        try {
          const currentUserId = localStorage.getItem('fdx_current_user_id');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (currentUserId) {
            headers['x-user-id'] = currentUserId;
          }

          const sessionData = localStorage.getItem('fdx_session_data');
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              if (session.token) {
                headers['Authorization'] = `Bearer ${session.token}`;
              }
            } catch (e) {
              console.warn('解析会话数据失败:', e);
            }
          }

          return headers;
        } catch (error) {
          console.error('获取用户头信息失败:', error);
          return {
            'Content-Type': 'application/json',
          };
        }
      };

      const headers = await getCurrentUserHeaders();

      const response = await fetch('/api/lab-data/update', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          sampleType: selectedDataSource,
          id: selectedRowData.id,
          data: editFormData
        })
      });

      const result = await response.json();

      if (result.success) {
        // 更新本地数据
        setRawRowData(editFormData);
        setIsEditMode(false);
        setEditFormData(null);

        // 刷新表格数据
        await fetchData();

        console.log('数据保存成功');
      } else {
        console.error('保存失败:', result.error);
        alert('保存失败: ' + result.error);
      }
    } catch (error) {
      console.error('保存数据失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [editFormData, selectedRowData, selectedDataSource, fetchData]);



  // 行点击处理 - 获取完整数据并打开详情对话框
  const handleRowClick = useCallback(async (item: SampleData) => {
    try {
      // 获取该记录的完整原始数据
      // 对于合成ID（如 "8-zn"），需要提取实际的数据库ID
      const actualId = item.id.includes('-') ? item.id.split('-')[0] : item.id;

      const response = await fetch(`/api/lab-data/detail?sampleType=${selectedDataSource}&id=${actualId}`);
      const result = await response.json();

      if (result.success && result.data) {
        // 使用获取到的完整原始数据
        const rawData = result.data;

        // 为了保持兼容性，我们需要将原始数据转换为显示格式
        let displayData = { ...item };

        // 如果是班样数据，需要根据当前选择的元素类型设置正确的显示数据
        if (selectedDataSource === 'shift_samples') {
          const elementType = item.id.includes('-') ? item.id.split('-')[1] : 'zn';

          if (elementType === 'zn') {
            displayData.品位 = rawData['氧化锌原矿-Zn全品位（%）'] || rawData['氧化锌精矿-Zn品位（%）'] || 0;
            displayData.水分 = rawData['氧化锌原矿-水份（%）'] || 0;
            displayData.矿物类型 = rawData['氧化锌原矿-Zn全品位（%）'] ? '氧化锌原矿' : '氧化锌精矿';
          } else if (elementType === 'pb') {
            displayData.品位 = rawData['氧化锌原矿-Pb全品位（%）'] || rawData['氧化锌精矿-Pb品位（%）'] || 0;
            displayData.水分 = rawData['氧化锌原矿-水份（%）'] || 0;
            displayData.矿物类型 = rawData['氧化锌原矿-Pb全品位（%）'] ? '氧化锌原矿' : '氧化锌精矿';
          }
        } else if (selectedDataSource === 'filter_samples') {
          const elementType = item.id.includes('-') ? item.id.split('-')[1] : 'zn';

          if (elementType === 'zn') {
            displayData.品位 = rawData['锌品位'] || 0;
            displayData.水分 = rawData['水份'] || 0;
          } else if (elementType === 'pb') {
            displayData.品位 = rawData['铅品位'] || 0;
            displayData.水分 = rawData['水份'] || 0;
          }
        }

        setSelectedRowData(displayData);
        setRawRowData(rawData);
        setIsDetailDialogOpen(true);
        // 重置编辑状态
        setIsEditMode(false);
        setEditFormData(null);
      } else {
        console.error('获取详细数据失败:', result.error);
      }
    } catch (error) {
      console.error('获取详细数据失败:', error);
    }
  }, [selectedDataSource]);

  // 页面初始化和数据刷新
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
  }, [fetchData]);

  // 监听数据源变化，自动刷新数据
  useEffect(() => {
    if (!isInitialLoading) {
      fetchData();
    }
  }, [selectedDataSource, fetchData, isInitialLoading]);

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
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            专项作业区
          </CardTitle>
          <CardDescription>
            点击选择专项作业区
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {workAreas.map((area, index) => {
              const IconComponent = area.icon;
              // 新增的作业区（索引4和5）使用更小的字号
              const isNewArea = index >= 4;

              return (
                <Button
                  key={`${area.dataSource}-${area.route}`}
                  variant="outline"
                  className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-primary/5 hover:border-primary"
                  onClick={() => handleWorkAreaClick(area)}
                >
                  <IconComponent className={`${isNewArea ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-6 w-6 sm:h-8 sm:w-8'} text-primary`} />
                  <div className="text-center">
                    <h3 className={`font-semibold ${isNewArea ? 'text-xs' : 'text-xs sm:text-sm'}`}>{area.label}</h3>
                    <p className={`text-muted-foreground hidden sm:block ${isNewArea ? 'text-xs' : 'text-xs'}`}>{area.description}</p>
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
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              化验数据查询
            </CardTitle>
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
                      {/* 班样字段顺序：日期，班次，矿物类型，元素，品位(%)，水分(%) */}
                      {selectedDataSource === 'shift_samples' && (
                        <>
                          <TableHead>日期</TableHead>
                          <TableHead>班次</TableHead>
                          <TableHead>矿物类型</TableHead>
                          <TableHead>元素</TableHead>
                          <TableHead>品位(%)</TableHead>
                          <TableHead>水分(%)</TableHead>
                        </>
                      )}

                      {/* 压滤样字段 */}
                      {selectedDataSource === 'filter_samples' && (
                        <>
                          <TableHead>日期</TableHead>
                          <TableHead>元素</TableHead>
                          <TableHead>品位(%)</TableHead>
                          <TableHead>水分(%)</TableHead>
                          <TableHead>操作员</TableHead>
                        </>
                      )}

                      {/* 进厂样字段 */}
                      {selectedDataSource === 'incoming_samples' && (
                        <>
                          <TableHead>日期</TableHead>
                          <TableHead>元素</TableHead>
                          <TableHead>品位(%)</TableHead>
                          <TableHead>水分(%)</TableHead>
                          <TableHead>供应商</TableHead>
                          <TableHead>原矿类型</TableHead>
                        </>
                      )}

                      {/* 出厂样字段：日期，样品编号，元素，品位(%)，水分(%)，采购单位 */}
                      {selectedDataSource === 'outgoing_sample' && (
                        <>
                          <TableHead>日期</TableHead>
                          <TableHead>样品编号</TableHead>
                          <TableHead>元素</TableHead>
                          <TableHead>品位(%)</TableHead>
                          <TableHead>水分(%)</TableHead>
                          <TableHead>采购单位</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(item)}
                      >
                        {/* 班样数据显示：日期，班次，矿物类型，元素，品位(%)，水分(%) */}
                        {selectedDataSource === 'shift_samples' && (
                          <>
                            <TableCell>{item.record_date}</TableCell>
                            <TableCell>{item.shift}</TableCell>
                            <TableCell>{item.mineral_type}</TableCell>
                            <TableCell>{item.element}</TableCell>
                            <TableCell>{item.grade_value?.toFixed(2) || '-'}</TableCell>
                            <TableCell>{item.moisture_value?.toFixed(2) || '-'}</TableCell>
                          </>
                        )}

                        {/* 压滤样数据显示 */}
                        {selectedDataSource === 'filter_samples' && (
                          <>
                            <TableCell>{item.record_date}</TableCell>
                            <TableCell>{item.element}</TableCell>
                            <TableCell>{item.grade_value?.toFixed(2) || '-'}</TableCell>
                            <TableCell>{item.moisture_value?.toFixed(2) || '-'}</TableCell>
                            <TableCell>{item.operator || '-'}</TableCell>
                          </>
                        )}

                        {/* 进厂样数据显示 */}
                        {selectedDataSource === 'incoming_samples' && (
                          <>
                            <TableCell>{item.record_date}</TableCell>
                            <TableCell>{item.element}</TableCell>
                            <TableCell>{item.grade_value?.toFixed(2) || '-'}</TableCell>
                            <TableCell>{item.moisture_value?.toFixed(2) || '-'}</TableCell>
                            <TableCell>{item.supplier}</TableCell>
                            <TableCell>{item.mineral_type}</TableCell>
                          </>
                        )}

                        {/* 出厂样数据显示：日期，样品编号，元素，品位(%)，水分(%)，采购单位 */}
                        {selectedDataSource === 'outgoing_sample' && (
                          <>
                            <TableCell>{item.shipment_date}</TableCell>
                            <TableCell>{item.sample_number || '-'}</TableCell>
                            <TableCell>{item.element}</TableCell>
                            <TableCell>{item.grade_value?.toFixed(2) || '-'}</TableCell>
                            <TableCell>{item.moisture_value?.toFixed(2) || '-'}</TableCell>
                            <TableCell>{item.purchasing_unit_name}</TableCell>
                          </>
                        )}
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
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              数据对比分析
            </CardTitle>
            <CardDescription>
              金鼎 VS 富鼎翔各环节数据对比
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshComparisonData}
              disabled={isRefreshingComparison}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshingComparison ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 数据对比分析专用日期范围选择器 */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              数据对比日期范围
            </h3>
            <div className="space-y-4">
              {/* 日期输入 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
                  <Input
                    type="date"
                    value={comparisonStartDate ? comparisonStartDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setComparisonStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
                  <Input
                    type="date"
                    value={comparisonEndDate ? comparisonEndDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setComparisonEndDate(e.target.value ? new Date(e.target.value) : undefined)}
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
                        trendText={generateMultiTrendText(chartData.incoming.gradeAndMoisture, [
                          { jindingKey: "jinding_grade", fudingxiangKey: "fudingxiang_grade", label: "品位", isPercentage: true },
                          { jindingKey: "jinding_moisture", fudingxiangKey: "fudingxiang_moisture", label: "水份", isPercentage: true }
                        ])}
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
                        trendText={generateMultiTrendText(chartData.incoming.weightAndMetal, [
                          { jindingKey: "jinding_weight", fudingxiangKey: "fudingxiang_weight", label: "湿重", isPercentage: false },
                          { jindingKey: "jinding_metal", fudingxiangKey: "fudingxiang_metal", label: "金属量", isPercentage: false }
                        ])}
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>

                {/* 进厂数据表格 */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">进厂原矿详细数据</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">日期</TableHead>
                          <TableHead className="text-center">金鼎品位(%)</TableHead>
                          <TableHead className="text-center">富鼎翔品位(%)</TableHead>
                          <TableHead className="text-center">金鼎水分(%)</TableHead>
                          <TableHead className="text-center">富鼎翔水分(%)</TableHead>
                          <TableHead className="text-center">金鼎重量(t)</TableHead>
                          <TableHead className="text-center">富鼎翔重量(t)</TableHead>
                          <TableHead className="text-center">金鼎金属量(t)</TableHead>
                          <TableHead className="text-center">富鼎翔金属量(t)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chartData.incoming.gradeAndMoisture.map((item, index) => {
                          const weightItem = chartData.incoming.weightAndMetal[index];
                          return (
                            <TableRow key={item.date}>
                              <TableCell className="text-center font-medium">{item.date}</TableCell>
                              <TableCell className="text-center">{item.jinding_grade}</TableCell>
                              <TableCell className="text-center">{item.fudingxiang_grade}</TableCell>
                              <TableCell className="text-center">{item.jinding_moisture}</TableCell>
                              <TableCell className="text-center">{item.fudingxiang_moisture}</TableCell>
                              <TableCell className="text-center">{weightItem?.jinding_weight || '--'}</TableCell>
                              <TableCell className="text-center">{weightItem?.fudingxiang_weight || '--'}</TableCell>
                              <TableCell className="text-center">{weightItem?.jinding_metal || '--'}</TableCell>
                              <TableCell className="text-center">{weightItem?.fudingxiang_metal || '--'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="production" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">生产过程数据分析</h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.production.originalOre}
                        title="原矿水份% + 原矿Zn品位% + 原矿Pb品位% 对比"
                        description="金鼎 VS 富鼎翔原矿入选前的关键指标对比"
                        lines={[
                          { dataKey: "jinding_moisture" },
                          { dataKey: "fudingxiang_moisture" },
                          { dataKey: "jinding_zn_grade" },
                          { dataKey: "fudingxiang_zn_grade" },
                          { dataKey: "jinding_pb_grade" },
                          { dataKey: "fudingxiang_pb_grade" },
                        ]}
                        trendText={generateMultiTrendText(chartData.production.originalOre, [
                          { jindingKey: "jinding_moisture", fudingxiangKey: "fudingxiang_moisture", label: "原矿水份", isPercentage: true },
                          { jindingKey: "jinding_zn_grade", fudingxiangKey: "fudingxiang_zn_grade", label: "原矿Zn品位", isPercentage: true },
                          { jindingKey: "jinding_pb_grade", fudingxiangKey: "fudingxiang_pb_grade", label: "原矿Pb品位", isPercentage: true }
                        ])}
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.production.concentrate}
                        title="精矿Zn品位% + 精矿Pb品位% 对比"
                        description="金鼎 VS 富鼎翔精矿产品质量指标对比"
                        lines={[
                          { dataKey: "jinding_zn_grade" },
                          { dataKey: "fudingxiang_zn_grade" },
                          { dataKey: "jinding_pb_grade" },
                          { dataKey: "fudingxiang_pb_grade" },
                        ]}
                        trendText={generateMultiTrendText(chartData.production.concentrate, [
                          { jindingKey: "jinding_zn_grade", fudingxiangKey: "fudingxiang_zn_grade", label: "精矿Zn品位", isPercentage: true },
                          { jindingKey: "jinding_pb_grade", fudingxiangKey: "fudingxiang_pb_grade", label: "精矿Pb品位", isPercentage: true }
                        ])}
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.production.tailings}
                        title="尾矿Zn品位% + 尾矿Pb品位% 对比"
                        description="金鼎 VS 富鼎翔尾矿损失控制指标对比"
                        lines={[
                          { dataKey: "jinding_zn_grade" },
                          { dataKey: "fudingxiang_zn_grade" },
                          { dataKey: "jinding_pb_grade" },
                          { dataKey: "fudingxiang_pb_grade" },
                        ]}
                        trendText={generateMultiTrendText(chartData.production.tailings, [
                          { jindingKey: "jinding_zn_grade", fudingxiangKey: "fudingxiang_zn_grade", label: "尾矿Zn品位", isPercentage: true },
                          { jindingKey: "jinding_pb_grade", fudingxiangKey: "fudingxiang_pb_grade", label: "尾矿Pb品位", isPercentage: true }
                        ])}
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.production.recovery}
                        title="回收率% 对比"
                        description="金鼎 VS 富鼎翔金属回收效率指标对比"
                        lines={[
                          { dataKey: "jinding_zn_recovery" },
                          { dataKey: "fudingxiang_zn_recovery" },
                          { dataKey: "jinding_pb_recovery" },
                          { dataKey: "fudingxiang_pb_recovery" },
                        ]}
                        trendText={generateMultiTrendText(chartData.production.recovery, [
                          { jindingKey: "jinding_zn_recovery", fudingxiangKey: "fudingxiang_zn_recovery", label: "Zn回收率", isPercentage: true },
                          { jindingKey: "jinding_pb_recovery", fudingxiangKey: "fudingxiang_pb_recovery", label: "Pb回收率", isPercentage: true }
                        ])}
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>

                {/* 生产数据表格 */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">生产过程详细数据</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">日期</TableHead>
                          <TableHead className="text-center">原矿水分-金鼎(%)</TableHead>
                          <TableHead className="text-center">原矿水分-富鼎翔(%)</TableHead>
                          <TableHead className="text-center">原矿Zn品位-金鼎(%)</TableHead>
                          <TableHead className="text-center">原矿Zn品位-富鼎翔(%)</TableHead>
                          <TableHead className="text-center">精矿Zn品位-金鼎(%)</TableHead>
                          <TableHead className="text-center">精矿Zn品位-富鼎翔(%)</TableHead>
                          <TableHead className="text-center">Zn回收率-金鼎(%)</TableHead>
                          <TableHead className="text-center">Zn回收率-富鼎翔(%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chartData.production.originalOre.map((item, index) => {
                          const concentrateItem = chartData.production.concentrate[index];
                          const recoveryItem = chartData.production.recovery[index];
                          return (
                            <TableRow key={item.date}>
                              <TableCell className="text-center font-medium">{item.date}</TableCell>
                              <TableCell className="text-center">{item.jinding_moisture}</TableCell>
                              <TableCell className="text-center">{item.fudingxiang_moisture}</TableCell>
                              <TableCell className="text-center">{item.jinding_zn_grade}</TableCell>
                              <TableCell className="text-center">{item.fudingxiang_zn_grade}</TableCell>
                              <TableCell className="text-center">{concentrateItem?.jinding_zn_grade || '--'}</TableCell>
                              <TableCell className="text-center">{concentrateItem?.fudingxiang_zn_grade || '--'}</TableCell>
                              <TableCell className="text-center">{recoveryItem?.jinding_zn_recovery || '--'}</TableCell>
                              <TableCell className="text-center">{recoveryItem?.fudingxiang_zn_recovery || '--'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outgoing" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">出厂精矿质量分析</h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.outgoing.gradeAndMoisture}
                        title="金鼎 VS 富鼎翔 VS 内部取样 品位%+水份% 对比"
                        description="出厂精矿品位和水分三方数据对比分析"
                        lines={[
                          { dataKey: "jinding_grade" },
                          { dataKey: "fudingxiang_grade" },
                          { dataKey: "internal_grade" },
                          { dataKey: "jinding_moisture" },
                          { dataKey: "fudingxiang_moisture" },
                          { dataKey: "internal_moisture" },
                        ]}
                        trendText={generateMultiTrendText(chartData.outgoing.gradeAndMoisture, [
                          { jindingKey: "jinding_grade", fudingxiangKey: "fudingxiang_grade", label: "品位", isPercentage: true },
                          { jindingKey: "jinding_moisture", fudingxiangKey: "fudingxiang_moisture", label: "水份", isPercentage: true }
                        ])}
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
                        trendText={generateMultiTrendText(chartData.outgoing.weightAndMetal, [
                          { jindingKey: "jinding_weight", fudingxiangKey: "fudingxiang_weight", label: "湿重", isPercentage: false },
                          { jindingKey: "jinding_metal", fudingxiangKey: "fudingxiang_metal", label: "金属量", isPercentage: false }
                        ])}
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>

                {/* 出厂数据表格 */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">出厂精矿详细数据</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">日期</TableHead>
                          <TableHead className="text-center">金鼎品位(%)</TableHead>
                          <TableHead className="text-center">富鼎翔品位(%)</TableHead>
                          <TableHead className="text-center">内部取样品位(%)</TableHead>
                          <TableHead className="text-center">金鼎水分(%)</TableHead>
                          <TableHead className="text-center">富鼎翔水分(%)</TableHead>
                          <TableHead className="text-center">内部取样水分(%)</TableHead>
                          <TableHead className="text-center">金鼎重量(t)</TableHead>
                          <TableHead className="text-center">富鼎翔重量(t)</TableHead>
                          <TableHead className="text-center">金鼎金属量(t)</TableHead>
                          <TableHead className="text-center">富鼎翔金属量(t)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chartData.outgoing.gradeAndMoisture.map((item, index) => {
                          const weightItem = chartData.outgoing.weightAndMetal[index];
                          return (
                            <TableRow key={item.date}>
                              <TableCell className="text-center font-medium">{item.date}</TableCell>
                              <TableCell className="text-center">{item.jinding_grade}</TableCell>
                              <TableCell className="text-center">{item.fudingxiang_grade}</TableCell>
                              <TableCell className="text-center">{item.internal_grade}</TableCell>
                              <TableCell className="text-center">{item.jinding_moisture}</TableCell>
                              <TableCell className="text-center">{item.fudingxiang_moisture}</TableCell>
                              <TableCell className="text-center">{item.internal_moisture}</TableCell>
                              <TableCell className="text-center">{weightItem?.jinding_weight || '--'}</TableCell>
                              <TableCell className="text-center">{weightItem?.fudingxiang_weight || '--'}</TableCell>
                              <TableCell className="text-center">{weightItem?.jinding_metal || '--'}</TableCell>
                              <TableCell className="text-center">{weightItem?.fudingxiang_metal || '--'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) {
          // 关闭对话框时重置所有状态
          setSelectedRowData(null);
          setRawRowData(null);
          setIsEditMode(false);
          setEditFormData(null);
        }
      }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            {/* 简化Header布局：中心标题，右侧关闭按钮 */}
            <div className="flex items-center justify-between min-h-[40px]">
              {/* 中心：标题 */}
              <div className="flex items-center gap-2 flex-1 justify-center">
                <FlaskConical className="h-4 w-4" />
                <DialogTitle className="text-base">化验数据详情</DialogTitle>
              </div>

              {/* 右侧：关闭按钮 */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsDetailDialogOpen(false)}
                className="h-8 w-8 p-0 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-center text-sm">
              {isEditMode ? '编辑化验记录信息' : '查看完整的化验记录信息'}
            </DialogDescription>
          </DialogHeader>
          {renderDetailContent()}
        </DialogContent>
      </Dialog>

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
