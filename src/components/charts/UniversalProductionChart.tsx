"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { TrendingUp, Factory, Package, BarChart3 } from 'lucide-react';

// 数据类型定义
interface UniversalDataItem {
  parameter: string;
  company: string;
  value: number;
  fill?: string;
}

interface CompanyConfig {
  name: string;
  color: string;
  className?: string;
}

interface UniversalProductionChartProps {
  data: UniversalDataItem[];
  title: string;
  description?: string;
  type?: "原料" | "产品" | "生产" | "其他";
  companies: CompanyConfig[];
  selectedPeriod?: string;
  periodDateRange?: string;
  unit?: string;
  showFooter?: boolean;
  footerText?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function UniversalProductionChart({
  data,
  title,
  description,
  type = "生产",
  companies,
  selectedPeriod = "",
  periodDateRange = "",
  unit = "t",
  showFooter = true,
  footerText,
  icon,
  className = ""
}: UniversalProductionChartProps) {
  
  // 动态生成图表配置
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "数值",
      },
    };
    
    companies.forEach((company, index) => {
      config[company.name] = {
        label: company.name,
        color: company.color,
      };
    });
    
    return config;
  }, [companies]);

  // 转换数据格式 - 移除压缩机制，显示真实数据
  const chartData = React.useMemo(() => {
    const result: Array<{
      parameter: string;
      [key: string]: any;
      originalData: { [key: string]: number }
    }> = [];
    const grouped: { [key: string]: { [company: string]: number } } = {};

    data.forEach(item => {
      if (!grouped[item.parameter]) {
        grouped[item.parameter] = {};
      }
      grouped[item.parameter][item.company] = item.value;
    });

    Object.entries(grouped).forEach(([parameter, values]) => {
      const item: any = { parameter, originalData: {} };

      companies.forEach(company => {
        const originalValue = values[company.name] || 0;
        item[company.name] = originalValue;
        item.originalData[company.name] = originalValue;
      });

      result.push(item);
    });

    return result;
  }, [data, companies]);

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

  // 自定义数值标签组件
  const CustomLabel = (props: any) => {
    const { x, y, width, height, value, dataKey, payload } = props;
    
    // 获取原始数据值
    const originalValue = payload?.originalData?.[dataKey] || value;
    
    // 根据柱状图宽度动态调整标签位置
    const labelX = width > 60 ? x + width - 10 : x + width + 5;
    const labelY = y + height / 2;
    
    // 配色适配
    const textColor = width > 60 
      ? "white" // 柱体内部使用白色文字
      : "hsl(var(--foreground))";
    const textAnchor = width > 60 ? "end" : "start";
    
    return (
      <text
        x={labelX}
        y={labelY}
        fill={textColor}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        className="bar-label-text"
      >
        {`${originalValue}${unit}`}
      </text>
    );
  };

  // 默认图标
  const defaultIcon = type === "原料" ? <Factory className="h-5 w-5 sm:h-6 sm:w-6" /> :
                     type === "产品" ? <Package className="h-5 w-5 sm:h-6 sm:w-6" /> :
                     <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 chart-title-mobile">
          {icon || defaultIcon}
          {title}
        </CardTitle>
        {(description || selectedPeriod) && (
          <CardDescription className="chart-description-mobile">
            {description || `${selectedPeriod} ${periodDateRange ? `(${periodDateRange})` : ''} - ${type}累计数据对比`}
          </CardDescription>
        )}
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
                  <XAxis dataKey={companies[0]?.name} type="number" hide />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  {companies.map((company, index) => (
                    <Bar
                      key={company.name}
                      dataKey={company.name}
                      layout="vertical"
                      radius={4}
                      maxBarSize={16}
                      className={company.className || (index === 0 ? "bar-fdx" : "bar-jdxy")}
                    >
                      <LabelList
                        content={CustomLabel}
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        ))}
      </CardContent>
      {showFooter && (
        <CardFooter className="flex-col items-start gap-3 pt-6">
          <div className="flex gap-2 leading-none font-semibold text-base sm:text-lg">
            {footerText || `${type}累计数据对比`} <TrendingUp className="h-5 w-5" />
          </div>
          <div className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            显示{companies.map(c => c.name).join('与')}{type}累计数据对比情况
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
