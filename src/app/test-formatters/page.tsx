"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatValue, formatWeight, formatPercentage, isWeightUnit, isPercentageUnit } from '@/lib/formatters';

export default function TestFormattersPage() {
  // 测试数据
  const testData = [
    { label: "原矿干重处理量", value: 12345.6789, unit: "t", expected: "重量类 - 3位小数" },
    { label: "Zn精矿平均品位", value: 52.8456, unit: "%", expected: "百分比类 - 2位小数" },
    { label: "金属产出量", value: 6640.123456, unit: "t", expected: "重量类 - 3位小数" },
    { label: "回收率", value: 89.2567, unit: "%", expected: "百分比类 - 2位小数" },
    { label: "水份含量", value: 15.789, unit: "%", expected: "百分比类 - 2位小数" },
    { label: "库存重量", value: 1234.56789, unit: "kg", expected: "重量类 - 3位小数" },
    { label: "品位测试", value: 45.6789, unit: "%", expected: "百分比类 - 2位小数" },
    { label: "无单位数值", value: 123.456789, unit: "", expected: "默认 - 2位小数" },
    { label: "空值测试", value: null, unit: "t", expected: "显示 --" },
    { label: "零值测试", value: 0, unit: "%", expected: "0.00%" },
  ];

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>数值格式化测试页面</CardTitle>
          <p className="text-sm text-muted-foreground">
            测试重量类数值（保留3位小数）和百分比类数值（保留2位小数）的格式化效果
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>指标名称</TableHead>
                <TableHead>原始数值</TableHead>
                <TableHead>单位</TableHead>
                <TableHead>格式化结果</TableHead>
                <TableHead>预期效果</TableHead>
                <TableHead>单位类型检测</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell>{item.value?.toString() || 'null'}</TableCell>
                  <TableCell>{item.unit || '无'}</TableCell>
                  <TableCell className="font-mono bg-muted px-2 py-1 rounded">
                    {formatValue(item.value, item.unit)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.expected}
                  </TableCell>
                  <TableCell className="text-xs">
                    {isWeightUnit(item.unit) && <span className="bg-blue-100 text-blue-800 px-1 rounded">重量</span>}
                    {isPercentageUnit(item.unit) && <span className="bg-green-100 text-green-800 px-1 rounded">百分比</span>}
                    {!isWeightUnit(item.unit) && !isPercentageUnit(item.unit) && item.unit && 
                      <span className="bg-gray-100 text-gray-800 px-1 rounded">其他</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">专用格式化函数测试</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">formatWeight() 函数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>formatWeight(1234.56789, 't') = <span className="font-mono bg-muted px-1 rounded">{formatWeight(1234.56789, 't')}</span></div>
                  <div>formatWeight(567.891234, 'kg') = <span className="font-mono bg-muted px-1 rounded">{formatWeight(567.891234, 'kg')}</span></div>
                  <div>formatWeight(0.123456) = <span className="font-mono bg-muted px-1 rounded">{formatWeight(0.123456)}</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">formatPercentage() 函数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>formatPercentage(89.2567) = <span className="font-mono bg-muted px-1 rounded">{formatPercentage(89.2567)}</span></div>
                  <div>formatPercentage(15.789, '%') = <span className="font-mono bg-muted px-1 rounded">{formatPercentage(15.789, '%')}</span></div>
                  <div>formatPercentage(0.456789) = <span className="font-mono bg-muted px-1 rounded">{formatPercentage(0.456789)}</span></div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">格式化规则说明</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>重量相关数值</strong>：单位为 t, kg, g, ton, 吨, 千克, 克 时，保留小数点后 <strong>3位</strong></li>
                <li>• <strong>百分比相关数值</strong>：单位为 %, percent, 百分比 时，保留小数点后 <strong>2位</strong></li>
                <li>• <strong>其他数值</strong>：默认保留小数点后 <strong>2位</strong></li>
                <li>• <strong>空值处理</strong>：null、undefined、空字符串显示为 <strong>--</strong></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
