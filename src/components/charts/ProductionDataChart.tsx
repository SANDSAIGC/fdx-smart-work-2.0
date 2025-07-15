"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { TrendingUp, Factory, Package } from 'lucide-react';
import { formatWeight } from '@/lib/formatters';

// 数据类型定义
interface ProductionDataItem {
  parameter: string;
  company: string;
  value: number;
  fill: string;
}

interface ProductionDataChartProps {
  data: ProductionDataItem[];
  title: string;
  type: "原料" | "产品";
  selectedCycle: string;
  getCurrentCycleDateRange: () => string;
}

// 图表配置
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

export default function ProductionDataChart({
  data,
  title,
  type,
  selectedCycle,
  getCurrentCycleDateRange
}: ProductionDataChartProps) {
  // 转换数据格式 - 移除压缩机制，显示真实数据
  const chartData = React.useMemo(() => {
    const result: Array<{
      parameter: string;
      富鼎翔: number;
      金鼎锌业: number;
      originalData: { 富鼎翔: number; 金鼎锌业: number }
    }> = [];
    const grouped: { [key: string]: { 富鼎翔?: number; 金鼎锌业?: number } } = {};

    data.forEach(item => {
      if (!grouped[item.parameter]) {
        grouped[item.parameter] = {};
      }
      grouped[item.parameter][item.company as '富鼎翔' | '金鼎锌业'] = item.value;
    });

    Object.entries(grouped).forEach(([parameter, values]) => {
      const fdxValue = values.富鼎翔 || 0;
      const jdxyValue = values.金鼎锌业 || 0;

      result.push({
        parameter,
        富鼎翔: fdxValue,
        金鼎锌业: jdxyValue,
        originalData: {
          富鼎翔: fdxValue,
          金鼎锌业: jdxyValue
        }
      });
    });

    return result;
  }, [data]);

  // 暗色模式检测
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  React.useEffect(() => {
    // 检测当前主题
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkTheme();
    
    // 监听主题变化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // 自定义数值标签组件 - 支持暗色模式和原始数据显示
  const CustomLabel = (props: any) => {
    const { x, y, width, height, value, dataKey, payload } = props;
    
    // 获取原始数据值
    const originalValue = payload?.originalData?.[dataKey] || value;
    
    // 根据柱状图宽度动态调整标签位置
    const labelX = width > 60 ? x + width - 10 : x + width + 5; // 宽度足够时内部显示，否则外部显示
    const labelY = y + height / 2; // 垂直居中
    
    // 配色适配：按照参考图示例进行文字颜色设置
    const textColor = width > 60 
      ? (isDarkMode ? "white" : "white") // 柱体内部：暗色模式白色文字，亮色模式白色文字
      : "hsl(var(--foreground))";
    const textAnchor = width > 60 ? "end" : "start"; // 根据位置调整对齐方式
    
    return (
      <text
        x={labelX}
        y={labelY}
        fill={textColor}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        className="bar-label-text"
      >
        {formatWeight(originalValue, 't')}
      </text>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 chart-title-mobile">
          {type === "原料" ? <Factory className="h-5 w-5 sm:h-6 sm:w-6" /> : <Package className="h-5 w-5 sm:h-6 sm:w-6" />}
          {title}
        </CardTitle>
        <CardDescription className="chart-description-mobile">
          {selectedCycle} ({getCurrentCycleDateRange()}) - {type}累计数据对比
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-6 pr-4 py-0 w-full space-y-4">
        {/* 为每个参数添加上方标签 */}
        {chartData.map((item, index) => (
          <div key={item.parameter} className="space-y-2">
            {/* 参数标签 - 上方左侧显示 */}
            <div className="text-sm font-normal text-foreground">
              {item.parameter}
            </div>
            {/* 单行柱状图 */}
            <div className="h-12 pr-2">
              <ChartContainer
                config={chartConfig}
                className="w-full h-full mobile-optimized-chart"
              >
                <BarChart
                  accessibilityLayer
                  data={[item]}
                  layout="vertical"
                  width="100%"
                  height="100%"
                  margin={{
                    right: 120, // 预留足够的右侧空间（约25%）
                    left: 0,
                    top: 2,
                    bottom: 2,
                  }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="parameter"
                    type="category"
                    hide
                  />
                  <XAxis type="number" hide />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="富鼎翔"
                    layout="vertical"
                    radius={4}
                    maxBarSize={16}
                    className="bar-fdx"
                  >
                    <LabelList
                      content={CustomLabel}
                    />
                  </Bar>
                  <Bar
                    dataKey="金鼎锌业"
                    layout="vertical"
                    radius={4}
                    maxBarSize={16}
                    className="bar-jdxy"
                  >
                    <LabelList
                      content={CustomLabel}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 pt-6">
        <div className="flex gap-2 leading-none font-semibold text-base sm:text-lg">
          生产累计数据对比 <TrendingUp className="h-5 w-5" />
        </div>
        <div className="text-muted-foreground leading-relaxed text-sm sm:text-base">
          显示富鼎翔与金鼎锌业{type}累计数据对比情况
        </div>
      </CardFooter>
    </Card>
  );
}
