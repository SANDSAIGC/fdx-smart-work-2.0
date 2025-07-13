"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  RefreshCw, Download, Eye, ChevronLeft, ChevronRight,
  TrendingUp, CheckCircle, AlertTriangle, Activity, Target, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header2 } from "@/components/headers";
import { Footer } from "@/components/ui/footer";
import { AuthGuard } from "@/components/auth-guard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, ReferenceLine, ReferenceArea } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LabelList, Label as RechartsLabel } from 'recharts';

// 浓细度数据接口
interface ConcentrationFinenessData {
  id: number;
  日期: string;
  时间: string;
  操作员: string;
  进料流量?: number;
  一号壶称重?: number;
  一号壶浓度?: number;
  二号壶称重?: number;
  二号壶浓度?: number;
  二号壶细度称重?: number;
  二号壶细度?: number;
  一号壶称重照片url?: string;
  二号壶称重照片url?: string;
  二号壶细度称重照片url?: string;
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
  time: string;
  富鼎翔一号壶浓度: number | null;
  富鼎翔二号壶浓度: number | null;
  富鼎翔二号壶细度: number | null;
  科力一号壶浓度: number | null;
  科力二号壶浓度: number | null;
  科力二号壶细度: number | null;
}

// 浓细度标准配置接口
interface ConcentrationStandard {
  min: number;
  max: number;
  unit: string;
  name: string;
}

// 达标状态类型
type ComplianceStatus = 'compliant' | 'warning' | 'non-compliant';

// 达标状态结果接口
interface ComplianceResult {
  status: ComplianceStatus;
  deviation: number; // 偏差百分比
  message: string;
}

// 浓细度标准配置
const CONCENTRATION_STANDARDS = {
  // 一号磨标准（富鼎翔）
  fdx: {
    进料流量: { min: 30, max: 40, unit: 't/h', name: '进料流量' },
    一号壶浓度: { min: 70, max: 75, unit: '%', name: '作业浓度（1号排矿口浓度）' },
    二号壶浓度: { min: 45, max: 50, unit: '%', name: '螺旋分级机溢流浓度' },
    二号壶细度: { min: 60, max: 65, unit: '%', name: '细度（-200目占比）' }
  },
  // 二号磨标准（科力）
  kl: {
    进料流量: { min: 30, max: 40, unit: 't/h', name: '进料流量' },
    一号壶浓度: { min: 65, max: 70, unit: '%', name: '作业浓度（排矿口浓度）' },
    二号壶浓度: { min: 35, max: 40, unit: '%', name: '旋流器溢流浓度' },
    二号壶细度: { min: 80, max: 85, unit: '%', name: '细度（旋流器溢流细度-200目占比）' }
  }
};

