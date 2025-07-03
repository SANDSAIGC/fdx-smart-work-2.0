"use client";

import React, { useState, useCallback, useEffect } from "react";
import { format } from 'date-fns';
import {
  BarChart3, RefreshCw, Calendar as CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

// 数据对比分析组件接口
interface DataVs1Props {
  title?: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  badgeClassName?: string;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  comparisonData?: {
    incoming: any[];
    outgoing: any[];
    production: any[];
  };
  chartData?: {
    incoming: { gradeAndMoisture: any[] };
    production: { originalOre: any[] };
    outgoing: { gradeAndMoisture: any[]; weightAndMetal: any[] };
  };
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
    label: "金鼎水份",
    color: "var(--chart-3)",
  },
  fudingxiang_moisture: {
    label: "富鼎翔水份",
    color: "var(--chart-4)",
  },
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
  jinding_weight: {
    label: "金鼎重量",
    color: "var(--chart-1)",
  },
  fudingxiang_weight: {
    label: "富鼎翔重量",
    color: "var(--chart-2)",
  },
  internal_grade: {
    label: "内部取样品位",
    color: "var(--chart-5)",
  },
  internal_moisture: {
    label: "内部取样水份",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

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
              tickFormatter={(value) => format(new Date(value), 'MM-dd')}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
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
            <Legend />
          </LineChart>
        </ChartContainer>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <span>{trendText}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DataVs1({
  title = "数据对比分析",
  description = "金鼎 VS 富鼎翔各环节数据对比",
  badgeText,
  badgeVariant = "default",
  badgeClassName = "",
  onRefresh,
  isRefreshing = false,
  comparisonData = { incoming: [], outgoing: [], production: [] },
  chartData = {
    incoming: { gradeAndMoisture: [] },
    production: { originalOre: [] },
    outgoing: { gradeAndMoisture: [], weightAndMetal: [] }
  }
}: DataVs1Props) {
  // 日期状态管理
  const [comparisonStartDate, setComparisonStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 默认最近一周
    return date;
  });
  const [comparisonEndDate, setComparisonEndDate] = useState<Date | undefined>(() => new Date());

  // 快速日期选择功能
  const setComparisonQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setComparisonStartDate(start);
    setComparisonEndDate(end);
  }, []);

  // 生成趋势文本
  const generateSingleTrendText = useCallback((data: any[], jindingKey: string, fudingxiangKey: string, isPercentage: boolean = false) => {
    if (!data || data.length === 0) return '暂无数据';
    
    let jindingTotal = 0;
    let fudingxiangTotal = 0;
    let validCount = 0;

    data.forEach(item => {
      const jindingValue = parseFloat(item[jindingKey]);
      const fudingxiangValue = parseFloat(item[fudingxiangKey]);
      
      if (!isNaN(jindingValue) && !isNaN(fudingxiangValue)) {
        jindingTotal += jindingValue;
        fudingxiangTotal += fudingxiangValue;
        validCount++;
      }
    });

    if (validCount === 0) return '暂无有效数据';

    let difference: number;
    if (isPercentage) {
      const jindingAvg = jindingTotal / validCount;
      const fudingxiangAvg = fudingxiangTotal / validCount;
      difference = Math.abs(jindingAvg - fudingxiangAvg);
    } else {
      difference = Math.abs(jindingTotal - fudingxiangTotal);
    }

    return `${isPercentage ? '平均差值' : '累计差值'} ${difference.toFixed(isPercentage ? 2 : 1)}${isPercentage ? '%' : 't'}`;
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
            {badgeText && (
              <Badge variant={badgeVariant} className={badgeClassName}>
                {badgeText}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 数据对比分析专用日期范围选择器 */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
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
              <h3 className="text-sm font-medium">进厂原矿数据趋势对比</h3>
              <Carousel className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <ComparisonChart
                      data={chartData.incoming.gradeAndMoisture}
                      title="品位对比"
                      description="金鼎 VS 富鼎翔进厂原矿品位对比"
                      lines={[
                        { dataKey: "jinding_grade" },
                        { dataKey: "fudingxiang_grade" },
                      ]}
                      trendText={generateSingleTrendText(chartData.incoming.gradeAndMoisture, "jinding_grade", "fudingxiang_grade", true)}
                    />
                  </CarouselItem>
                  <CarouselItem>
                    <ComparisonChart
                      data={chartData.incoming.gradeAndMoisture}
                      title="水份对比"
                      description="金鼎 VS 富鼎翔进厂原矿水份对比"
                      lines={[
                        { dataKey: "jinding_moisture" },
                        { dataKey: "fudingxiang_moisture" },
                      ]}
                      trendText={generateSingleTrendText(chartData.incoming.gradeAndMoisture, "jinding_moisture", "fudingxiang_moisture", true)}
                    />
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>

              {/* 进厂数据表格 */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">进厂原矿差值数据</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">日期</TableHead>
                        <TableHead className="text-center">品位差值(%)</TableHead>
                        <TableHead className="text-center">水分差值(%)</TableHead>
                        <TableHead className="text-center">重量差值(t)</TableHead>
                        <TableHead className="text-center">金属量差值(t)</TableHead>
                        <TableHead className="text-center">发货单位</TableHead>
                        <TableHead className="text-center">收货单位</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.incoming && comparisonData.incoming.length > 0 ? (
                        comparisonData.incoming.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center font-medium">
                              {item.计量日期 || '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.品位差值 !== undefined ? `${item.品位差值}%` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.水分差值 !== undefined ? `${item.水分差值}%` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.重量差值 !== undefined ? `${item.重量差值}t` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.金属量差值 !== undefined ? `${item.金属量差值}t` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.发货单位 || '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.收货单位 || '--'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                            暂无进厂原矿对比数据
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="production" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">生产班样数据趋势对比</h3>
              <Carousel className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <ComparisonChart
                      data={chartData.production.originalOre}
                      title="原矿水份%对比"
                      description="金鼎白班/夜班 VS 富鼎翔白班/夜班原矿水份对比"
                      lines={[
                        { dataKey: "jinding_day_moisture" },
                        { dataKey: "jinding_night_moisture" },
                        { dataKey: "fudingxiang_day_moisture" },
                        { dataKey: "fudingxiang_night_moisture" },
                      ]}
                      trendText={generateSingleTrendText(chartData.production.originalOre, "jinding_day_moisture", "fudingxiang_day_moisture", true)}
                    />
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>

              {/* 生产数据表格 */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">生产班样差值数据</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">日期</TableHead>
                        <TableHead className="text-center">班次</TableHead>
                        <TableHead className="text-center">原矿水分差值(%)</TableHead>
                        <TableHead className="text-center">原矿Zn品位差值(%)</TableHead>
                        <TableHead className="text-center">精矿Zn品位差值(%)</TableHead>
                        <TableHead className="text-center">Zn回收率差值(%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.production && comparisonData.production.length > 0 ? (
                        comparisonData.production.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center font-medium">
                              {item.日期 || '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.班次 || '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.原矿水分差值 !== undefined ? `${item.原矿水分差值}%` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.原矿Zn品位差值 !== undefined ? `${item.原矿Zn品位差值}%` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.精矿Zn品位差值 !== undefined ? `${item.精矿Zn品位差值}%` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.Zn回收率差值 !== undefined ? `${item.Zn回收率差值}%` : '--'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                            暂无生产班样对比数据
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>

              {/* 出厂数据表格 */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">出厂精矿差值数据</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">日期</TableHead>
                        <TableHead className="text-center">品位差值(%)</TableHead>
                        <TableHead className="text-center">水分差值(%)</TableHead>
                        <TableHead className="text-center">重量差值(t)</TableHead>
                        <TableHead className="text-center">金属量差值(t)</TableHead>
                        <TableHead className="text-center">发货单位</TableHead>
                        <TableHead className="text-center">收货单位</TableHead>
                        <TableHead className="text-center">流向</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.outgoing && comparisonData.outgoing.length > 0 ? (
                        comparisonData.outgoing.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center font-medium">
                              {item.计量日期 || '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.品位差值 !== undefined ? `${item.品位差值}%` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.水分差值 !== undefined ? `${item.水分差值}%` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.重量差值 !== undefined ? `${item.重量差值}t` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.金属量差值 !== undefined ? `${item.金属量差值}t` : '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.发货单位 || '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.收货单位 || '--'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.流向 || '--'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                            暂无出厂精矿对比数据
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
