"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatValue } from "@/lib/formatters"

interface ChartBarNegativeProps {
  data: Array<{
    parameter: string;
    value: number;
    unit?: string;
  }>;
  title: string;
  description?: string;
  footerText?: string;
  trendText?: string;
  trendUp?: boolean;
  className?: string;
  height?: number; // 自定义高度
  compact?: boolean; // 紧凑模式
}

const chartConfig = {
  value: {
    label: "数值",
  },
} satisfies ChartConfig

export function ChartBarNegative({
  data,
  title,
  description,
  footerText,
  trendText,
  trendUp = true,
  className = "",
  height = 300, // 默认高度减小
  compact = false
}: ChartBarNegativeProps) {

  // 自定义标签组件 - 使用数据对比分析专用的CSS类
  const CustomComparisonLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;

    if (compact && Math.abs(value) < 0.01) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        textAnchor="middle"
        dominantBaseline="bottom"
        className="comparison-bar-label-text" // 使用数据对比分析专用的CSS类
      >
        {formatValue(value, payload?.unit)}
      </text>
    );
  };

  return (
    <Card className={`bar-chart-negative-responsive ${className} ${compact ? 'p-2' : ''}`}>
      <CardHeader className={`card-header ${compact ? 'pb-2' : ''}`}>
        <CardTitle className={`card-title ${compact ? 'text-sm' : ''}`}>{title}</CardTitle>
        {description && <CardDescription className={`card-description ${compact ? 'text-xs' : ''}`}>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={`card-content ${compact ? 'p-2 pt-0' : ''}`}>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: compact ? 10 : 20,
              right: compact ? 15 : 30,
              left: compact ? 10 : 20,
              bottom: compact ? 40 : 60,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="parameter"
              tickLine={false}
              axisLine={false}
              tickMargin={compact ? 4 : 8}
              angle={compact ? -45 : -30}
              textAnchor="end"
              height={compact ? 40 : 60}
              interval={0}
              tick={{ fontSize: compact ? 9 : 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={compact ? 4 : 8}
              tick={{ fontSize: compact ? 9 : 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                hideLabel 
                hideIndicator 
                formatter={(value, name, props) => [
                  formatValue(value, props.payload?.unit),
                  props.payload?.parameter
                ]}
              />}
            />
            <Bar dataKey="value">
              <LabelList
                content={CustomComparisonLabel}
              />
              {data.map((item, index) => (
                <Cell
                  key={`${item.parameter}-${index}`}
                  fill={item.value >= 0 ? "var(--bar-negative-positive)" : "var(--bar-negative-negative)"}
                  className={item.value >= 0 ? "bar-chart-negative-positive" : "bar-chart-negative-negative"}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      {(footerText || trendText) && (
        <CardFooter className={`card-footer flex-col items-start gap-2 ${compact ? 'text-xs p-2 pt-0' : 'text-sm'}`}>
          {trendText && (
            <div className="flex gap-2 leading-none font-medium">
              {trendText}
              {trendUp ? (
                <TrendingUp className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-green-500`} />
              ) : (
                <TrendingDown className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-red-500`} />
              )}
            </div>
          )}
          {footerText && (
            <div className="text-muted-foreground leading-none">
              {footerText}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