function ConcentrationFinenessMonitorPageContent() {
  // 数据状态
  const [fdxData, setFdxData] = useState<ConcentrationFinenessData[]>([]);
  const [klData, setKlData] = useState<ConcentrationFinenessData[]>([]);

  // 趋势图日期状态 - 默认选定为昨天（有数据的日期）
  const [trendDate, setTrendDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return format(date, 'yyyy-MM-dd');
  });

  // 表格日期状态 - 默认选定为最近一周
  const [tableStartDate, setTableStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return format(date, 'yyyy-MM-dd');
  });
  const [tableEndDate, setTableEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // 选项卡状态 - 分别管理趋势图、实时数据和数据汇总的选项卡
  const [activeTabTrend, setActiveTabTrend] = useState('fdx');
  const [activeTabRealtime, setActiveTabRealtime] = useState('fdx');
  const [activeTabSummary, setActiveTabSummary] = useState('fdx');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);

  // 图表配置
  const chartConfig = {
    富鼎翔一号壶浓度: {
      label: "富鼎翔一号壶浓度",
      color: "var(--chart-1)",
    },
    富鼎翔二号壶浓度: {
      label: "富鼎翔二号壶浓度",
      color: "var(--chart-2)",
    },
    富鼎翔二号壶细度: {
      label: "富鼎翔二号壶细度",
      color: "var(--chart-3)",
    },
    科力一号壶浓度: {
      label: "科力一号壶浓度",
      color: "var(--chart-4)",
    },
    科力二号壶浓度: {
      label: "科力二号壶浓度",
      color: "var(--chart-5)",
    },
    科力二号壶细度: {
      label: "科力二号壶细度",
      color: "var(--chart-6)",
    },
  } satisfies ChartConfig;

  // 甜甜圈图配置
  const donutConfig = {
    value: {
      label: "数值",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // 数据获取函数
  const fetchConcentrationFinenessData = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // 并行获取富鼎翔和科力数据
      const [fdxResponse, klResponse] = await Promise.all([
        fetch('/api/concentration-fineness-monitor', {
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
        fetch('/api/concentration-fineness-monitor', {
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

      const [fdxResult, klResult] = await Promise.all([
        fdxResponse.json(),
        klResponse.json()
      ]);

      if (fdxResult.success && klResult.success) {
        console.log('浓细度数据获取成功');
        console.log('富鼎翔数据:', fdxResult.data);
        console.log('科力数据:', klResult.data);
        setFdxData(fdxResult.data || []);
        setKlData(klResult.data || []);
      } else {
        console.error('数据获取失败:', fdxResult.error || klResult.error);
      }
    } catch (error) {
      console.error('API调用失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 快捷日期设置
  const setDateRange = useCallback((days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    setTableStartDate(format(startDate, 'yyyy-MM-dd'));
    setTableEndDate(format(endDate, 'yyyy-MM-dd'));
  }, []);

  // 刷新趋势数据
  const refreshTrendData = useCallback(() => {
    fetchConcentrationFinenessData(trendDate, trendDate);
  }, [trendDate, fetchConcentrationFinenessData]);

  // 刷新表格数据
  const refreshTableData = useCallback(() => {
    fetchConcentrationFinenessData(tableStartDate, tableEndDate);
  }, [tableStartDate, tableEndDate, fetchConcentrationFinenessData]);

  // 排序切换
  const toggleSort = useCallback(() => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  }, []);
  // 处理趋势图数据 - 支持不同数据源
  const processTrendData = useCallback((dataSource: 'fdx' | 'kl' = 'fdx'): TrendDataItem[] => {
    const sourceData = dataSource === 'fdx' ? fdxData : klData;

    // 筛选指定日期的数据
    const filteredData = sourceData.filter(item => {
      if (!item.日期) return false;
      const itemDate = new Date(item.日期).toISOString().split('T')[0];
      return itemDate === trendDate;
    });

    // 如果没有数据，返回空数组
    if (filteredData.length === 0) {
      return [];
    }

    // 按时间排序并直接使用实际数据点，不创建24小时空白轴
    const trendData = filteredData
      .sort((a, b) => {
        const timeA = a.时间 || '00:00';
        const timeB = b.时间 || '00:00';
        return timeA.localeCompare(timeB);
      })
      .map(item => {
        // 根据数据源设置对应的字段
        const dataItem: TrendDataItem = {
          date: item.日期,
          time: item.时间 || '00:00',
          富鼎翔一号壶浓度: dataSource === 'fdx' ? (item.一号壶浓度 || null) : null,
          富鼎翔二号壶浓度: dataSource === 'fdx' ? (item.二号壶浓度 || null) : null,
          富鼎翔二号壶细度: dataSource === 'fdx' ? (item.二号壶细度 || null) : null,
          科力一号壶浓度: dataSource === 'kl' ? (item.一号壶浓度 || null) : null,
          科力二号壶浓度: dataSource === 'kl' ? (item.二号壶浓度 || null) : null,
          科力二号壶细度: dataSource === 'kl' ? (item.二号壶细度 || null) : null,
        };

        return dataItem;
      });

    return trendData;
  }, [fdxData, klData, trendDate]);

  // 处理最新实时数据
  const processLatestData = useCallback((dataSource: 'fdx' | 'kl'): DonutDataItem[] => {
    const sourceData = dataSource === 'fdx' ? fdxData : klData;

    // 获取最新数据
    const latestData = sourceData
      .sort((a, b) => {
        const dateA = new Date(a.日期 + ' ' + (a.时间 || '00:00'));
        const dateB = new Date(b.日期 + ' ' + (b.时间 || '00:00'));
        return dateB.getTime() - dateA.getTime();
      })[0];

    if (!latestData) {
      return [];
    }

    const result: DonutDataItem[] = [];

    // 进料流量
    if (latestData.进料流量 !== undefined && latestData.进料流量 !== null) {
      result.push({
        name: '进料流量',
        value: latestData.进料流量,
        maxValue: 100, // 最大值100 t/h
        unit: 't/h',
        fill: 'var(--chart-1)'
      });
    }

    // 一号壶浓度
    if (latestData.一号壶浓度 !== undefined && latestData.一号壶浓度 !== null) {
      result.push({
        name: '一号壶浓度',
        value: latestData.一号壶浓度,
        maxValue: 100, // 最大值100%
        unit: '%',
        fill: 'var(--chart-2)'
      });
    }

    // 二号壶浓度
    if (latestData.二号壶浓度 !== undefined && latestData.二号壶浓度 !== null) {
      result.push({
        name: '二号壶浓度',
        value: latestData.二号壶浓度,
        maxValue: 100, // 最大值100%
        unit: '%',
        fill: 'var(--chart-3)'
      });
    }

    // 二号壶细度
    if (latestData.二号壶细度 !== undefined && latestData.二号壶细度 !== null) {
      result.push({
        name: '二号壶细度',
        value: latestData.二号壶细度,
        maxValue: 100, // 最大值100%
        unit: '%',
        fill: 'var(--chart-4)'
      });
    }

    return result;
  }, [fdxData, klData]);

  // 获取达标状态和偏差分析
  const getComplianceAnalysis = useCallback((
    value: number | undefined | null,
    parameterType: '进料流量' | '一号壶浓度' | '二号壶浓度' | '二号壶细度',
    dataSource: 'fdx' | 'kl'
  ): ComplianceResult | null => {
    if (value === undefined || value === null) return null;

    // 进料流量特殊处理：分级标准
    if (parameterType === '进料流量') {
      let status: ComplianceStatus;
      let deviation: number = 0;
      let message: string;

      if (value >= 20 && value < 30) {
        status = 'non-compliant';
        message = '低';
      } else if (value >= 30 && value <= 40) {
        status = 'compliant';
        message = '中';
      } else if (value > 40 && value <= 50) {
        status = 'warning';
        message = '高';
      } else if (value < 20) {
        status = 'non-compliant';
        message = '极低';
      } else {
        status = 'non-compliant';
        message = '极高';
      }

      return { status, deviation, message };
    }

    // 其他参数按原有逻辑处理
    const standard = CONCENTRATION_STANDARDS[dataSource][parameterType];
    const { min, max } = standard;

    let status: ComplianceStatus;
    let deviation: number;
    let message: string;

    if (value >= min && value <= max) {
      // 达标
      status = 'compliant';
      deviation = 0;
      message = '达标';
    } else if (value < min) {
      // 低于标准
      const warningThreshold = min - (max - min) * 0.1; // 10%容差
      if (value >= warningThreshold) {
        status = 'warning';
        deviation = ((min - value) / min) * 100;
        message = `偏低 ${deviation.toFixed(1)}%`;
      } else {
        status = 'non-compliant';
        deviation = ((min - value) / min) * 100;
        message = `严重偏低 ${deviation.toFixed(1)}%`;
      }
    } else {
      // 高于标准
      const warningThreshold = max + (max - min) * 0.1; // 10%容差
      if (value <= warningThreshold) {
        status = 'warning';
        deviation = ((value - max) / max) * 100;
        message = `偏高 ${deviation.toFixed(1)}%`;
      } else {
        status = 'non-compliant';
        deviation = ((value - max) / max) * 100;
        message = `严重偏高 ${deviation.toFixed(1)}%`;
      }
    }

    return { status, deviation, message };
  }, []);

  // 状态指示器组件
  const ComplianceIndicator = ({
    value,
    parameterType,
    dataSource,
    showStandard = false
  }: {
    value: number | undefined | null;
    parameterType: '进料流量' | '一号壶浓度' | '二号壶浓度' | '二号壶细度';
    dataSource: 'fdx' | 'kl';
    showStandard?: boolean;
  }) => {
    const analysis = getComplianceAnalysis(value, parameterType, dataSource);

    if (!analysis) {
      return (
        <div className="flex flex-col items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            无数据
          </Badge>
          {showStandard && parameterType !== '进料流量' && (
            <div className="text-xs text-muted-foreground text-center">
              {(() => {
                const standard = CONCENTRATION_STANDARDS[dataSource][parameterType];
                return `标准: ${standard.min}-${standard.max}${standard.unit}`;
              })()}
            </div>
          )}
          {showStandard && parameterType === '进料流量' && (
            <div className="text-xs text-muted-foreground text-center">
              20-30低；30-40中；40-50高
            </div>
          )}
        </div>
      );
    }

    const getStatusColor = (status: ComplianceStatus) => {
      switch (status) {
        case 'compliant':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'warning':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'non-compliant':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusIcon = (status: ComplianceStatus) => {
      switch (status) {
        case 'compliant':
          return <CheckCircle className="h-3 w-3 mr-1" />;
        case 'warning':
          return <AlertTriangle className="h-3 w-3 mr-1" />;
        case 'non-compliant':
          return <Target className="h-3 w-3 mr-1" />;
        default:
          return <AlertCircle className="h-3 w-3 mr-1" />;
      }
    };

    return (
      <div className="flex flex-col items-center gap-1">
        <Badge
          variant="outline"
          className={`text-xs border ${getStatusColor(analysis.status)}`}
        >
          {getStatusIcon(analysis.status)}
          {analysis.message}
        </Badge>
        {showStandard && parameterType !== '进料流量' && (
          <div className="text-xs text-muted-foreground text-center">
            {(() => {
              const standard = CONCENTRATION_STANDARDS[dataSource][parameterType];
              return `标准: ${standard.min}-${standard.max}${standard.unit}`;
            })()}
          </div>
        )}
        {showStandard && parameterType === '进料流量' && (
          <div className="text-xs text-muted-foreground text-center">
            20-30低；30-40中；40-50高
          </div>
        )}
      </div>
    );
  };

  // 处理表格数据
  const processTableData = useCallback((dataSource: 'fdx' | 'kl') => {
    const sourceData = dataSource === 'fdx' ? fdxData : klData;

    // 筛选日期范围内的数据
    const filteredData = sourceData.filter(item => {
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
  }, [fdxData, klData, tableStartDate, tableEndDate, sortOrder]);

  // 导出Excel功能
  const exportToExcel = useCallback(() => {
    const dataSource = activeTabSummary as 'fdx' | 'kl';
    const data = processTableData(dataSource);

    if (data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 创建CSV内容
    const headers = ['日期', '时间', '操作员', '进料流量(t/h)', '一号壶称重', '一号壶浓度(%)', '二号壶称重', '二号壶浓度(%)', '二号壶细度称重', '二号壶细度(%)'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.日期 || '',
        item.时间 || '',
        item.操作员 || '',
        item.进料流量 || '',
        item.一号壶称重 || '',
        item.一号壶浓度 || '',
        item.二号壶称重 || '',
        item.二号壶浓度 || '',
        item.二号壶细度称重 || '',
        item.二号壶细度 || ''
      ].join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `浓细度数据_${dataSource === 'fdx' ? '富鼎翔' : '科力'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeTabSummary, processTableData]);

  // 获取达标状态（保持向后兼容，但使用新的标准）
  const getComplianceStatus = (
    value: number | undefined,
    parameterType: '一号壶浓度' | '二号壶浓度' | '二号壶细度',
    dataSource: 'fdx' | 'kl'
  ) => {
    if (value === undefined || value === null) return null;

    const analysis = getComplianceAnalysis(value, parameterType, dataSource);
    if (!analysis) return null;

    const getStatusColor = (status: ComplianceStatus) => {
      switch (status) {
        case 'compliant':
          return 'bg-green-100 text-green-800';
        case 'warning':
          return 'bg-yellow-100 text-yellow-800';
        case 'non-compliant':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusIcon = (status: ComplianceStatus) => {
      switch (status) {
        case 'compliant':
          return <CheckCircle className="h-3 w-3 mr-1" />;
        case 'warning':
          return <AlertTriangle className="h-3 w-3 mr-1" />;
        case 'non-compliant':
          return <Target className="h-3 w-3 mr-1" />;
        default:
          return <AlertCircle className="h-3 w-3 mr-1" />;
      }
    };

    return (
      <Badge variant="outline" className={getStatusColor(analysis.status)}>
        {getStatusIcon(analysis.status)}
        {analysis.message}
      </Badge>
    );
  };

  // 获取最近更新时间
  const getLastUpdateTime = useCallback((dataSource: 'fdx' | 'kl') => {
    const sourceData = dataSource === 'fdx' ? fdxData : klData;

    if (sourceData.length === 0) {
      return '--';
    }

    // 找到最新的记录
    const latestRecord = sourceData
      .filter(item => item.日期 && item.时间)
      .sort((a, b) => {
        const dateTimeA = new Date(a.日期 + ' ' + (a.时间 || '00:00'));
        const dateTimeB = new Date(b.日期 + ' ' + (b.时间 || '00:00'));
        return dateTimeB.getTime() - dateTimeA.getTime();
      })[0];

    if (!latestRecord) {
      return '--';
    }

    // 格式化显示时间
    const updateDate = new Date(latestRecord.日期);
    const updateTime = latestRecord.时间 || '00:00';

    return `${format(updateDate, 'MM-dd')} ${updateTime}`;
  }, [fdxData, klData]);

  // 甜甜圈图组件 - 增强版，支持标准范围显示
  const DonutChart = ({
    data,
    standard = "浓细度标准",
    showStandardRange = false,
    dataSource,
    parameterType
  }: {
    data: DonutDataItem;
    standard?: string;
    showStandardRange?: boolean;
    dataSource?: 'fdx' | 'kl';
    parameterType?: '进料流量' | '一号壶浓度' | '二号壶浓度' | '二号壶细度';
  }) => {
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
      <Card className="flex flex-col h-full">
        <CardHeader className="items-center pb-2">
          <CardTitle className="text-sm text-center">{data.name}</CardTitle>
          <CardDescription className="text-xs text-center">按照{standard}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          <ChartContainer
            config={donutConfig}
            className="mx-auto aspect-square max-h-[180px]"
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
                            className="fill-foreground text-xl font-bold"
                          >
                            {data.value.toFixed(1)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 18}
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
        <CardFooter className="flex-col gap-1 pt-2">
          <div className="text-sm font-medium text-center">
            当前: {data.value.toFixed(2)}{data.unit}
          </div>
          {showStandardRange && dataSource && parameterType && parameterType !== '进料流量' && (
            <div className="text-xs text-muted-foreground text-center">
              {(() => {
                const standardRange = CONCENTRATION_STANDARDS[dataSource][parameterType];
                return `标准: ${standardRange.min}-${standardRange.max}${standardRange.unit}`;
              })()}
            </div>
          )}
          {showStandardRange && parameterType === '进料流量' && (
            <div className="text-xs text-muted-foreground text-center">
              20-30低；30-40中；40-50高
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  // 初始化数据加载
  useEffect(() => {
    fetchConcentrationFinenessData(tableStartDate, tableEndDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听表格日期变化
  useEffect(() => {
    fetchConcentrationFinenessData(tableStartDate, tableEndDate);
  }, [tableStartDate, tableEndDate, fetchConcentrationFinenessData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header-2组件 */}
      <Header2 title="浓细度监控" />

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* PART1: 浓细度24h趋势总览 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">浓细度24h趋势总览</CardTitle>
                <CardDescription>显示选定日期的浓细度变化趋势</CardDescription>
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
            <div className="flex items-center gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="trend-date">选择日期</Label>
                <Input
                  id="trend-date"
                  type="date"
                  value={trendDate}
                  onChange={(e) => setTrendDate(e.target.value)}
                />
              </div>
            </div>

            {/* 选项卡 - 独立的趋势图选项卡状态 */}
            <Tabs value={activeTabTrend} onValueChange={setActiveTabTrend} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
                <TabsTrigger value="kl">科力数据</TabsTrigger>
              </TabsList>

              {/* 富鼎翔数据选项卡 */}
              <TabsContent value="fdx" className="space-y-4">
                <Card>
                  <CardHeader className="relative">
                    <CardTitle>富鼎翔浓细度参数趋势</CardTitle>
                    <CardDescription>数据同步于数据表：浓细度记录-FDX</CardDescription>
                    {/* 进料流量Badge - 右上角绝对定位 */}
                    <Badge variant="outline" className="absolute top-4 right-4 text-sm px-2 py-1">
                      <Activity className="h-3 w-3 mr-1" />
                      {(() => {
                        const fdxTrendData = fdxData.find(item => item.日期 === trendDate);
                        return fdxTrendData?.进料流量
                          ? `${fdxTrendData.进料流量.toFixed(1)} t/h`
                          : '--';
                      })()}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80 w-full">
                      <LineChart data={processTrendData('fdx')}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          content={<ChartTooltipContent />}
                        />
                        <Legend />

                        {/* 标准范围参考区域 */}
                        <ReferenceArea
                          y1={CONCENTRATION_STANDARDS.fdx.一号壶浓度.min}
                          y2={CONCENTRATION_STANDARDS.fdx.一号壶浓度.max}
                          fill="var(--chart-1)"
                          fillOpacity={0.1}
                          stroke="var(--chart-1)"
                          strokeOpacity={0.3}
                          strokeDasharray="2 2"
                        />
                        <ReferenceArea
                          y1={CONCENTRATION_STANDARDS.fdx.二号壶浓度.min}
                          y2={CONCENTRATION_STANDARDS.fdx.二号壶浓度.max}
                          fill="var(--chart-2)"
                          fillOpacity={0.1}
                          stroke="var(--chart-2)"
                          strokeOpacity={0.3}
                          strokeDasharray="2 2"
                        />
                        <ReferenceArea
                          y1={CONCENTRATION_STANDARDS.fdx.二号壶细度.min}
                          y2={CONCENTRATION_STANDARDS.fdx.二号壶细度.max}
                          fill="var(--chart-3)"
                          fillOpacity={0.1}
                          stroke="var(--chart-3)"
                          strokeOpacity={0.3}
                          strokeDasharray="2 2"
                        />

                        <Line
                          dataKey="富鼎翔一号壶浓度"
                          type="monotone"
                          stroke="var(--chart-1)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls={true}
                        />
                        <Line
                          dataKey="富鼎翔二号壶浓度"
                          type="monotone"
                          stroke="var(--chart-2)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls={true}
                        />
                        <Line
                          dataKey="富鼎翔二号壶细度"
                          type="monotone"
                          stroke="var(--chart-3)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls={true}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 科力数据选项卡 */}
              <TabsContent value="kl" className="space-y-4">
                <Card>
                  <CardHeader className="relative">
                    <CardTitle>科力浓细度参数趋势</CardTitle>
                    <CardDescription>数据同步于数据表：浓细度记录-KL</CardDescription>
                    {/* 进料流量Badge - 右上角绝对定位 */}
                    <Badge variant="outline" className="absolute top-4 right-4 text-sm px-2 py-1">
                      <Activity className="h-3 w-3 mr-1" />
                      {(() => {
                        const klTrendData = klData.find(item => item.日期 === trendDate);
                        return klTrendData?.进料流量
                          ? `${klTrendData.进料流量.toFixed(1)} t/h`
                          : '--';
                      })()}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-80 w-full">
                      <LineChart data={processTrendData('kl')}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          content={<ChartTooltipContent />}
                        />
                        <Legend />

                        {/* 标准范围参考区域 */}
                        <ReferenceArea
                          y1={CONCENTRATION_STANDARDS.kl.一号壶浓度.min}
                          y2={CONCENTRATION_STANDARDS.kl.一号壶浓度.max}
                          fill="var(--chart-4)"
                          fillOpacity={0.1}
                          stroke="var(--chart-4)"
                          strokeOpacity={0.3}
                          strokeDasharray="2 2"
                        />
                        <ReferenceArea
                          y1={CONCENTRATION_STANDARDS.kl.二号壶浓度.min}
                          y2={CONCENTRATION_STANDARDS.kl.二号壶浓度.max}
                          fill="var(--chart-5)"
                          fillOpacity={0.1}
                          stroke="var(--chart-5)"
                          strokeOpacity={0.3}
                          strokeDasharray="2 2"
                        />
                        <ReferenceArea
                          y1={CONCENTRATION_STANDARDS.kl.二号壶细度.min}
                          y2={CONCENTRATION_STANDARDS.kl.二号壶细度.max}
                          fill="var(--chart-6)"
                          fillOpacity={0.1}
                          stroke="var(--chart-6)"
                          strokeOpacity={0.3}
                          strokeDasharray="2 2"
                        />

                        <Line
                          dataKey="科力一号壶浓度"
                          type="monotone"
                          stroke="var(--chart-4)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls={true}
                        />
                        <Line
                          dataKey="科力二号壶浓度"
                          type="monotone"
                          stroke="var(--chart-5)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls={true}
                        />
                        <Line
                          dataKey="科力二号壶细度"
                          type="monotone"
                          stroke="var(--chart-6)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls={true}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {/* PART2: 最新实时数据 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">最新实时数据</CardTitle>
                <CardDescription>显示最新的浓细度数据</CardDescription>
              </div>
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
          </CardHeader>
          <CardContent>
            {/* 选项卡 - 独立的实时数据选项卡状态 */}
            <Tabs value={activeTabRealtime} onValueChange={setActiveTabRealtime} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
                <TabsTrigger value="kl">科力数据</TabsTrigger>
              </TabsList>

              {/* 富鼎翔数据选项卡 */}
              <TabsContent value="fdx" className="space-y-4">
                {/* 富鼎翔最近更新时间 */}
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <Activity className="h-3 w-3 mr-2" />
                    富鼎翔最近更新时间：{getLastUpdateTime('fdx')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {processLatestData('fdx').map((item, index) => {
                    // 确定参数类型
                    let parameterType: '进料流量' | '一号壶浓度' | '二号壶浓度' | '二号壶细度' | null = null;
                    if (item.name === '进料流量') parameterType = '进料流量';
                    else if (item.name === '一号壶浓度') parameterType = '一号壶浓度';
                    else if (item.name === '二号壶浓度') parameterType = '二号壶浓度';
                    else if (item.name === '二号壶细度') parameterType = '二号壶细度';

                    return (
                      <div key={index} className="flex flex-col space-y-2 h-full">
                        <div className="flex-1">
                          <DonutChart
                            data={item}
                            standard="富鼎翔标准"
                            showStandardRange={!!parameterType}
                            dataSource="fdx"
                            parameterType={parameterType || undefined}
                          />
                        </div>
                        {parameterType && (
                          <div className="flex justify-center">
                            <ComplianceIndicator
                              value={item.value}
                              parameterType={parameterType}
                              dataSource="fdx"
                              showStandard={false}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* 科力数据选项卡 */}
              <TabsContent value="kl" className="space-y-4">
                {/* 科力最近更新时间 */}
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <Activity className="h-3 w-3 mr-2" />
                    科力最近更新时间：{getLastUpdateTime('kl')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {processLatestData('kl').map((item, index) => {
                    // 确定参数类型
                    let parameterType: '进料流量' | '一号壶浓度' | '二号壶浓度' | '二号壶细度' | null = null;
                    if (item.name === '进料流量') parameterType = '进料流量';
                    else if (item.name === '一号壶浓度') parameterType = '一号壶浓度';
                    else if (item.name === '二号壶浓度') parameterType = '二号壶浓度';
                    else if (item.name === '二号壶细度') parameterType = '二号壶细度';

                    return (
                      <div key={index} className="flex flex-col space-y-2 h-full">
                        <div className="flex-1">
                          <DonutChart
                            data={item}
                            standard="科力标准"
                            showStandardRange={!!parameterType}
                            dataSource="kl"
                            parameterType={parameterType || undefined}
                          />
                        </div>
                        {parameterType && (
                          <div className="flex justify-center">
                            <ComplianceIndicator
                              value={item.value}
                              parameterType={parameterType}
                              dataSource="kl"
                              showStandard={false}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* PART3: 浓细度数据汇总 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">浓细度数据汇总</CardTitle>
                <CardDescription>浓细度数据列表和详细信息</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  disabled={processTableData(activeTabSummary as 'fdx' | 'kl').length === 0}
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
          <CardContent>
            {/* 选项卡 - 独立的数据汇总选项卡状态 */}
            <Tabs value={activeTabSummary} onValueChange={setActiveTabSummary} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fdx">富鼎翔</TabsTrigger>
                <TabsTrigger value="kl">科力</TabsTrigger>
              </TabsList>

              {/* 富鼎翔数据选项卡 */}
              <TabsContent value="fdx" className="space-y-4">
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
                        <TableHead>进料流量(t/h)</TableHead>
                        <TableHead>一号壶浓度(%)</TableHead>
                        <TableHead>二号壶浓度(%)</TableHead>
                        <TableHead>二号壶细度(%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const tableData = processTableData('fdx');
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedData = tableData.slice(startIndex, endIndex);

                        if (paginatedData.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                                    <DialogTitle>浓细度数据详情</DialogTitle>
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
                                    <div>
                                      <Label>操作员</Label>
                                      <div className="text-sm">{item.操作员}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>进料流量</Label>
                                        <div className="text-sm">{item.进料流量?.toFixed(2) || '--'} t/h</div>
                                      </div>
                                      <div>
                                        <Label>一号壶浓度</Label>
                                        <div className="text-sm">{item.一号壶浓度?.toFixed(2) || '--'} %</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>二号壶浓度</Label>
                                        <div className="text-sm">{item.二号壶浓度?.toFixed(2) || '--'} %</div>
                                      </div>
                                      <div>
                                        <Label>二号壶细度</Label>
                                        <div className="text-sm">{item.二号壶细度?.toFixed(2) || '--'} %</div>
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
                            <TableCell>{item.进料流量?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item.一号壶浓度?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item.二号壶浓度?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item.二号壶细度?.toFixed(2) || '--'}</TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控制 */}
                {(() => {
                  const tableData = processTableData('fdx');
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
              </TabsContent>

              {/* 科力数据选项卡 */}
              <TabsContent value="kl" className="space-y-4">
                {/* 日期选择器 */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="kl-table-start-date">开始日期</Label>
                      <Input
                        id="kl-table-start-date"
                        type="date"
                        value={tableStartDate}
                        onChange={(e) => setTableStartDate(e.target.value)}
                      />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="kl-table-end-date">结束日期</Label>
                      <Input
                        id="kl-table-end-date"
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
                {/* 科力数据表格 */}
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
                        <TableHead>进料流量(t/h)</TableHead>
                        <TableHead>一号壶浓度(%)</TableHead>
                        <TableHead>二号壶浓度(%)</TableHead>
                        <TableHead>二号壶细度(%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const tableData = processTableData('kl');
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedData = tableData.slice(startIndex, endIndex);

                        if (paginatedData.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                                    <DialogTitle>浓细度数据详情</DialogTitle>
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
                                    <div>
                                      <Label>操作员</Label>
                                      <div className="text-sm">{item.操作员}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>进料流量</Label>
                                        <div className="text-sm">{item.进料流量?.toFixed(2) || '--'} t/h</div>
                                      </div>
                                      <div>
                                        <Label>一号壶浓度</Label>
                                        <div className="text-sm">{item.一号壶浓度?.toFixed(2) || '--'} %</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>二号壶浓度</Label>
                                        <div className="text-sm">{item.二号壶浓度?.toFixed(2) || '--'} %</div>
                                      </div>
                                      <div>
                                        <Label>二号壶细度</Label>
                                        <div className="text-sm">{item.二号壶细度?.toFixed(2) || '--'} %</div>
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
                            <TableCell>{item.进料流量?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item.一号壶浓度?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item.二号壶浓度?.toFixed(2) || '--'}</TableCell>
                            <TableCell>{item.二号壶细度?.toFixed(2) || '--'}</TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
                {/* 科力数据分页控制 */}
                {(() => {
                  const tableData = processTableData('kl');
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function ConcentrationFinenessMonitorPage() {
  return (
    <AuthGuard>
      <ConcentrationFinenessMonitorPageContent />
    </AuthGuard>
  );
}
