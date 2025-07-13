"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format } from "date-fns";
import {
  RefreshCw, TruckIcon, Activity, CheckCircle, AlertTriangle,
  Download, Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header2 } from "@/components/headers";
import { Footer } from "@/components/ui/footer";
import { Label as RechartsLabel, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// 机器运行记录数据接口
interface MachineRunningRecord {
  id: number;
  操作员: string;
  日期: string;
  时间: string;
  设备状态: '正常运行' | '设备维护';
  持续时长?: string;
  情况说明?: string;
  created_at?: string;
  updated_at?: string;
}

// 状态聚合数据接口
interface StatusAggregation {
  status: string;
  count: number;
  totalDuration: number;
  percentage: number;
}

export default function MachineRunningDetailsPage() {
  // 数据状态
  const [records, setRecords] = useState<MachineRunningRecord[]>([]);
  const [aggregation, setAggregation] = useState<StatusAggregation[]>([]);
  const [currentStatus, setCurrentStatus] = useState<any>(null);

  // 总览模块独立数据状态
  const [overviewRecords, setOverviewRecords] = useState<MachineRunningRecord[]>([]);
  const [overviewAggregation, setOverviewAggregation] = useState<StatusAggregation[]>([]);

  // 总览日期范围状态 - 设备运行状况总览：起始日期固定为2025-04-26，结束日期为当前日期
  const [overviewStartDate, setOverviewStartDate] = useState('2025-04-26');
  const [overviewEndDate, setOverviewEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 当前状态查询日期
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // 表格日期状态 - 设备运行记录汇总：起始日期固定为2025-04-26，结束日期为当前日期
  const [tableStartDate, setTableStartDate] = useState('2025-04-26');
  const [tableEndDate, setTableEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // 加载状态 - 使用ref避免频繁更新
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  // 移除全局实时计时器状态，避免影响图表组件

  // 图表配置 - 绿色代表正常运行，橙色代表设备维护
  const chartConfig = {
    正常运行: {
      label: "正常运行",
      color: "hsl(142, 76%, 36%)", // 绿色
    },
    设备维护: {
      label: "设备维护",
      color: "hsl(25, 95%, 53%)", // 橙色
    },
  } satisfies ChartConfig;

  // 数据获取函数
  const fetchMachineRunningData = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // 获取记录列表
      const recordsResponse = await fetch('/api/machine-running-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          action: 'getRecords'
        })
      });

      // 获取聚合统计
      const aggregationResponse = await fetch('/api/machine-running-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          action: 'getAggregation'
        })
      });

      const [recordsResult, aggregationResult] = await Promise.all([
        recordsResponse.json(),
        aggregationResponse.json()
      ]);

      if (recordsResult.success && aggregationResult.success) {
        console.log('机器运行数据获取成功');
        setRecords(recordsResult.data || []);
        setAggregation(aggregationResult.data || []);
      } else {
        console.error('数据获取失败:', recordsResult.error || aggregationResult.error);
      }
    } catch (error) {
      console.error('API调用失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取当前状态
  const fetchCurrentStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/machine-running-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getCurrentStatus'
        })
      });

      const result = await response.json();
      if (result.success) {
        setCurrentStatus(result.data);
      }
    } catch (error) {
      console.error('获取当前状态失败:', error);
    }
  }, []);

  // 快捷日期设置
  const setDateRange = useCallback((days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setTableStartDate(startDate);
    setTableEndDate(endDate);
  }, []);

  // 获取总览数据的专用函数
  const fetchOverviewData = useCallback(async (startDate: string, endDate: string) => {
    console.log('fetchOverviewData 被调用，参数:', { startDate, endDate });

    // 防止重复请求
    if (isLoadingRef.current) {
      console.log('请求被阻止，因为正在加载中');
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    console.log('开始获取总览数据...');
    try {
      // 获取记录列表
      const recordsResponse = await fetch('/api/machine-running-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          action: 'getRecords'
        })
      });

      // 获取聚合统计
      const aggregationResponse = await fetch('/api/machine-running-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          action: 'getAggregation'
        })
      });

      const [recordsResult, aggregationResult] = await Promise.all([
        recordsResponse.json(),
        aggregationResponse.json()
      ]);

      if (recordsResult.success && aggregationResult.success) {
        console.log('总览数据获取成功');
        console.log('API返回的聚合数据:', aggregationResult.data);
        setOverviewRecords(recordsResult.data || []);
        setOverviewAggregation(aggregationResult.data || []);
        console.log('设置后的overviewAggregation:', aggregationResult.data);
      } else {
        console.error('总览数据获取失败:', recordsResult.error || aggregationResult.error);
        console.log('Records result:', recordsResult);
        console.log('Aggregation result:', aggregationResult);
      }
    } catch (error) {
      console.error('总览API调用失败:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // 刷新总览数据
  const refreshOverviewData = useCallback(() => {
    fetchOverviewData(overviewStartDate, overviewEndDate);
  }, [overviewStartDate, overviewEndDate, fetchOverviewData]);

  // 刷新当前状态数据
  const refreshCurrentStatusData = useCallback(() => {
    fetchCurrentStatus();
  }, [fetchCurrentStatus]);

  // 总览快捷日期设置
  const setOverviewDateRange = useCallback((days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setOverviewStartDate(startDate);
    setOverviewEndDate(endDate);
  }, []);

  // 刷新表格数据
  const refreshTableData = useCallback(() => {
    fetchMachineRunningData(tableStartDate, tableEndDate);
  }, [tableStartDate, tableEndDate, fetchMachineRunningData]);

  // 排序切换
  const toggleSort = useCallback(() => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  }, []);

  // 处理表格数据
  const processTableData = useCallback(() => {
    // 筛选日期范围内的数据
    const filteredData = records.filter(item => {
      if (!item.日期) return false;
      const itemDate = new Date(item.日期).toISOString().split('T')[0];
      return itemDate >= tableStartDate && itemDate <= tableEndDate;
    });

    // 排序
    const sortedData = filteredData.sort((a, b) => {
      const dateA = new Date(a.日期 + ' ' + (a.时间 || '00:00'));
      const dateB = new Date(b.日期 + ' ' + (b.时间 || '00:00'));
      return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    return sortedData;
  }, [records, tableStartDate, tableEndDate, sortOrder]);

  // 导出Excel功能
  const exportToExcel = useCallback(() => {
    const data = processTableData();

    if (data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 创建CSV内容
    const headers = ['日期', '时间', '操作员', '设备状态', '持续时长', '情况说明'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.日期 || '',
        item.时间 || '',
        item.操作员 || '',
        item.设备状态 || '',
        item.持续时长 || '',
        item.情况说明 || ''
      ].join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `机器运行记录_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processTableData]);

  // 稳定的颜色映射配置 - 与chartConfig保持一致
  const getStatusColor = useCallback((status: string) => {
    const config = chartConfig[status as keyof typeof chartConfig];
    return config?.color || 'hsl(0, 0%, 50%)'; // 使用chartConfig中的颜色
  }, []);

  // 处理饼图数据 - 使用总览数据，确保颜色映射稳定
  const processPieData = useMemo(() => {
    console.log('processPieData - overviewAggregation:', overviewAggregation);

    if (overviewAggregation.length === 0) {
      console.log('overviewAggregation为空，返回默认数据');
      // 返回默认数据结构，避免空数组导致的渲染问题
      return [
        {
          status: '正常运行',
          value: 0,
          count: 0,
          totalHours: 0,
          fill: chartConfig['正常运行'].color
        },
        {
          status: '设备维护',
          value: 0,
          count: 0,
          totalHours: 0,
          fill: chartConfig['设备维护'].color
        }
      ];
    }

    // 确保数据顺序稳定：正常运行在前，设备维护在后
    const statusOrder = ['正常运行', '设备维护'];

    // 创建完整的数据集，确保两种状态都存在
    const completeData = statusOrder.map(status => {
      const existingData = overviewAggregation.find(item => item.status === status);
      const result = {
        status,
        value: existingData ? Math.round(existingData.percentage * 10) / 10 : 0,
        count: existingData ? existingData.count : 0,
        totalHours: existingData ? Math.round(existingData.totalDuration * 10) / 10 : 0,
        fill: chartConfig[status as keyof typeof chartConfig].color
      };
      console.log(`处理状态 ${status}:`, existingData, '→', result);
      return result;
    });

    console.log('最终处理的饼图数据:', completeData);
    return completeData;
  }, [overviewAggregation]);

  // 移除全局实时计时器，避免影响图表组件

  // 移除全局持续时间计算函数，现在由独立组件处理

  // 获取状态颜色和图标
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case '正常运行':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4" />,
          text: '正常运行'
        };
      case '设备维护':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <AlertTriangle className="h-4 w-4" />,
          text: '设备维护'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <Activity className="h-4 w-4" />,
          text: '未知状态'
        };
    }
  };

  // 监听总览日期变化
  useEffect(() => {
    refreshOverviewData();
  }, [overviewStartDate, overviewEndDate, refreshOverviewData]);

  // 监听表格日期变化
  useEffect(() => {
    refreshTableData();
  }, [tableStartDate, tableEndDate, refreshTableData]);

  // 初始化数据加载
  useEffect(() => {
    refreshOverviewData();
    refreshCurrentStatusData();
  }, [refreshOverviewData, refreshCurrentStatusData]);

  // 独立的实时计时器组件 - 避免影响其他组件
  const RealTimeTimer = React.memo(({ currentStatus }: { currentStatus: any }) => {
    const [localTime, setLocalTime] = useState(new Date());
    const timeRef = useRef(new Date());

    useEffect(() => {
      const timer = setInterval(() => {
        timeRef.current = new Date();
        setLocalTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const getDuration = useCallback(() => {
      if (!currentStatus || !currentStatus.日期 || !currentStatus.时间) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const statusDateTime = new Date(`${currentStatus.日期} ${currentStatus.时间}`);
      const diffMs = timeRef.current.getTime() - statusDateTime.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    }, [currentStatus]);

    const duration = getDuration();

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex justify-center items-center gap-6 md:gap-8">
          <FlipNumber value={duration.hours} label="小时" />

          <div className="text-2xl md:text-3xl font-bold text-muted-foreground animate-pulse">
            :
          </div>

          <FlipNumber value={duration.minutes} label="分钟" />

          <div className="text-2xl md:text-3xl font-bold text-muted-foreground animate-pulse">
            :
          </div>

          <FlipNumber value={duration.seconds} label="秒" />
        </div>

        <div className="text-center mt-4">
          <div className="text-sm text-muted-foreground">
            已持续运行
          </div>
        </div>
      </div>
    );
  });

  // 酷炫数字翻转组件
  const FlipNumber = ({ value, label }: { value: number; label: string }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      if (value !== displayValue) {
        setIsAnimating(true);
        const timer = setTimeout(() => {
          setDisplayValue(value);
          setIsAnimating(false);
        }, 150);
        return () => clearTimeout(timer);
      }
    }, [value, displayValue]);

    return (
      <div className="flex flex-col items-center">
        <div className="relative overflow-hidden">
          <div
            className={`text-2xl md:text-3xl font-bold text-primary transition-all duration-300 ${
              isAnimating ? 'transform scale-110 text-orange-500' : ''
            }`}
            style={{
              textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
              animation: isAnimating ? 'pulse 0.3s ease-in-out' : 'none'
            }}
          >
            {displayValue.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 font-medium">
          {label}
        </div>
      </div>
    );
  };

  // 简单的时间显示组件 - 独立更新，不影响其他组件
  const SimpleTimeDisplay = React.memo(() => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    return <span>{format(currentTime, 'HH:mm:ss')}</span>;
  });

  // Pie Chart - Interactive组件 - 完全独立，避免外部状态影响
  const PieChartInteractive = React.memo(({ data, startDate, endDate }: {
    data: any[],
    startDate: string,
    endDate: string
  }) => {
    const id = "pie-interactive";
    // 默认显示第一个状态，移除下拉选择器
    const activeIndex = 0;

    // 调试信息 - 检查数据和颜色
    console.log('PieChart data:', data);
    console.log('ChartConfig:', chartConfig);

    if (data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">暂无数据</p>
        </div>
      );
    }

    return (
      <Card data-chart={id} className="flex flex-col">
        <ChartStyle id={id} config={chartConfig} />
        <CardHeader className="pb-0">
          <div className="text-center">
            <CardTitle className="text-xl">设备运行状况分析</CardTitle>
            <CardDescription>
              {startDate} 至 {endDate} 机器总体状态
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 justify-center pb-0">
          <ChartContainer
            id={id}
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const itemData = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: itemData.fill }}
                          />
                          <span className="font-medium">{itemData.status}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>占比: <span className="font-bold">{itemData.value.toFixed(0)}%</span></div>
                          <div>记录: {itemData.count}次</div>
                          <div>时长: {itemData.totalHours.toFixed(1)}小时</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
                activeIndex={activeIndex}
                activeShape={({
                  outerRadius = 0,
                  ...props
                }: PieSectorDataItem) => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 10} />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 25}
                      innerRadius={outerRadius + 12}
                    />
                  </g>
                )}
              >
                <RechartsLabel
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const activeData = data[activeIndex];
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
                            {activeData?.value.toFixed(1)}%
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            运行时间占比
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
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* 运行占比总览 */}
            <div className="text-center border-b pb-4">
              <div className="text-lg font-semibold text-foreground mb-1">
                设备运行状况统计
              </div>
              <div className="text-sm text-muted-foreground">
                {startDate} 至 {endDate}
              </div>
            </div>

            {/* 详细状态信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((item) => (
                <div key={item.status} className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <div className="text-base font-semibold text-foreground">
                      {item.status}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">运行占比</span>
                      <span className="text-lg font-bold text-foreground">
                        {item.value.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">记录次数</span>
                      <span className="text-sm font-medium text-foreground">
                        {item.count}次
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">累计时长</span>
                      <span className="text-sm font-medium text-foreground">
                        {item.totalHours.toFixed(1)}小时
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 汇总信息 */}
            {(() => {
              const totalRecords = data.reduce((sum, item) => sum + item.count, 0);
              const totalHours = data.reduce((sum, item) => sum + item.totalHours, 0);
              const normalRunning = data.find(item => item.status === '正常运行');

              return (
                <div className="bg-primary/5 rounded-lg p-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {totalRecords}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        总记录数
                      </div>
                    </div>

                    <div>
                      <div className="text-lg font-bold text-primary">
                        {totalHours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        总运行时长
                      </div>
                    </div>

                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {normalRunning ? normalRunning.value.toFixed(1) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        正常运行率
                      </div>
                    </div>

                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {normalRunning ? (100 - normalRunning.value).toFixed(1) : 100}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        维护占比
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* 添加CSS动画样式 */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { text-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
        }
      `}</style>

      {/* Header-2组件 */}
      <Header2 title="机器设备运行详情" />

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* PART1: 设备运行状况总览 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TruckIcon className="h-5 w-5" />
                  设备运行状况总览
                </CardTitle>
                <CardDescription>选定日期范围内机器的总体状态</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshOverviewData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 日期范围选择器 */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="overview-start-date">开始日期</Label>
                  <Input
                    id="overview-start-date"
                    type="date"
                    value={overviewStartDate}
                    onChange={(e) => setOverviewStartDate(e.target.value)}
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="overview-end-date">结束日期</Label>
                  <Input
                    id="overview-end-date"
                    type="date"
                    value={overviewEndDate}
                    onChange={(e) => setOverviewEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 快捷日期按钮 */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setOverviewDateRange(7)}>
                  最近七天
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOverviewDateRange(30)}>
                  最近一月
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOverviewDateRange(180)}>
                  最近半年
                </Button>
              </div>
            </div>

            {/* 饼状图 - 使用Pie Chart - Interactive组件 */}
            <PieChartInteractive
              data={processPieData}
              startDate={overviewStartDate}
              endDate={overviewEndDate}
            />
          </CardContent>
        </Card>

        {/* PART2: 当前运行状态 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">当前运行状态</CardTitle>
                <CardDescription>设备实时运行状态及时长</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCurrentStatusData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* 当前状态显示 */}
            {currentStatus ? (
              <div className="space-y-6">
                {/* 设备状态卡片 - 与整体风格协调 */}
                <Card className="w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      当前设备状态
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            currentStatus.设备状态 === '正常运行'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-orange-100 dark:bg-orange-900/30'
                          }`}>
                            <div className={`text-xl ${
                              currentStatus.设备状态 === '正常运行' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {getStatusDisplay(currentStatus.设备状态).icon}
                            </div>
                          </div>
                          {/* 状态指示器 */}
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-background ${
                            currentStatus.设备状态 === '正常运行'
                              ? 'bg-green-500 animate-pulse'
                              : 'bg-orange-500 animate-pulse'
                          }`}></div>
                        </div>

                        <div>
                          <div className="text-lg font-semibold text-foreground mb-1">
                            {getStatusDisplay(currentStatus.设备状态).text}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            操作员: <span className="font-medium text-foreground">{currentStatus.操作员}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">开始时间</div>
                        <div className="text-sm font-medium text-foreground">
                          {currentStatus.日期}
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {currentStatus.时间}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 独立的实时计时器显示 */}
                <div className="md:col-span-2">
                  <Card>
                    <CardContent className="pt-6">
                      <RealTimeTimer currentStatus={currentStatus} />
                      <div className="mt-4 text-center text-sm text-muted-foreground">
                        开始时间: {currentStatus.日期} {currentStatus.时间}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 情况说明卡片 - 与整体风格协调 */}
                <Card className="w-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      运行情况说明
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-base text-foreground leading-relaxed">
                        {currentStatus.情况说明 || (
                          <span className="text-muted-foreground italic">暂无特殊说明</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span>实时监控中</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          最后更新: <SimpleTimeDisplay />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无当前运行状态数据</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PART3: 设备运行记录汇总 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">设备运行记录汇总</CardTitle>
                <CardDescription>机器运行记录列表和详细信息</CardDescription>
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
                    <TableHead>时间</TableHead>
                    <TableHead>操作员</TableHead>
                    <TableHead>设备状态</TableHead>
                    <TableHead>持续时长</TableHead>
                    <TableHead>情况说明</TableHead>
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
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>机器运行记录详情</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>日期</Label>
                                    <div className="text-sm">{item.日期}</div>
                                  </div>
                                  <div>
                                    <Label>时间</Label>
                                    <div className="text-sm">{item.时间}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>操作员</Label>
                                    <div className="text-sm">{item.操作员}</div>
                                  </div>
                                  <div>
                                    <Label>设备状态</Label>
                                    <div className="text-sm">
                                      <Badge className={getStatusDisplay(item.设备状态).color}>
                                        {getStatusDisplay(item.设备状态).icon}
                                        <span className="ml-2">{item.设备状态}</span>
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <Label>持续时长</Label>
                                  <div className="text-sm">{item.持续时长 || '--'}</div>
                                </div>
                                <div>
                                  <Label>情况说明</Label>
                                  <div className="text-sm">{item.情况说明 || '无特殊说明'}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                  <div>
                                    <Label>创建时间</Label>
                                    <div>{item.created_at ? new Date(item.created_at).toLocaleString() : '--'}</div>
                                  </div>
                                  <div>
                                    <Label>更新时间</Label>
                                    <div>{item.updated_at ? new Date(item.updated_at).toLocaleString() : '--'}</div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          {item.日期 ? new Date(item.日期).toLocaleDateString() : '--'}
                        </TableCell>
                        <TableCell>{item.时间 || '--'}</TableCell>
                        <TableCell className="font-medium">{item.操作员 || '--'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusDisplay(item.设备状态).color}>
                            {getStatusDisplay(item.设备状态).icon}
                            <span className="ml-2">{item.设备状态}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{item.持续时长 || '--'}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.情况说明 || '--'}</TableCell>
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

      {/* Footer */}
      <Footer />
    </div>
  );
}


