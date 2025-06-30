"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SampleDataService } from "@/lib/supabase";

export default function TestSamplesPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testShiftSample = async () => {
    addResult("🧪 开始测试班样数据提交...");
    try {
      const result = await SampleDataService.submitShiftSample({
        日期: '2025-06-30',
        班次: '白班',
        '氧化锌原矿-水份（%）': 12.5,
        '氧化锌原矿-Pb全品位（%）': 8.2,
        '氧化锌原矿-Zn全品位（%）': 15.6,
        '氧化锌精矿-Pb品位（%）': 45.8,
        '氧化锌精矿-Zn品位（%）': 52.3,
        '尾矿-Pb全品位（%）': 1.2,
        '尾矿-Zn全品位（%）': 2.8
      });
      
      if (result.success) {
        addResult(`✅ 班样数据提交成功: ${result.message}`);
      } else {
        addResult(`❌ 班样数据提交失败: ${result.message}`);
      }
    } catch (error) {
      addResult(`💥 班样数据提交异常: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testFilterSample = async () => {
    addResult("🧪 开始测试压滤样数据提交...");
    try {
      const result = await SampleDataService.submitFilterSample({
        操作员: '测试用户',
        开始时间: '2025-06-30T08:00:00',
        结束时间: '2025-06-30T16:00:00',
        水份: 10.5,
        铅品位: 42.3,
        锌品位: 48.7,
        备注: '测试数据'
      });
      
      if (result.success) {
        addResult(`✅ 压滤样数据提交成功: ${result.message}`);
      } else {
        addResult(`❌ 压滤样数据提交失败: ${result.message}`);
      }
    } catch (error) {
      addResult(`💥 压滤样数据提交异常: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testIncomingSample = async () => {
    addResult("🧪 开始测试进厂样数据提交...");
    try {
      const result = await SampleDataService.submitIncomingSample({
        计量日期: '2025-06-30',
        发货单位名称: '金鼎锌业',
        原矿类型: '氧化锌矿',
        '水份(%)': 11.2,
        Pb: 7.8,
        Zn: 14.5
      });
      
      if (result.success) {
        addResult(`✅ 进厂样数据提交成功: ${result.message}`);
      } else {
        addResult(`❌ 进厂样数据提交失败: ${result.message}`);
      }
    } catch (error) {
      addResult(`💥 进厂样数据提交异常: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testOutgoingSample = async () => {
    addResult("🧪 开始测试出厂样数据提交...");
    try {
      const result = await SampleDataService.submitOutgoingSample({
        计量日期: '2025-06-30',
        收货单位名称: '金鼎锌业',
        样品编号: 'TEST-001',
        '水份(%)': 8.5,
        Pb: 46.2,
        Zn: 53.1
      });
      
      if (result.success) {
        addResult(`✅ 出厂样数据提交成功: ${result.message}`);
      } else {
        addResult(`❌ 出厂样数据提交失败: ${result.message}`);
      }
    } catch (error) {
      addResult(`💥 出厂样数据提交异常: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setResults([]);
    addResult("🚀 开始执行所有样品管理API测试...");
    
    await testShiftSample();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testFilterSample();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testIncomingSample();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testOutgoingSample();
    
    addResult("🎉 所有测试完成！");
    setIsLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>样品管理API测试页面</CardTitle>
          <CardDescription>
            测试四个样品管理页面的Supabase数据库同步功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={testShiftSample} disabled={isLoading}>
              测试班样
            </Button>
            <Button onClick={testFilterSample} disabled={isLoading}>
              测试压滤样
            </Button>
            <Button onClick={testIncomingSample} disabled={isLoading}>
              测试进厂样
            </Button>
            <Button onClick={testOutgoingSample} disabled={isLoading}>
              测试出厂样
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={runAllTests} disabled={isLoading} className="flex-1">
              {isLoading ? "测试中..." : "运行所有测试"}
            </Button>
            <Button onClick={clearResults} variant="outline">
              清空结果
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">测试结果:</h3>
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-muted-foreground">暂无测试结果</p>
              ) : (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
