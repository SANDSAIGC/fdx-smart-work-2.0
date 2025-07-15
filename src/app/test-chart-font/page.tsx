"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarNegative } from '@/components/charts/ChartBarNegative';

export default function TestChartFontPage() {
  // 测试数据
  const testData = [
    { parameter: "回收率差值", value: 2.5, unit: "%" },
    { parameter: "品位差值", value: -1.8, unit: "%" },
    { parameter: "处理量差值", value: 150.5, unit: "t" },
    { parameter: "产出量差值", value: -75.2, unit: "t" },
    { parameter: "水份差值", value: 0.8, unit: "%" },
  ];

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>柱形图字号测试页面</CardTitle>
          <p className="text-sm text-muted-foreground">
            测试数据对比分析图表中柱形图上方数字的字号效果（已增加1.5倍）
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">字号对比说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">更新前</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• CSS: font-size: 11px</li>
                    <li>• ChartBarNegative: fontSize={`{compact ? 8 : 10}`}</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">修正后</h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>• 生产累计数据大盘: .bar-label-text (11px) - 保持原始大小</li>
                    <li>• 数据对比分析: .comparison-bar-label-text (17px) - 增大1.5倍</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">实际效果展示</h3>
              <ChartBarNegative
                data={testData}
                title="数据对比分析 - 字号测试"
                description="柱形图上方数字字号已增加至1.5倍"
                footerText="正值表示第一单位数据较高，负值表示第二单位数据较高"
                trendText="字号优化后的显示效果"
                height={300}
              />
            </div>

            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">精确更新范围</h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• <strong>✅ 仅数据对比分析-富金和富科</strong>：ChartBarNegative组件使用 .comparison-bar-label-text (17px)</li>
                <li>• <strong>✅ 生产累计数据大盘保持原样</strong>：ProductionDataChart组件使用 .bar-label-text (11px)</li>
                <li>• <strong>✅ 其他图表保持原样</strong>：UniversalProductionChart等组件使用 .bar-label-text (11px)</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">精确技术实现</h4>
              <div className="text-sm text-gray-800 dark:text-gray-200 space-y-2">
                <p><strong>1. 创建专用CSS类</strong>：</p>
                <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                  .bar-label-text {`{ font-size: 11px; }`} /* 生产累计数据大盘 - 保持原样 */
                  <br />
                  .comparison-bar-label-text {`{ font-size: 17px; }`} /* 数据对比分析 - 增大1.5倍 */
                </code>

                <p className="mt-3"><strong>2. ChartBarNegative组件更新</strong>：</p>
                <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                  // 使用自定义标签组件和专用CSS类
                  <br />
                  className="comparison-bar-label-text"
                </code>

                <p className="mt-3"><strong>3. 其他组件保持不变</strong>：</p>
                <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                  // ProductionDataChart等继续使用原始CSS类
                  <br />
                  className="bar-label-text"
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
