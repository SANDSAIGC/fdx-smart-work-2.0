"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatWeight } from '@/lib/formatters';

export default function TestRawMaterialPage() {
  const [productionCycles, setProductionCycles] = useState<string[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('全部周期');
  const [rawMaterialData, setRawMaterialData] = useState<any>(null);
  const [isLoadingCycles, setIsLoadingCycles] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string>('');

  // 获取生产周期列表
  const fetchProductionCycles = async () => {
    setIsLoadingCycles(true);
    setError('');
    try {
      const response = await fetch('/api/boss/production-cycles');
      const result = await response.json();
      
      if (result.success) {
        setProductionCycles(result.data);
        if (!result.data.includes(selectedCycle)) {
          setSelectedCycle(result.data[0] || '全部周期');
        }
      } else {
        setError(`获取生产周期失败: ${result.message}`);
      }
    } catch (error) {
      setError(`获取生产周期失败: ${error}`);
    } finally {
      setIsLoadingCycles(false);
    }
  };

  // 获取原料累计数据
  const fetchRawMaterialData = async (cycle: string) => {
    setIsLoadingData(true);
    setError('');
    try {
      const response = await fetch('/api/boss/raw-material-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cycle }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRawMaterialData(result.data);
      } else {
        setError(`获取原料累计数据失败: ${result.message}`);
        setRawMaterialData(null);
      }
    } catch (error) {
      setError(`获取原料累计数据失败: ${error}`);
      setRawMaterialData(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchProductionCycles();
  }, []);

  useEffect(() => {
    if (productionCycles.length > 0 && selectedCycle) {
      fetchRawMaterialData(selectedCycle);
    }
  }, [selectedCycle, productionCycles.length]);

  // 核心字段列表
  const coreFields = [
    '期初库存', '周期倒入量', '周期消耗量', 
    '期末有效库存', '矿仓底部库存', '期末总库存'
  ];

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            原料累计数据测试页面
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchProductionCycles();
                if (selectedCycle) fetchRawMaterialData(selectedCycle);
              }}
              disabled={isLoadingCycles || isLoadingData}
            >
              <RefreshCw className={`h-4 w-4 ${(isLoadingCycles || isLoadingData) ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            测试生产周期动态获取、智能字段映射和"全部周期"聚合功能
          </p>
        </CardHeader>
        <CardContent>
          {/* 生产周期选择器 */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedCycle} onValueChange={setSelectedCycle} disabled={isLoadingCycles}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder={isLoadingCycles ? "加载中..." : "选择生产周期"} />
              </SelectTrigger>
              <SelectContent>
                {productionCycles.map((cycle) => (
                  <SelectItem key={cycle} value={cycle}>
                    {cycle === '全部周期' ? '全部周期 (聚合数据)' : `生产周期: ${cycle}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              {isLoadingCycles && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  加载周期中
                </Badge>
              )}
              {isLoadingData && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  加载数据中
                </Badge>
              )}
              {!isLoadingCycles && !isLoadingData && rawMaterialData && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  数据已加载
                </Badge>
              )}
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <XCircle className="h-4 w-4" />
                <span className="font-semibold">错误</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}

          {/* 数据显示 */}
          {rawMaterialData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 富鼎翔数据 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">富鼎翔 (FDX)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rawMaterialData.fdx ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>字段</TableHead>
                            <TableHead>数值</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coreFields.map((field) => (
                            <TableRow key={field}>
                              <TableCell className="font-medium">{field}</TableCell>
                              <TableCell className="font-mono">
                                {formatWeight(rawMaterialData.fdx[field], 't')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground">暂无数据</p>
                    )}
                  </CardContent>
                </Card>

                {/* 金鼎锌业数据 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">金鼎锌业 (JDXY)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rawMaterialData.jdxy ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>字段</TableHead>
                            <TableHead>数值</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coreFields.map((field) => (
                            <TableRow key={field}>
                              <TableCell className="font-medium">{field}</TableCell>
                              <TableCell className="font-mono">
                                {formatWeight(rawMaterialData.jdxy[field], 't')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground">暂无数据</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 功能说明 */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">功能特性</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• <strong>动态生产周期</strong>：从 `生产计划-JDXY` 表自动获取周期列表</li>
                  <li>• <strong>智能字段映射</strong>：自动识别和映射6个核心字段</li>
                  <li>• <strong>全部周期聚合</strong>：选择"全部周期"时自动计算所有周期的累加值</li>
                  <li>• <strong>数据格式化</strong>：重量类数值保留3位小数</li>
                  <li>• <strong>错误处理</strong>：完善的超时和错误处理机制</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
