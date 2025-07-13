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
import { PaginatedTable } from "@/components/ui/paginated-table";
import { Skeleton } from "@/components/ui/skeleton";
import { HamburgerMenu } from "@/components/hamburger-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Mountain,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  TruckIcon
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatValue as formatValueUtil, formatWeight, formatPercentage } from '@/lib/formatters';

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
  // 生产数据字段 - 白班和夜班分别配置
  // 原矿数据
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
  jinding_day_zn_grade: {
    label: "金鼎白班Zn品位",
    color: "var(--chart-1)",
  },
  jinding_night_zn_grade: {
    label: "金鼎夜班Zn品位",
    color: "var(--chart-2)",
  },
  fudingxiang_day_zn_grade: {
    label: "富鼎翔白班Zn品位",
    color: "var(--chart-3)",
  },
  fudingxiang_night_zn_grade: {
    label: "富鼎翔夜班Zn品位",
    color: "var(--chart-4)",
  },
  jinding_day_pb_grade: {
    label: "金鼎白班Pb品位",
    color: "var(--chart-1)",
  },
  jinding_night_pb_grade: {
    label: "金鼎夜班Pb品位",
    color: "var(--chart-2)",
  },
  fudingxiang_day_pb_grade: {
    label: "富鼎翔白班Pb品位",
    color: "var(--chart-3)",
  },
  fudingxiang_night_pb_grade: {
    label: "富鼎翔夜班Pb品位",
    color: "var(--chart-4)",
  },
  // 精矿数据
  jinding_day_concentrate_zn: {
    label: "金鼎白班精矿Zn",
    color: "var(--chart-1)",
  },
  jinding_night_concentrate_zn: {
    label: "金鼎夜班精矿Zn",
    color: "var(--chart-2)",
  },
  fudingxiang_day_concentrate_zn: {
    label: "富鼎翔白班精矿Zn",
    color: "var(--chart-3)",
  },
  fudingxiang_night_concentrate_zn: {
    label: "富鼎翔夜班精矿Zn",
    color: "var(--chart-4)",
  },
  jinding_day_concentrate_pb: {
    label: "金鼎白班精矿Pb",
    color: "var(--chart-1)",
  },
  jinding_night_concentrate_pb: {
    label: "金鼎夜班精矿Pb",
    color: "var(--chart-2)",
  },
  fudingxiang_day_concentrate_pb: {
    label: "富鼎翔白班精矿Pb",
    color: "var(--chart-3)",
  },
  fudingxiang_night_concentrate_pb: {
    label: "富鼎翔夜班精矿Pb",
    color: "var(--chart-4)",
  },
  // 尾矿数据
  jinding_day_tailings_zn: {
    label: "金鼎白班尾矿Zn",
    color: "var(--chart-1)",
  },
  jinding_night_tailings_zn: {
    label: "金鼎夜班尾矿Zn",
    color: "var(--chart-2)",
  },
  fudingxiang_day_tailings_zn: {
    label: "富鼎翔白班尾矿Zn",
    color: "var(--chart-3)",
  },
  fudingxiang_night_tailings_zn: {
    label: "富鼎翔夜班尾矿Zn",
    color: "var(--chart-4)",
  },
  jinding_day_tailings_pb: {
    label: "金鼎白班尾矿Pb",
    color: "var(--chart-1)",
  },
  jinding_night_tailings_pb: {
    label: "金鼎夜班尾矿Pb",
    color: "var(--chart-2)",
  },
  fudingxiang_day_tailings_pb: {
    label: "富鼎翔白班尾矿Pb",
    color: "var(--chart-3)",
  },
  fudingxiang_night_tailings_pb: {
    label: "富鼎翔夜班尾矿Pb",
    color: "var(--chart-4)",
  },
  // 回收率数据
  jinding_day_zn_recovery: {
    label: "金鼎白班Zn回收率",
    color: "var(--chart-1)",
  },
  jinding_night_zn_recovery: {
    label: "金鼎夜班Zn回收率",
    color: "var(--chart-2)",
  },
  fudingxiang_day_zn_recovery: {
    label: "富鼎翔白班Zn回收率",
    color: "var(--chart-3)",
  },
  fudingxiang_night_zn_recovery: {
    label: "富鼎翔夜班Zn回收率",
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
  // 如果没有提供日期范围，默认使用全部周期范围
  const start = startDate || new Date('2025-04-26');
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

// 可排序表头组件
interface SortableTableHeadProps {
  field: string;
  children: React.ReactNode;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

function SortableTableHead({ field, children, sortField, sortDirection, onSort }: SortableTableHeadProps) {
  const isActive = sortField === field;

  return (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
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

  // 排序状态管理
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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



  // 富科专用图表数据状态
  const [fdxChartData, setFdxChartData] = useState<any>({
    production: [],
    concentration: []
  });

  // 日期选择状态 - 默认为全部周期的日期范围
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    // 全部周期开始日期：2025年4月26日
    return new Date('2025-04-26');
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

  // 获取JDXY数据
  const fetchJDXYData = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/lab/jdxy-data', {
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
      return result.data || { incoming: [], outgoing: [], production: [] };
    } catch (error) {
      console.error('获取JDXY数据失败:', error);
      return { incoming: [], outgoing: [], production: [] };
    }
  }, []);

  // 获取FDX数据
  const fetchFDXData = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/lab/fdx-data', {
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
      return result.data || { incoming: [], outgoing: [], production: [], internalSample: [] };
    } catch (error) {
      console.error('获取FDX数据失败:', error);
      return { incoming: [], outgoing: [], production: [], internalSample: [] };
    }
  }, []);



  // 转换Supabase数据为图表数据格式 - 重新设计为分别从不同数据表获取数据
  const transformSupabaseDataToChartData = useCallback((jindingData: any, fdxData: any) => {
    // 获取所有日期
    const allDates = new Set<string>();

    // 从金鼎数据中获取日期
    jindingData.incoming?.forEach((item: any) => allDates.add(item.计量日期));
    jindingData.production?.forEach((item: any) => allDates.add(item.日期));
    jindingData.outgoing?.forEach((item: any) => allDates.add(item.计量日期));

    // 从富鼎翔数据中获取日期
    fdxData.incoming?.forEach((item: any) => allDates.add(item.计量日期));
    fdxData.production?.forEach((item: any) => allDates.add(item.日期));
    fdxData.outgoing?.forEach((item: any) => allDates.add(item.计量日期));

    const sortedDates = Array.from(allDates).sort();

    // 转换进厂数据 - 分别从进厂原矿-JDXY和进厂原矿-FDX表获取数据
    const incomingChartData = {
      gradeAndMoisture: sortedDates.map(date => {
        const jindingItem = jindingData.incoming?.find((item: any) => item.计量日期 === date);
        const fudingxiangItem = fdxData.incoming?.find((item: any) => item.计量日期 === date);

        return {
          date,
          jinding_grade: jindingItem ? Number(jindingItem.Zn || 0).toFixed(2) : '0.00',
          fudingxiang_grade: fudingxiangItem ? Number(fudingxiangItem.Zn || 0).toFixed(2) : '0.00',
          jinding_moisture: jindingItem ? Number(jindingItem['水份(%)'] || 0).toFixed(2) : '0.00',
          fudingxiang_moisture: fudingxiangItem ? Number(fudingxiangItem['水份(%)'] || 0).toFixed(2) : '0.00',
        };
      }),
      weightAndMetal: sortedDates.map(date => {
        const jindingItem = jindingData.incoming?.find((item: any) => item.计量日期 === date);
        const fudingxiangItem = fdxData.incoming?.find((item: any) => item.计量日期 === date);

        return {
          date,
          jinding_weight: jindingItem ? Number(jindingItem['湿重(t)'] || 0).toFixed(1) : '0.0',
          fudingxiang_weight: fudingxiangItem ? Number(fudingxiangItem['湿重(t)'] || 0).toFixed(1) : '0.0',
          jinding_metal: jindingItem ? Number(jindingItem['Zn^M'] || 0).toFixed(1) : '0.0',
          fudingxiang_metal: fudingxiangItem ? Number(fudingxiangItem['Zn^M'] || 0).toFixed(1) : '0.0',
        };
      }),
    };

    // 转换生产数据 - 分别从生产班报-JDXY和生产班报-FDX表获取数据
    const productionChartData = {
      originalOre: sortedDates.map(date => {
        // 从JDXY表获取金鼎数据（分别保存白班和夜班）
        const jindingDayShift = jindingData.production?.find((item: any) => item.日期 === date && item.班次 === '白班');
        const jindingNightShift = jindingData.production?.find((item: any) => item.日期 === date && item.班次 === '夜班');

        // 从FDX表获取富鼎翔数据（分别保存白班和夜班）
        const fdxDayShift = fdxData.production?.find((item: any) => item.日期 === date && item.班次 === '白班');
        const fdxNightShift = fdxData.production?.find((item: any) => item.日期 === date && item.班次 === '夜班');

        return {
          date,
          // 水份数据 - 四条线
          jinding_day_moisture: jindingDayShift ? Number(jindingDayShift['氧化锌原矿-水份（%）'] || 0).toFixed(2) : '0.00',
          jinding_night_moisture: jindingNightShift ? Number(jindingNightShift['氧化锌原矿-水份（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_day_moisture: fdxDayShift ? Number(fdxDayShift['氧化锌原矿-水份（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_night_moisture: fdxNightShift ? Number(fdxNightShift['氧化锌原矿-水份（%）'] || 0).toFixed(2) : '0.00',
          // Zn品位数据 - 四条线
          jinding_day_zn_grade: jindingDayShift ? Number(jindingDayShift['氧化锌原矿-Zn全品位（%）'] || 0).toFixed(2) : '0.00',
          jinding_night_zn_grade: jindingNightShift ? Number(jindingNightShift['氧化锌原矿-Zn全品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_day_zn_grade: fdxDayShift ? Number(fdxDayShift['氧化锌原矿-Zn全品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_night_zn_grade: fdxNightShift ? Number(fdxNightShift['氧化锌原矿-Zn全品位（%）'] || 0).toFixed(2) : '0.00',
          // Pb品位数据 - 四条线
          jinding_day_pb_grade: jindingDayShift ? Number(jindingDayShift['氧化锌原矿-Pb全品位（%）'] || 0).toFixed(2) : '0.00',
          jinding_night_pb_grade: jindingNightShift ? Number(jindingNightShift['氧化锌原矿-Pb全品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_day_pb_grade: fdxDayShift ? Number(fdxDayShift['氧化锌原矿-Pb全品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_night_pb_grade: fdxNightShift ? Number(fdxNightShift['氧化锌原矿-Pb全品位（%）'] || 0).toFixed(2) : '0.00',
        };
      }),
      concentrate: sortedDates.map(date => {
        // 从JDXY表获取金鼎精矿数据
        const jindingDayShift = jindingData.production?.find((item: any) => item.日期 === date && item.班次 === '白班');
        const jindingNightShift = jindingData.production?.find((item: any) => item.日期 === date && item.班次 === '夜班');

        // 从FDX表获取富鼎翔精矿数据
        const fdxDayShift = fdxData.production?.find((item: any) => item.日期 === date && item.班次 === '白班');
        const fdxNightShift = fdxData.production?.find((item: any) => item.日期 === date && item.班次 === '夜班');

        return {
          date,
          // 精矿Zn品位数据 - 四条线
          jinding_day_concentrate_zn: jindingDayShift ? Number(jindingDayShift['氧化锌精矿-Zn品位（%）'] || 0).toFixed(2) : '0.00',
          jinding_night_concentrate_zn: jindingNightShift ? Number(jindingNightShift['氧化锌精矿-Zn品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_day_concentrate_zn: fdxDayShift ? Number(fdxDayShift['氧化锌精矿-Zn品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_night_concentrate_zn: fdxNightShift ? Number(fdxNightShift['氧化锌精矿-Zn品位（%）'] || 0).toFixed(2) : '0.00',
          // 精矿Pb品位数据 - 四条线
          jinding_day_concentrate_pb: jindingDayShift ? Number(jindingDayShift['氧化锌精矿-Pb品位（%）'] || 0).toFixed(2) : '0.00',
          jinding_night_concentrate_pb: jindingNightShift ? Number(jindingNightShift['氧化锌精矿-Pb品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_day_concentrate_pb: fdxDayShift ? Number(fdxDayShift['氧化锌精矿-Pb品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_night_concentrate_pb: fdxNightShift ? Number(fdxNightShift['氧化锌精矿-Pb品位（%）'] || 0).toFixed(2) : '0.00',
        };
      }),
      tailings: sortedDates.map(date => {
        // 从JDXY表获取金鼎尾矿数据
        const jindingDayShift = jindingData.production?.find((item: any) => item.日期 === date && item.班次 === '白班');
        const jindingNightShift = jindingData.production?.find((item: any) => item.日期 === date && item.班次 === '夜班');

        // 从FDX表获取富鼎翔尾矿数据
        const fdxDayShift = fdxData.production?.find((item: any) => item.日期 === date && item.班次 === '白班');
        const fdxNightShift = fdxData.production?.find((item: any) => item.日期 === date && item.班次 === '夜班');

        return {
          date,
          // 尾矿Zn品位数据 - 四条线
          jinding_day_tailings_zn: jindingDayShift ? Number(jindingDayShift['尾矿-Zn全品位（%）'] || 0).toFixed(2) : '0.00',
          jinding_night_tailings_zn: jindingNightShift ? Number(jindingNightShift['尾矿-Zn全品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_day_tailings_zn: fdxDayShift ? Number(fdxDayShift['尾矿-Zn全品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_night_tailings_zn: fdxNightShift ? Number(fdxNightShift['尾矿-Zn全品位（%）'] || 0).toFixed(2) : '0.00',
          // 尾矿Pb品位数据 - 四条线
          jinding_day_tailings_pb: jindingDayShift ? Number(jindingDayShift['尾矿-Pb全品位（%）'] || 0).toFixed(2) : '0.00',
          jinding_night_tailings_pb: jindingNightShift ? Number(jindingNightShift['尾矿-Pb全品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_day_tailings_pb: fdxDayShift ? Number(fdxDayShift['尾矿-Pb全品位（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_night_tailings_pb: fdxNightShift ? Number(fdxNightShift['尾矿-Pb全品位（%）'] || 0).toFixed(2) : '0.00',
        };
      }),
      recovery: sortedDates.map(date => {
        // 从JDXY表获取金鼎回收率数据
        const jindingDayShift = jindingData.production?.find((item: any) => item.日期 === date && item.班次 === '白班');
        const jindingNightShift = jindingData.production?.find((item: any) => item.日期 === date && item.班次 === '夜班');

        // 从FDX表获取富鼎翔回收率数据
        const fdxDayShift = fdxData.production?.find((item: any) => item.日期 === date && item.班次 === '白班');
        const fdxNightShift = fdxData.production?.find((item: any) => item.日期 === date && item.班次 === '夜班');

        return {
          date,
          // Zn回收率数据 - 四条线
          jinding_day_zn_recovery: jindingDayShift ? Number(jindingDayShift['氧化矿Zn理论回收率（%）'] || 0).toFixed(2) : '0.00',
          jinding_night_zn_recovery: jindingNightShift ? Number(jindingNightShift['氧化矿Zn理论回收率（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_day_zn_recovery: fdxDayShift ? Number(fdxDayShift['氧化矿Zn理论回收率（%）'] || 0).toFixed(2) : '0.00',
          fudingxiang_night_zn_recovery: fdxNightShift ? Number(fdxNightShift['氧化矿Zn理论回收率（%）'] || 0).toFixed(2) : '0.00',
        };
      }),
    };

    // 转换出厂数据 - 分别从出厂精矿-JDXY、出厂精矿-FDX和出厂样内部取样表获取数据
    const outgoingChartData = {
      gradeAndMoisture: sortedDates.map(date => {
        const jindingItem = jindingData.outgoing?.find((item: any) => item.计量日期 === date);
        const fudingxiangItem = fdxData.outgoing?.find((item: any) => item.计量日期 === date);
        const internalSampleItem = fdxData.internalSample?.find((item: any) => item.计量日期 === date);

        return {
          date,
          jinding_grade: jindingItem ? Number(jindingItem.Zn || 0).toFixed(2) : '0.00',
          fudingxiang_grade: fudingxiangItem ? Number(fudingxiangItem.Zn || 0).toFixed(2) : '0.00',
          internal_grade: internalSampleItem ? Number(internalSampleItem.zn || 0).toFixed(2) : '0.00',
          jinding_moisture: jindingItem ? Number(jindingItem['水份(%)'] || 0).toFixed(2) : '0.00',
          fudingxiang_moisture: fudingxiangItem ? Number(fudingxiangItem['水份(%)'] || 0).toFixed(2) : '0.00',
          internal_moisture: internalSampleItem ? Number(internalSampleItem['水份'] || 0).toFixed(2) : '0.00',
        };
      }),
      weightAndMetal: sortedDates.map(date => {
        const jindingItem = jindingData.outgoing?.find((item: any) => item.计量日期 === date);
        const fudingxiangItem = fdxData.outgoing?.find((item: any) => item.计量日期 === date);

        return {
          date,
          jinding_weight: jindingItem ? Number(jindingItem['湿重(t)'] || 0).toFixed(1) : '0.0',
          fudingxiang_weight: fudingxiangItem ? Number(fudingxiangItem['湿重(t)'] || 0).toFixed(1) : '0.0',
          jinding_metal: jindingItem ? Number(jindingItem['Zn^M'] || 0).toFixed(1) : '0.0',
          fudingxiang_metal: fudingxiangItem ? Number(fudingxiangItem['Zn^M'] || 0).toFixed(1) : '0.0',
        };
      }),
    };

    return {
      incoming: incomingChartData,
      production: productionChartData,
      outgoing: outgoingChartData,
    };
  }, []);



  // 处理富科数据转换为图表格式
  const processFdxDataForCharts = useCallback((productionData: any[], concentrationData: any[]) => {
    console.log(`🔄 [富科图表数据处理] 开始处理数据:`, {
      productionCount: productionData.length,
      concentrationCount: concentrationData.length
    });

    // 处理生产数据
    const processedProductionData = productionData.map((item: any) => ({
      date: item.日期,
      班次: item.班次,
      // 原矿数据
      原矿水份: item['氧化锌原矿-水份（%）'] || 0,
      原矿Pb品位: item['氧化锌原矿-Pb全品位（%）'] || 0,
      原矿Zn品位: item['氧化锌原矿-Zn全品位（%）'] || 0,
      // 精矿数据
      精矿Pb品位: item['氧化锌精矿-Pb品位（%）'] || 0,
      精矿Zn品位: item['氧化锌精矿-Zn品位（%）'] || 0,
      // 回收率数据
      Zn回收率: item['氧化矿Zn理论回收率（%）'] || 0
    }));

    // 处理浓细度数据
    const processedConcentrationData = concentrationData.map((item: any) => ({
      date: item.日期,
      班次: item.班次,
      浓度: item['浓度(%)'] || 0,
      细度: item['细度(%)'] || 0
    }));

    const result = {
      production: processedProductionData,
      concentration: processedConcentrationData
    };

    console.log(`✅ [富科图表数据处理] 处理完成:`, {
      productionProcessed: result.production.length,
      concentrationProcessed: result.concentration.length
    });

    return result;
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
          operator: item.化验人员, // 添加化验人员字段映射
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

  // 格式化数值显示 - 支持智能单位识别
  const formatValue = useCallback((value: any, unit?: string, precision?: number) => {
    if (value === null || value === undefined || value === '') return '--';

    // 如果指定了精度，直接使用
    if (precision !== undefined) {
      if (typeof value === 'number') return value.toFixed(precision);
      return value.toString();
    }

    // 使用统一的格式化工具，支持智能单位识别
    return formatValueUtil(value, unit);
  }, []);

  // 排序函数
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      // 如果点击的是同一个字段，切换排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击的是新字段，设置为升序
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // 排序数据
  const sortedTableData = React.useMemo(() => {
    if (!sortField) return tableData;

    return [...tableData].sort((a, b) => {
      let aValue = a[sortField as keyof SampleData];
      let bValue = b[sortField as keyof SampleData];

      // 处理null和undefined值
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // 数值类型排序
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 日期类型排序
      if (sortField.includes('date') || sortField.includes('Date')) {
        const dateA = new Date(aValue as string);
        const dateB = new Date(bValue as string);
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }

      // 字符串类型排序
      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [tableData, sortField, sortDirection]);

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
      'shift_samples': '生产班报-FDX',
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
            { key: '氧化锌原矿-全金属Pb（t）', label: '氧化锌原矿-全金属Pb（t）', type: 'number' },
            { key: '氧化锌原矿-全金属Zn（t）', label: '氧化锌原矿-全金属Zn（t）', type: 'number' },
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
            { key: '化验人员', label: '化验人员', type: 'text' },
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
                      displayValue = formatValue(value, undefined, 2);
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

        // 优化：不重新获取所有数据，只更新当前显示的数据
        // 如果需要刷新表格，可以在关闭对话框后再刷新
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
        // 并行获取数据和生产周期列表
        await Promise.all([
          fetchData(),
          fetchProductionCycles()
        ]);
      } catch (error) {
        console.error('页面初始化失败:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializePage();
  }, [fetchData, fetchProductionCycles]);

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
                          <SortableTableHead field="record_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>日期</SortableTableHead>
                          <SortableTableHead field="shift" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>班次</SortableTableHead>
                          <SortableTableHead field="mineral_type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>矿物类型</SortableTableHead>
                          <SortableTableHead field="element" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>元素</SortableTableHead>
                          <SortableTableHead field="grade_value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>品位(%)</SortableTableHead>
                          <SortableTableHead field="moisture_value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>水分(%)</SortableTableHead>
                        </>
                      )}

                      {/* 压滤样字段 */}
                      {selectedDataSource === 'filter_samples' && (
                        <>
                          <SortableTableHead field="record_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>日期</SortableTableHead>
                          <SortableTableHead field="element" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>元素</SortableTableHead>
                          <SortableTableHead field="grade_value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>品位(%)</SortableTableHead>
                          <SortableTableHead field="moisture_value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>水分(%)</SortableTableHead>
                          <SortableTableHead field="operator" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>化验人员</SortableTableHead>
                        </>
                      )}

                      {/* 进厂样字段 */}
                      {selectedDataSource === 'incoming_samples' && (
                        <>
                          <SortableTableHead field="record_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>日期</SortableTableHead>
                          <SortableTableHead field="element" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>元素</SortableTableHead>
                          <SortableTableHead field="grade_value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>品位(%)</SortableTableHead>
                          <SortableTableHead field="moisture_value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>水分(%)</SortableTableHead>
                          <SortableTableHead field="supplier" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>供应商</SortableTableHead>
                          <SortableTableHead field="mineral_type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>原矿类型</SortableTableHead>
                        </>
                      )}

                      {/* 出厂样字段：日期，样品编号，元素，品位(%)，水分(%)，采购单位 */}
                      {selectedDataSource === 'outgoing_sample' && (
                        <>
                          <SortableTableHead field="shipment_date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>日期</SortableTableHead>
                          <SortableTableHead field="sample_number" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>样品编号</SortableTableHead>
                          <SortableTableHead field="element" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>元素</SortableTableHead>
                          <SortableTableHead field="grade_value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>品位(%)</SortableTableHead>
                          <SortableTableHead field="moisture_value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>水分(%)</SortableTableHead>
                          <SortableTableHead field="purchasing_unit_name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>采购单位</SortableTableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTableData.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(item)}
                      >
                        {/* 班样数据显示：日期，班次，矿物类型，元素，品位(%)，水分(%) */}
                        {selectedDataSource === 'shift_samples' && (
                          <>
                            <TableCell>{item.record_date || '--'}</TableCell>
                            <TableCell>{item.shift || '--'}</TableCell>
                            <TableCell>{item.mineral_type || '--'}</TableCell>
                            <TableCell>{item.element || '--'}</TableCell>
                            <TableCell>{formatValue(item.grade_value, 2)}</TableCell>
                            <TableCell>{formatValue(item.moisture_value, 2)}</TableCell>
                          </>
                        )}

                        {/* 压滤样数据显示 */}
                        {selectedDataSource === 'filter_samples' && (
                          <>
                            <TableCell>{item.record_date || '--'}</TableCell>
                            <TableCell>{item.element || '--'}</TableCell>
                            <TableCell>{formatValue(item.grade_value, 2)}</TableCell>
                            <TableCell>{formatValue(item.moisture_value, 2)}</TableCell>
                            <TableCell>{item.operator || '--'}</TableCell>
                          </>
                        )}

                        {/* 进厂样数据显示 */}
                        {selectedDataSource === 'incoming_samples' && (
                          <>
                            <TableCell>{item.record_date || '--'}</TableCell>
                            <TableCell>{item.element || '--'}</TableCell>
                            <TableCell>{formatValue(item.grade_value, 2)}</TableCell>
                            <TableCell>{formatValue(item.moisture_value, 2)}</TableCell>
                            <TableCell>{item.supplier || '--'}</TableCell>
                            <TableCell>{item.mineral_type || '--'}</TableCell>
                          </>
                        )}

                        {/* 出厂样数据显示：日期，样品编号，元素，品位(%)，水分(%)，采购单位 */}
                        {selectedDataSource === 'outgoing_sample' && (
                          <>
                            <TableCell>{item.shipment_date || '--'}</TableCell>
                            <TableCell>{item.sample_number || '--'}</TableCell>
                            <TableCell>{item.element || '--'}</TableCell>
                            <TableCell>{formatValue(item.grade_value, 2)}</TableCell>
                            <TableCell>{formatValue(item.moisture_value, 2)}</TableCell>
                            <TableCell>{item.purchasing_unit_name || '--'}</TableCell>
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







                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <ComparisonChart
                        data={fdxChartData.production}
                        title="原矿水份%趋势"
                        description="富科原矿水份数据趋势"
                        lines={[
                          { dataKey: "原矿水份", name: "原矿水份(%)" },
                        ]}
                        trendText="显示富科原矿水份变化趋势"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={fdxChartData.production}
                        title="原矿Zn品位%趋势"
                        description="富科原矿Zn品位数据趋势"
                        lines={[
                          { dataKey: "原矿Zn品位", name: "原矿Zn品位(%)" },
                        ]}
                        trendText="显示富科原矿Zn品位变化趋势"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={fdxChartData.production}
                        title="原矿Pb品位%趋势"
                        description="富科原矿Pb品位数据趋势"
                        lines={[
                          { dataKey: "原矿Pb品位", name: "原矿Pb品位(%)" },
                        ]}
                        trendText="显示富科原矿Pb品位变化趋势"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={fdxChartData.production}
                        title="精矿Zn品位%趋势"
                        description="富科精矿Zn品位数据趋势"
                        lines={[
                          { dataKey: "精矿Zn品位", name: "精矿Zn品位(%)" },
                        ]}
                        trendText="显示富科精矿Zn品位变化趋势"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={fdxChartData.production}
                        title="精矿Pb品位%趋势"
                        description="富科精矿Pb品位数据趋势"
                        lines={[
                          { dataKey: "精矿Pb品位", name: "精矿Pb品位(%)" },
                        ]}
                        trendText="显示富科精矿Pb品位变化趋势"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={fdxChartData.production}
                        title="Zn回收率%趋势"
                        description="富科Zn金属回收效率指标趋势"
                        lines={[
                          { dataKey: "Zn回收率", name: "Zn回收率(%)" },
                        ]}
                        trendText="显示富科Zn回收率变化趋势"
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>

                {/* 生产班样差值数据表格 - 完全符合班样详情页面设计 */}
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TruckIcon className="h-5 w-5 text-primary" />
                        <CardTitle>生产班样差值数据</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportProductionComparisonToExcel()}
                          className="text-xs"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          导出EXCEL
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={refreshComparisonData}
                          disabled={isRefreshingComparison}
                          className="h-8 w-8"
                          title="刷新生产班样差值数据"
                        >
                          <RefreshCw className={`h-4 w-4 ${isRefreshingComparison ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>查看和管理生产班样差值数据记录</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>操作</TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleProductionSort()}
                            >
                              日期 {productionSortOrder === 'desc' ? '↓' : '↑'}
                            </TableHead>
                            <TableHead>班次</TableHead>
                            <TableHead>原矿水分差值(%)</TableHead>
                            <TableHead>原矿Zn品位差值(%)</TableHead>
                            <TableHead>精矿Zn品位差值(%)</TableHead>
                            <TableHead>Zn回收率差值(%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getProductionTableData()
                            .slice((productionCurrentPage - 1) * productionItemsPerPage, productionCurrentPage * productionItemsPerPage)
                            .map((item: any, index: number) => (
                              <TableRow key={`production-${item.id}-${index}`}>
                                <TableCell>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <ProductionDetailDialog data={item} />
                                  </Dialog>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {new Date(item.日期).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{item.班次 || '--'}</TableCell>
                                <TableCell>
                                  {item['氧化锌原矿-水份（%）'] ? Number(item['氧化锌原矿-水份（%）']).toFixed(2) : '--'}
                                </TableCell>
                                <TableCell>
                                  {item['氧化锌原矿-Zn全品位（%）'] ? Number(item['氧化锌原矿-Zn全品位（%）']).toFixed(2) : '--'}
                                </TableCell>
                                <TableCell>
                                  {item['氧化锌精矿-Zn品位（%）'] ? Number(item['氧化锌精矿-Zn品位（%）']).toFixed(2) : '--'}
                                </TableCell>
                                <TableCell>
                                  {item['氧化矿Zn理论回收率（%）'] ? Number(item['氧化矿Zn理论回收率（%）']).toFixed(2) : '--'}
                                </TableCell>
                              </TableRow>
                            ))}
                          {(!comparisonData.production || comparisonData.production.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                                暂无生产班样对比数据
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* 分页控制 */}
                    {(() => {
                      const tableData = getProductionTableData();
                      const totalPages = Math.ceil(tableData.length / productionItemsPerPage);

                      if (totalPages <= 1) return null;

                      return (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            共 {tableData.length} 条记录，第 {productionCurrentPage} 页，共 {totalPages} 页
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProductionCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={productionCurrentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              上一页
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProductionCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={productionCurrentPage === totalPages}
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
            </TabsContent>

            <TabsContent value="quality" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">生产质量数据趋势对比</h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <ComparisonChart
                        data={fdxChartData.concentration}
                        title="浓度趋势"
                        description="富科浓度数据趋势"
                        lines={[
                          { dataKey: "浓度", name: "浓度(%)" },
                        ]}
                        trendText="显示富科浓度数据的变化趋势"
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={fdxChartData.concentration}
                        title="细度趋势"
                        description="富科细度数据趋势"
                        lines={[
                          { dataKey: "细度", name: "细度(%)" },
                        ]}
                        trendText="显示富科细度数据的变化趋势"
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>

                {/* 浓细度对比数据表格 */}
                <div className="mt-6">
                  <PaginatedTable
                    data={comparisonData.concentration || []}
                    columns={[
                      {
                        key: '日期',
                        label: '日期',
                        render: (value) => new Date(value).toLocaleDateString()
                      },
                      {
                        key: '班次',
                        label: '班次'
                      },
                      {
                        key: '浓度(%)',
                        label: '浓度(%)',
                        render: (value) => value ? Number(value).toFixed(2) : '--'
                      },
                      {
                        key: '细度(%)',
                        label: '细度(%)',
                        render: (value) => value ? Number(value).toFixed(2) : '--'
                      },
                      {
                        key: '备注',
                        label: '备注'
                      }
                    ]}
                    title="浓细度对比数据"
                    emptyMessage="暂无浓细度对比数据"
                    exportFileName={`浓细度对比数据_${comparisonStartDate?.toISOString().split('T')[0]}_${comparisonEndDate?.toISOString().split('T')[0]}.csv`}
                    detailFields={[
                      { key: '日期', label: '日期' },
                      { key: '班次', label: '班次' },
                      { key: '浓度(%)', label: '浓度(%)' },
                      { key: '细度(%)', label: '细度(%)' },
                      { key: '备注', label: '备注' },
                      { key: '操作员', label: '操作员' },
                      { key: '检测时间', label: '检测时间' }
                    ]}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outgoing" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">出厂精矿数据趋势对比</h3>
                <Carousel className="w-full">
                  <CarouselContent>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.outgoing.gradeAndMoisture}
                        title="品位%对比"
                        description="金鼎 VS 富鼎翔 VS 内部取样品位对比"
                        lines={[
                          { dataKey: "jinding_grade" },
                          { dataKey: "fudingxiang_grade" },
                          { dataKey: "internal_grade" },
                        ]}
                        trendText={generateSingleTrendText(chartData.outgoing.gradeAndMoisture, "jinding_grade", "fudingxiang_grade", true)}
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.outgoing.gradeAndMoisture}
                        title="水份%对比"
                        description="金鼎 VS 富鼎翔 VS 内部取样水份对比"
                        lines={[
                          { dataKey: "jinding_moisture" },
                          { dataKey: "fudingxiang_moisture" },
                          { dataKey: "internal_moisture" },
                        ]}
                        trendText={generateSingleTrendText(chartData.outgoing.gradeAndMoisture, "jinding_moisture", "fudingxiang_moisture", true)}
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.outgoing.weightAndMetal}
                        title="湿重t对比"
                        description="金鼎 VS 富鼎翔出厂精矿湿重对比"
                        lines={[
                          { dataKey: "jinding_weight" },
                          { dataKey: "fudingxiang_weight" },
                        ]}
                        trendText={generateSingleTrendText(chartData.outgoing.weightAndMetal, "jinding_weight", "fudingxiang_weight", false)}
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <ComparisonChart
                        data={chartData.outgoing.weightAndMetal}
                        title="金属量t对比"
                        description="金鼎 VS 富鼎翔出厂精矿金属量对比"
                        lines={[
                          { dataKey: "jinding_metal" },
                          { dataKey: "fudingxiang_metal" },
                        ]}
                        trendText={generateSingleTrendText(chartData.outgoing.weightAndMetal, "jinding_metal", "fudingxiang_metal", false)}
                      />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>

                {/* 出厂数据表格 */}
                <div className="mt-6">
                  <PaginatedTable
                    data={comparisonData.outgoing || []}
                    columns={[
                      {
                        key: '计量日期',
                        label: '日期',
                        render: (value) => new Date(value).toLocaleDateString()
                      },
                      {
                        key: 'zn',
                        label: '品位差值(%)',
                        render: (value) => value ? Number(value).toFixed(2) : '--'
                      },
                      {
                        key: '水份(%)',
                        label: '水分差值(%)',
                        render: (value) => value ? Number(value).toFixed(2) : '--'
                      },
                      {
                        key: '湿重(t)',
                        label: '重量差值(t)',
                        render: (value) => value ? Number(value).toFixed(3) : '--'
                      },
                      {
                        key: 'Zn^M',
                        label: '金属量差值(t)',
                        render: (value) => value ? Number(value).toFixed(3) : '--'
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
                      { key: 'zn', label: '品位差值(%)' },
                      { key: '水份(%)', label: '水分差值(%)' },
                      { key: '湿重(t)', label: '重量差值(t)' },
                      { key: 'Zn^M', label: '金属量差值(t)' },
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

      {/* 🔥🔥🔥 数据对比分析汇总表格 🔥🔥🔥 */}
      <Card id="summary-tables" className="mt-6 border-4 border-red-500 bg-red-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>🔥 数据对比分析汇总表格 🔥</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshComparisonData}
                disabled={isRefreshingComparison}
                className="h-8 w-8"
                title="刷新汇总数据"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingComparison ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="incoming-summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="incoming-summary">进厂汇总</TabsTrigger>
              <TabsTrigger value="production-summary">生产汇总</TabsTrigger>
              <TabsTrigger value="quality-summary">质量汇总</TabsTrigger>
              <TabsTrigger value="outgoing-summary">出厂汇总</TabsTrigger>
            </TabsList>

            <TabsContent value="incoming-summary" className="mt-4">
              <PaginatedTable
                data={comparisonData.incoming || []}
                columns={[
                  {
                    key: '计量日期',
                    label: '日期',
                    render: (value) => new Date(value).toLocaleDateString()
                  },
                  {
                    key: 'zn',
                    label: '品位差值(%)',
                    render: (value) => value ? Number(value).toFixed(2) : '--'
                  },
                  {
                    key: '水份(%)',
                    label: '水分差值(%)',
                    render: (value) => value ? Number(value).toFixed(2) : '--'
                  },
                  {
                    key: '湿重(t)',
                    label: '重量差值(t)',
                    render: (value) => value ? Number(value).toFixed(3) : '--'
                  },
                  {
                    key: 'Zn^M',
                    label: '金属量差值(t)',
                    render: (value) => value ? Number(value).toFixed(3) : '--'
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
                title="进厂原矿对比汇总"
                emptyMessage="暂无进厂原矿对比数据"
                exportFileName={`进厂原矿汇总_${comparisonStartDate?.toISOString().split('T')[0]}_${comparisonEndDate?.toISOString().split('T')[0]}.csv`}
                detailFields={[
                  { key: '计量日期', label: '计量日期' },
                  { key: 'zn', label: '品位差值(%)' },
                  { key: '水份(%)', label: '水分差值(%)' },
                  { key: '湿重(t)', label: '重量差值(t)' },
                  { key: 'Zn^M', label: '金属量差值(t)' },
                  { key: '发货单位名称', label: '发货单位' },
                  { key: '收货单位名称', label: '收货单位' },
                  { key: '备注', label: '备注' }
                ]}
              />
            </TabsContent>

            <TabsContent value="production-summary" className="mt-4">
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
                title="生产班报对比汇总"
                emptyMessage="暂无生产班报对比数据"
                exportFileName={`生产班报汇总_${comparisonStartDate?.toISOString().split('T')[0]}_${comparisonEndDate?.toISOString().split('T')[0]}.csv`}
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
            </TabsContent>

            <TabsContent value="quality-summary" className="mt-4">
              <PaginatedTable
                data={comparisonData.concentration || []}
                columns={[
                  {
                    key: '日期',
                    label: '日期',
                    render: (value) => new Date(value).toLocaleDateString()
                  },
                  {
                    key: '班次',
                    label: '班次'
                  },
                  {
                    key: '浓度(%)',
                    label: '浓度(%)',
                    render: (value) => value ? Number(value).toFixed(2) : '--'
                  },
                  {
                    key: '细度(%)',
                    label: '细度(%)',
                    render: (value) => value ? Number(value).toFixed(2) : '--'
                  },
                  {
                    key: '备注',
                    label: '备注'
                  }
                ]}
                title="浓细度对比汇总"
                emptyMessage="暂无浓细度对比数据"
                exportFileName={`浓细度汇总_${comparisonStartDate?.toISOString().split('T')[0]}_${comparisonEndDate?.toISOString().split('T')[0]}.csv`}
                detailFields={[
                  { key: '日期', label: '日期' },
                  { key: '班次', label: '班次' },
                  { key: '浓度(%)', label: '浓度(%)' },
                  { key: '细度(%)', label: '细度(%)' },
                  { key: '备注', label: '备注' },
                  { key: '操作员', label: '操作员' },
                  { key: '检测时间', label: '检测时间' }
                ]}
              />
            </TabsContent>

            <TabsContent value="outgoing-summary" className="mt-4">
              <PaginatedTable
                data={comparisonData.outgoing || []}
                columns={[
                  {
                    key: '计量日期',
                    label: '日期',
                    render: (value) => new Date(value).toLocaleDateString()
                  },
                  {
                    key: 'zn',
                    label: '品位差值(%)',
                    render: (value) => value ? Number(value).toFixed(2) : '--'
                  },
                  {
                    key: '水份(%)',
                    label: '水分差值(%)',
                    render: (value) => value ? Number(value).toFixed(2) : '--'
                  },
                  {
                    key: '湿重(t)',
                    label: '重量差值(t)',
                    render: (value) => value ? Number(value).toFixed(3) : '--'
                  },
                  {
                    key: 'Zn^M',
                    label: '金属量差值(t)',
                    render: (value) => value ? Number(value).toFixed(3) : '--'
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
                title="出厂精矿对比汇总"
                emptyMessage="暂无出厂精矿对比数据"
                exportFileName={`出厂精矿汇总_${comparisonStartDate?.toISOString().split('T')[0]}_${comparisonEndDate?.toISOString().split('T')[0]}.csv`}
                detailFields={[
                  { key: '计量日期', label: '计量日期' },
                  { key: 'zn', label: '品位差值(%)' },
                  { key: '水份(%)', label: '水分差值(%)' },
                  { key: '湿重(t)', label: '重量差值(t)' },
                  { key: 'Zn^M', label: '金属量差值(t)' },
                  { key: '发货单位名称', label: '发货单位' },
                  { key: '收货单位名称', label: '收货单位' },
                  { key: '流向', label: '流向' },
                  { key: '备注', label: '备注' }
                ]}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) {
          // 关闭对话框时重置所有状态并刷新数据
          setSelectedRowData(null);
          setRawRowData(null);
          setIsEditMode(false);
          setEditFormData(null);
          // 在对话框关闭时刷新表格数据，确保显示最新数据
          fetchData();
        }
      }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            {/* 简化Header布局：居中标题 */}
            <div className="flex items-center justify-center gap-2 min-h-[40px]">
              <FlaskConical className="h-4 w-4" />
              <DialogTitle className="text-base">化验数据详情</DialogTitle>
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
