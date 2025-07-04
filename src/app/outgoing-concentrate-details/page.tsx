"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from 'date-fns';
import { Header2 } from '@/components/headers';
import {
  TruckIcon, RefreshCw, Calendar, PieChartIcon,
  TrendingUp, Download, ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Footer } from "@/components/ui/footer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Label as RechartsLabel } from "recharts";

// 出厂精矿数据接口
interface OutgoingConcentrateData {
  id: number;
  计量日期: string;
  出厂湿重?: number;
  '湿重(t)'?: number;
  '水份(%)'?: number;
  '精矿Pb品位'?: number;
  '精矿Zn品位'?: number;
  'Pb'?: number;
  'Zn'?: number;
  'Zn金属量'?: number;
  '金属量(t)'?: number;
  化验人员?: string;
  发货单位名称?: string;
  收货单位名称?: string;
}

// 甜甜圈图表数据接口
interface DonutDataItem {
  name: string;
  value: number;
  fill: string;
  maxValue: number;
  unit: string;
}

// 趋势图数据接口
interface TrendDataItem {
  date: string;
  富鼎翔: number;
  金鼎: number;
}

export default function OutgoingConcentrateDetailsPage() {
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [fdxData, setFdxData] = useState<OutgoingConcentrateData[]>([]);
  const [jdxyData, setJdxyData] = useState<OutgoingConcentrateData[]>([]);
  
  // 趋势图日期范围
  const [trendStartDate, setTrendStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [trendEndDate, setTrendEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  
  // 单日详情日期
  const [singleDate, setSingleDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [singleDayTab, setSingleDayTab] = useState('jdxy');
  
  // 表格数据日期范围
  const [tableStartDate, setTableStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return format(date, 'yyyy-MM-dd');
  });
  const [tableEndDate, setTableEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState('jdxy');

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
  const fetchOutgoingConcentrateData = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // 并行获取富鼎翔和金鼎数据
      const [fdxResponse, jdxyResponse] = await Promise.all([
        fetch('/api/outgoing-concentrate-details', {
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
        fetch('/api/outgoing-concentrate-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate,
            endDate,
            dataSource: 'jdxy'
          })
        })
      ]);

      const [fdxResult, jdxyResult] = await Promise.all([
        fdxResponse.json(),
        jdxyResponse.json()
      ]);

      if (fdxResult.success && jdxyResult.success) {
        console.log('=== API数据获取成功 ===');
        console.log('富鼎翔API返回数据:', fdxResult.data);
        console.log('金鼎API返回数据:', jdxyResult.data);
        setFdxData(fdxResult.data || []);
        setJdxyData(jdxyResult.data || []);
        console.log('=== 数据设置完成 ===');
      } else {
        console.error('数据获取失败:', fdxResult.error || jdxyResult.error);
      }
    } catch (error) {
      console.error('API调用失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 手动刷新趋势数据
  const refreshTrendData = () => {
    fetchOutgoingConcentrateData(trendStartDate, trendEndDate);
  };

  // 手动刷新单日详情数据
  const refreshSingleDayData = () => {
    const startDate = singleDate < trendStartDate ? singleDate : trendStartDate;
    const endDate = singleDate > trendEndDate ? singleDate : trendEndDate;
    fetchOutgoingConcentrateData(startDate, endDate);
  };

  // 手动刷新表格数据
  const refreshTableData = () => {
    const expandedStartDate = tableStartDate < trendStartDate ? tableStartDate : trendStartDate;
    const expandedEndDate = tableEndDate > trendEndDate ? tableEndDate : trendEndDate;
    fetchOutgoingConcentrateData(expandedStartDate, expandedEndDate);
  };

  // 处理金鼎表格聚合数据
  const processJdxyTableData = useCallback(() => {
    const aggregatedData = new Map();

    const filteredData = jdxyData.filter(
      item => item.计量日期 >= tableStartDate && item.计量日期 <= tableEndDate
    );

    // 按日期聚合数据
    filteredData.forEach(item => {
      const date = item.计量日期;
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pbGrade = Number(item.Pb || 0);
      const znGrade = Number(item.Zn || 0);
      const znMetal = Number(item['金属量(t)'] || 0);

      if (aggregatedData.has(date)) {
        const existing = aggregatedData.get(date);
        existing.totalWetWeight += wetWeight;
        existing.moistureWeightedSum += moisture * wetWeight;
        existing.pbWeightedSum += pbGrade * wetWeight;
        existing.znWeightedSum += znGrade * wetWeight;
        existing.totalZnMetal += znMetal;
        existing.totalWeight += wetWeight;
      } else {
        aggregatedData.set(date, {
          date,
          totalWetWeight: wetWeight,
          moistureWeightedSum: moisture * wetWeight,
          pbWeightedSum: pbGrade * wetWeight,
          znWeightedSum: znGrade * wetWeight,
          totalZnMetal: znMetal,
          totalWeight: wetWeight
        });
      }
    });

    return Array.from(aggregatedData.values()).map(item => ({
      日期: item.date,
      '出厂湿重(t)': item.totalWetWeight.toFixed(2),
      '水份(%)': item.totalWeight > 0 ? (item.moistureWeightedSum / item.totalWeight).toFixed(2) : '--',
      '精矿Pb品位(%)': item.totalWeight > 0 ? (item.pbWeightedSum / item.totalWeight).toFixed(2) : '--',
      '精矿Zn品位(%)': item.totalWeight > 0 ? (item.znWeightedSum / item.totalWeight).toFixed(2) : '--',
      'Zn金属量(t)': item.totalZnMetal.toFixed(2)
    })).sort((a, b) => sortOrder === 'desc' ? b.日期.localeCompare(a.日期) : a.日期.localeCompare(b.日期));
  }, [jdxyData, tableStartDate, tableEndDate, sortOrder]);

  // 处理富鼎翔表格聚合数据
  const processFdxTableData = useCallback(() => {
    const aggregatedData = new Map();

    const filteredData = fdxData.filter(
      item => item.计量日期 >= tableStartDate && item.计量日期 <= tableEndDate
    );

    // 按日期聚合数据
    filteredData.forEach(item => {
      const date = item.计量日期;
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pbGrade = Number(item.Pb || 0);
      const znGrade = Number(item.Zn || 0);
      const znMetal = Number(item['金属量(t)'] || 0);

      if (aggregatedData.has(date)) {
        const existing = aggregatedData.get(date);
        existing.totalWetWeight += wetWeight;
        existing.moistureWeightedSum += moisture * wetWeight;
        existing.pbWeightedSum += pbGrade * wetWeight;
        existing.znWeightedSum += znGrade * wetWeight;
        existing.totalZnMetal += znMetal;
        existing.totalWeight += wetWeight;
      } else {
        aggregatedData.set(date, {
          date,
          totalWetWeight: wetWeight,
          moistureWeightedSum: moisture * wetWeight,
          pbWeightedSum: pbGrade * wetWeight,
          znWeightedSum: znGrade * wetWeight,
          totalZnMetal: znMetal,
          totalWeight: wetWeight
        });
      }
    });

    return Array.from(aggregatedData.values()).map(item => ({
      日期: item.date,
      '出厂湿重(t)': item.totalWetWeight.toFixed(2),
      '水份(%)': item.totalWeight > 0 ? (item.moistureWeightedSum / item.totalWeight).toFixed(2) : '--',
      '精矿Pb品位(%)': item.totalWeight > 0 ? (item.pbWeightedSum / item.totalWeight).toFixed(2) : '--',
      '精矿Zn品位(%)': item.totalWeight > 0 ? (item.znWeightedSum / item.totalWeight).toFixed(2) : '--',
      'Zn金属量(t)': item.totalZnMetal.toFixed(2)
    })).sort((a, b) => sortOrder === 'desc' ? b.日期.localeCompare(a.日期) : a.日期.localeCompare(b.日期));
  }, [fdxData, tableStartDate, tableEndDate, sortOrder]);

  // 处理金鼎单日甜甜圈数据 - 支持多条数据聚合计算
  const processSingleDayJdxyData = useCallback((): DonutDataItem[] => {
    // 筛选指定日期的所有JDXY数据
    const jdxyItems = jdxyData.filter(item => item.计量日期 === singleDate);

    if (jdxyItems.length === 0) {
      // 如果没有数据，返回默认值
      return [
        {
          name: '出厂湿重',
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
          name: '精矿Pb品位',
          value: 0,
          fill: 'var(--chart-3)',
          maxValue: 80,
          unit: '%'
        },
        {
          name: '精矿Zn品位',
          value: 0,
          fill: 'var(--chart-4)',
          maxValue: 80,
          unit: '%'
        },
        {
          name: 'Zn金属量',
          value: 0,
          fill: 'var(--chart-5)',
          maxValue: 500,
          unit: 't'
        }
      ];
    }

    // 聚合计算：t重量值汇总，%百分比加权平均
    let totalWetWeight = 0;
    let moistureWeightedSum = 0;
    let pbWeightedSum = 0;
    let znWeightedSum = 0;
    let totalZnMetal = 0;
    let totalWeight = 0;

    jdxyItems.forEach(item => {
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);
      const znMetal = Number(item['金属量(t)'] || 0);

      totalWetWeight += wetWeight;
      moistureWeightedSum += moisture * wetWeight; // 按重量加权
      pbWeightedSum += pb * wetWeight; // 按重量加权
      znWeightedSum += zn * wetWeight; // 按重量加权
      totalZnMetal += znMetal;
      totalWeight += wetWeight;
    });

    // 计算加权平均值
    const avgMoisture = totalWeight > 0 ? moistureWeightedSum / totalWeight : 0;
    const avgPb = totalWeight > 0 ? pbWeightedSum / totalWeight : 0;
    const avgZn = totalWeight > 0 ? znWeightedSum / totalWeight : 0;

    return [
      {
        name: '出厂湿重',
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
        name: '精矿Pb品位',
        value: avgPb,
        fill: 'var(--chart-3)',
        maxValue: 80,
        unit: '%'
      },
      {
        name: '精矿Zn品位',
        value: avgZn,
        fill: 'var(--chart-4)',
        maxValue: 80,
        unit: '%'
      },
      {
        name: 'Zn金属量',
        value: totalZnMetal,
        fill: 'var(--chart-5)',
        maxValue: 500,
        unit: 't'
      }
    ];
  }, [jdxyData, singleDate]);

  // 处理富鼎翔单日甜甜圈数据 - 支持多条数据聚合计算
  const processSingleDayFdxData = useCallback((): DonutDataItem[] => {
    // 筛选指定日期的所有FDX数据
    const fdxItems = fdxData.filter(item => item.计量日期 === singleDate);

    if (fdxItems.length === 0) {
      // 如果没有数据，返回默认值
      return [
        {
          name: '出厂湿重',
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
          name: '精矿Pb品位',
          value: 0,
          fill: 'var(--chart-3)',
          maxValue: 80,
          unit: '%'
        },
        {
          name: '精矿Zn品位',
          value: 0,
          fill: 'var(--chart-4)',
          maxValue: 80,
          unit: '%'
        },
        {
          name: 'Zn金属量',
          value: 0,
          fill: 'var(--chart-5)',
          maxValue: 500,
          unit: 't'
        }
      ];
    }

    // 聚合计算：t重量值汇总，%百分比加权平均
    let totalWetWeight = 0;
    let moistureWeightedSum = 0;
    let pbWeightedSum = 0;
    let znWeightedSum = 0;
    let totalZnMetal = 0;
    let totalWeight = 0;

    fdxItems.forEach(item => {
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);
      const znMetal = Number(item['金属量(t)'] || 0);

      totalWetWeight += wetWeight;
      moistureWeightedSum += moisture * wetWeight; // 按重量加权
      pbWeightedSum += pb * wetWeight; // 按重量加权
      znWeightedSum += zn * wetWeight; // 按重量加权
      totalZnMetal += znMetal;
      totalWeight += wetWeight;
    });

    // 计算加权平均值
    const avgMoisture = totalWeight > 0 ? moistureWeightedSum / totalWeight : 0;
    const avgPb = totalWeight > 0 ? pbWeightedSum / totalWeight : 0;
    const avgZn = totalWeight > 0 ? znWeightedSum / totalWeight : 0;

    return [
      {
        name: '出厂湿重',
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
        name: '精矿Pb品位',
        value: avgPb,
        fill: 'var(--chart-3)',
        maxValue: 80,
        unit: '%'
      },
      {
        name: '精矿Zn品位',
        value: avgZn,
        fill: 'var(--chart-4)',
        maxValue: 80,
        unit: '%'
      },
      {
        name: 'Zn金属量',
        value: totalZnMetal,
        fill: 'var(--chart-5)',
        maxValue: 500,
        unit: 't'
      }
    ];
  }, [fdxData, singleDate]);

  // 处理趋势图数据
  const processTrendData = useCallback(() => {
    const aggregatedData = new Map();

    // 处理金鼎数据 - 按日期聚合
    jdxyData.forEach(item => {
      const date = item.计量日期;
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);
      const znMetal = Number(item['金属量(t)'] || 0);

      if (aggregatedData.has(date)) {
        const existing = aggregatedData.get(date);
        existing.jdxy.totalWetWeight += wetWeight;
        existing.jdxy.moistureWeightedSum += moisture * wetWeight;
        existing.jdxy.pbWeightedSum += pb * wetWeight;
        existing.jdxy.znWeightedSum += zn * wetWeight;
        existing.jdxy.totalZnMetal += znMetal;
        existing.jdxy.totalWeight += wetWeight;
      } else {
        aggregatedData.set(date, {
          date,
          jdxy: {
            totalWetWeight: wetWeight,
            moistureWeightedSum: moisture * wetWeight,
            pbWeightedSum: pb * wetWeight,
            znWeightedSum: zn * wetWeight,
            totalZnMetal: znMetal,
            totalWeight: wetWeight
          },
          fdx: {
            totalWetWeight: 0,
            moistureWeightedSum: 0,
            pbWeightedSum: 0,
            znWeightedSum: 0,
            totalZnMetal: 0,
            totalWeight: 0
          }
        });
      }
    });

    // 处理富鼎翔数据 - 按日期聚合
    fdxData.forEach(item => {
      const date = item.计量日期;
      const wetWeight = Number(item['湿重(t)'] || 0);
      const moisture = Number(item['水份(%)'] || 0);
      const pb = Number(item.Pb || 0);
      const zn = Number(item.Zn || 0);
      const znMetal = Number(item['金属量(t)'] || 0);

      if (aggregatedData.has(date)) {
        const existing = aggregatedData.get(date);
        existing.fdx.totalWetWeight += wetWeight;
        existing.fdx.moistureWeightedSum += moisture * wetWeight;
        existing.fdx.pbWeightedSum += pb * wetWeight;
        existing.fdx.znWeightedSum += zn * wetWeight;
        existing.fdx.totalZnMetal += znMetal;
        existing.fdx.totalWeight += wetWeight;
      } else {
        aggregatedData.set(date, {
          date,
          jdxy: {
            totalWetWeight: 0,
            moistureWeightedSum: 0,
            pbWeightedSum: 0,
            znWeightedSum: 0,
            totalZnMetal: 0,
            totalWeight: 0
          },
          fdx: {
            totalWetWeight: wetWeight,
            moistureWeightedSum: moisture * wetWeight,
            pbWeightedSum: pb * wetWeight,
            znWeightedSum: zn * wetWeight,
            totalZnMetal: znMetal,
            totalWeight: wetWeight
          }
        });
      }
    });

    // 转换为图表数据格式
    const chartData = Array.from(aggregatedData.values()).map(item => {
      const jdxyAvgMoisture = item.jdxy.totalWeight > 0 ? item.jdxy.moistureWeightedSum / item.jdxy.totalWeight : 0;
      const jdxyAvgPb = item.jdxy.totalWeight > 0 ? item.jdxy.pbWeightedSum / item.jdxy.totalWeight : 0;
      const jdxyAvgZn = item.jdxy.totalWeight > 0 ? item.jdxy.znWeightedSum / item.jdxy.totalWeight : 0;

      const fdxAvgMoisture = item.fdx.totalWeight > 0 ? item.fdx.moistureWeightedSum / item.fdx.totalWeight : 0;
      const fdxAvgPb = item.fdx.totalWeight > 0 ? item.fdx.pbWeightedSum / item.fdx.totalWeight : 0;
      const fdxAvgZn = item.fdx.totalWeight > 0 ? item.fdx.znWeightedSum / item.fdx.totalWeight : 0;

      return {
        date: item.date,
        wetWeight: {
          金鼎: item.jdxy.totalWetWeight,
          富鼎翔: item.fdx.totalWetWeight
        },
        moisture: {
          金鼎: jdxyAvgMoisture,
          富鼎翔: fdxAvgMoisture
        },
        pbGrade: {
          金鼎: jdxyAvgPb,
          富鼎翔: fdxAvgPb
        },
        znGrade: {
          金鼎: jdxyAvgZn,
          富鼎翔: fdxAvgZn
        },
        znMetal: {
          金鼎: item.jdxy.totalZnMetal,
          富鼎翔: item.fdx.totalZnMetal
        }
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    return {
      wetWeight: chartData.map(item => ({ date: item.date, 金鼎: item.wetWeight.金鼎, 富鼎翔: item.wetWeight.富鼎翔 })),
      moisture: chartData.map(item => ({ date: item.date, 金鼎: item.moisture.金鼎, 富鼎翔: item.moisture.富鼎翔 })),
      pbGrade: chartData.map(item => ({ date: item.date, 金鼎: item.pbGrade.金鼎, 富鼎翔: item.pbGrade.富鼎翔 })),
      znGrade: chartData.map(item => ({ date: item.date, 金鼎: item.znGrade.金鼎, 富鼎翔: item.znGrade.富鼎翔 })),
      znMetal: chartData.map(item => ({ date: item.date, 金鼎: item.znMetal.金鼎, 富鼎翔: item.znMetal.富鼎翔 }))
    };
  }, [jdxyData, fdxData]);

  // 甜甜圈图表配置
  const donutConfig = {
    value: {
      label: "数值",
    },
  };

  // 甜甜圈图表组件 - 与进厂原矿详情页面完全一致
  const DonutChart = ({ data, standard = "金鼎锌业" }: { data: DonutDataItem; standard?: string }) => {
    const chartData = useMemo(() => {
      const percentage = Math.min((data.value / data.maxValue) * 100, 100);
      return [
        {
          name: "当前值",
          value: percentage,
          actualValue: data.value,
          unit: data.unit,
          fill: data.fill
        },
        {
          name: "剩余",
          value: Math.max(0, 100 - percentage),
          actualValue: data.maxValue - data.value,
          unit: data.unit,
          fill: "var(--muted)"
        }
      ];
    }, [data]);

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
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, props) => {
                      if (props.payload.name === "当前值") {
                        return (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                              style={
                                {
                                  "--color-bg": props.payload.fill,
                                } as React.CSSProperties
                              }
                            />
                            <span className="text-muted-foreground">
                              {props.payload.actualValue?.toFixed(1)}{props.payload.unit}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                }
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={5}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
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
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* 底部当前值显示 */}
          <div className="text-center mt-2">
            <div className="text-xs text-muted-foreground">
              当前值：{data.value.toFixed(1)}{data.unit}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 导出EXCEL功能
  const exportToExcel = () => {
    const currentData = activeTab === 'jdxy' ? processJdxyTableData() : processFdxTableData();
    const companyName = activeTab === 'jdxy' ? '金鼎锌业' : '富鼎翔';

    // 创建CSV内容
    const headers = ['日期', '出厂湿重(t)', '水份(%)', '精矿Pb品位(%)', '精矿Zn品位(%)', 'Zn金属量(t)'];
    const csvContent = [
      headers.join(','),
      ...currentData.map(row => [
        row.日期,
        row['出厂湿重(t)'],
        row['水份(%)'],
        row['精矿Pb品位(%)'],
        row['精矿Zn品位(%)'],
        row['Zn金属量(t)']
      ].join(','))
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `出厂精矿数据_${companyName}_${tableStartDate}_${tableEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 初始化数据加载
  useEffect(() => {
    fetchOutgoingConcentrateData(trendStartDate, trendEndDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header-2组件 */}
      <Header2 title="出厂精矿详情" />

      <div className="container mx-auto p-4 space-y-6">
        {/* PART1: 出厂趋势总览 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>出厂趋势总览</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshTrendData}
                disabled={isLoading}
                className="h-8 w-8"
                title="刷新趋势数据"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription>查看出厂精矿数据的时间趋势和对比分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {/* 趋势图表轮播 */}
            <Carousel className="w-full">
              <CarouselContent>
                {/* 出厂湿重趋势图 */}
                <CarouselItem>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">出厂湿重趋势</CardTitle>
                      <CardDescription>单位：吨(t)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={processTrendData().wetWeight}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="金鼎"
                              stroke="var(--chart-1)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-1)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="富鼎翔"
                              stroke="var(--chart-2)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-2)" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* 水份趋势图 */}
                <CarouselItem>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">水份趋势</CardTitle>
                      <CardDescription>单位：百分比(%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={processTrendData().moisture}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="金鼎"
                              stroke="var(--chart-1)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-1)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="富鼎翔"
                              stroke="var(--chart-2)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-2)" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* 精矿Pb品位趋势图 */}
                <CarouselItem>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">精矿Pb品位趋势</CardTitle>
                      <CardDescription>单位：百分比(%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={processTrendData().pbGrade}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="金鼎"
                              stroke="var(--chart-1)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-1)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="富鼎翔"
                              stroke="var(--chart-2)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-2)" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* 精矿Zn品位趋势图 */}
                <CarouselItem>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">精矿Zn品位趋势</CardTitle>
                      <CardDescription>单位：百分比(%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={processTrendData().znGrade}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="金鼎"
                              stroke="var(--chart-1)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-1)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="富鼎翔"
                              stroke="var(--chart-2)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-2)" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Zn金属量趋势图 */}
                <CarouselItem>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Zn金属量趋势</CardTitle>
                      <CardDescription>单位：吨(t)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={processTrendData().znMetal}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="金鼎"
                              stroke="var(--chart-1)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-1)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="富鼎翔"
                              stroke="var(--chart-2)"
                              strokeWidth={2}
                              dot={{ fill: "var(--chart-2)" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        {/* PART2: 出厂单日详情 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle>出厂单日详情</CardTitle>
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
            <CardDescription>查看指定日期的出厂精矿详细数据</CardDescription>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {processSingleDayJdxyData().map((item, index) => (
                    <DonutChart key={`jdxy-${index}`} data={item} standard="金鼎锌业" />
                  ))}
                </div>
              </TabsContent>

              {/* 富鼎翔数据选项卡 */}
              <TabsContent value="fdx" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {processSingleDayFdxData().map((item, index) => (
                    <DonutChart key={`fdx-${index}`} data={item} standard="富鼎翔" />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* PART3: 出厂数据汇总 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-primary" />
                <CardTitle>出厂数据汇总</CardTitle>
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
            <CardDescription>查看指定时间范围内的出厂精矿汇总数据</CardDescription>
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

            {/* 数据表格选项卡 */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jdxy">金鼎数据</TabsTrigger>
                <TabsTrigger value="fdx">富鼎翔数据</TabsTrigger>
              </TabsList>

              {/* 金鼎数据表格 */}
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
                        <TableHead>出厂湿重(t)</TableHead>
                        <TableHead>水份(%)</TableHead>
                        <TableHead>精矿Pb品位(%)</TableHead>
                        <TableHead>精矿Zn品位(%)</TableHead>
                        <TableHead>Zn金属量(t)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processJdxyTableData()
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.日期}</TableCell>
                          <TableCell>{row['出厂湿重(t)']}</TableCell>
                          <TableCell>{row['水份(%)']}</TableCell>
                          <TableCell>{row['精矿Pb品位(%)']}</TableCell>
                          <TableCell>{row['精矿Zn品位(%)']}</TableCell>
                          <TableCell>{row['Zn金属量(t)']}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控制 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    共 {processJdxyTableData().length} 条记录
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {currentPage} 页，共 {Math.ceil(processJdxyTableData().length / itemsPerPage)} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(Math.ceil(processJdxyTableData().length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(processJdxyTableData().length / itemsPerPage)}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 富鼎翔数据表格 */}
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
                        <TableHead>出厂湿重(t)</TableHead>
                        <TableHead>水份(%)</TableHead>
                        <TableHead>精矿Pb品位(%)</TableHead>
                        <TableHead>精矿Zn品位(%)</TableHead>
                        <TableHead>Zn金属量(t)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processFdxTableData()
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.日期}</TableCell>
                          <TableCell>{row['出厂湿重(t)']}</TableCell>
                          <TableCell>{row['水份(%)']}</TableCell>
                          <TableCell>{row['精矿Pb品位(%)']}</TableCell>
                          <TableCell>{row['精矿Zn品位(%)']}</TableCell>
                          <TableCell>{row['Zn金属量(t)']}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控制 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    共 {processFdxTableData().length} 条记录
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {currentPage} 页，共 {Math.ceil(processFdxTableData().length / itemsPerPage)} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(Math.ceil(processFdxTableData().length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(processFdxTableData().length / itemsPerPage)}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* 导出按钮 */}
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={exportToExcel}>
                <Download className="h-4 w-4" />
                导出EXCEL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
