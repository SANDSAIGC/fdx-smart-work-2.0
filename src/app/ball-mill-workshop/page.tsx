"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Settings, Activity, Calculator, 
  Save, RefreshCw, Clock, User,
  Gauge, Beaker, Target, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";
import { format } from "date-fns";

// 类型定义
interface BallMillRecord {
  date: string;
  time: string;
  feedRate: string;
  pot1Weight: string;
  pot1Density: number | '';
  pot2Weight: string;
  pot2Density: number | '';
  pot2Fineness: number | '';
  pot2FineWeight: string;
  remarks: string;
}

interface CalculatorData {
  weight: string;
  dryWeight: string;
  result: number | '';
}

export default function BallMillWorkshopPage() {
  const router = useRouter();
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorType, setCalculatorType] = useState<'density1' | 'density2' | 'fineness'>('density1');

  // 表单数据
  const [formData, setFormData] = useState<BallMillRecord>({
    date: new Date().toISOString().split('T')[0],
    time: format(new Date(), "HH:mm"),
    feedRate: "",
    pot1Weight: "",
    pot1Density: '',
    pot2Weight: "",
    pot2Density: '',
    pot2Fineness: '',
    pot2FineWeight: "",
    remarks: ""
  });
  
  // 计算器数据
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    weight: "",
    dryWeight: "",
    result: ''
  });

  // 实时指标数据
  const [metrics, setMetrics] = useState({
    currentFeedRate: 45.2,
    avgDensity1: 68.5,
    avgDensity2: 72.3,
    avgFineness: 85.8,
    efficiency: 87.2
  });

  // 更新表单字段
  const updateFormField = (field: keyof BallMillRecord, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 打开计算器
  const openCalculator = (type: 'density1' | 'density2' | 'fineness') => {
    setCalculatorType(type);
    setCalculatorData({ weight: "", dryWeight: "", result: '' });
    setShowCalculator(true);
  };

  // 计算结果
  const calculateResult = () => {
    const weight = parseFloat(calculatorData.weight);
    const dryWeight = parseFloat(calculatorData.dryWeight);
    
    if (weight && dryWeight && weight > 0) {
      let result: number;
      
      if (calculatorType === 'fineness') {
        // 细度计算：(筛下重量 / 总重量) × 100
        result = (dryWeight / weight) * 100;
      } else {
        // 浓度计算：(干重 / 湿重) × 100
        result = (dryWeight / weight) * 100;
      }
      
      setCalculatorData(prev => ({ ...prev, result: Number(result.toFixed(2)) }));
    }
  };

  // 应用计算结果
  const applyCalculatorResult = () => {
    if (calculatorData.result !== '') {
      switch (calculatorType) {
        case 'density1':
          updateFormField('pot1Density', calculatorData.result);
          break;
        case 'density2':
          updateFormField('pot2Density', calculatorData.result);
          break;
        case 'fineness':
          updateFormField('pot2Fineness', calculatorData.result);
          break;
      }
    }
    setShowCalculator(false);
  };

  // 提交表单
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // 模拟提交过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("提交球磨车间记录:", formData);
      
      // 重置表单
      setFormData({
        date: new Date(),
        time: format(new Date(), "HH:mm"),
        feedRate: "",
        pot1Weight: "",
        pot1Density: '',
        pot2Weight: "",
        pot2Density: '',
        pot2Fineness: '',
        pot2FineWeight: "",
        remarks: ""
      });
      
    } catch (error) {
      console.error("提交失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        currentFeedRate: prev.currentFeedRate + (Math.random() - 0.5) * 2,
        avgDensity1: prev.avgDensity1 + (Math.random() - 0.5) * 1,
        avgDensity2: prev.avgDensity2 + (Math.random() - 0.5) * 1,
        avgFineness: prev.avgFineness + (Math.random() - 0.5) * 0.5,
        efficiency: prev.efficiency + (Math.random() - 0.5) * 1
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <div className="container mx-auto p-6">
        <div className="relative mb-6">
          {/* 汉堡菜单 - 左上角 */}
          <div className="absolute top-0 left-0">
            <HamburgerMenu />
          </div>

          {/* 右上角按钮组 */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {/* 主题切换按钮 */}
            <ThemeToggle />
          </div>

          {/* 页面标题 - 居中 */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
              球磨车间
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              实时监控 · 精确记录 · 智能分析
            </p>
          </div>
        </div>

        {/* 实时指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">当前给料量</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.currentFeedRate.toFixed(1)} t/h</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-4 w-4 mr-1" />
                实时监控
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">一号壶浓度</CardTitle>
              <Beaker className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgDensity1.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">平均值</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">二号壶浓度</CardTitle>
              <Beaker className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgDensity2.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">平均值</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">二号壶细度</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgFineness.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">平均值</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">设备效率</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.efficiency.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">运行状态</p>
            </CardContent>
          </Card>
        </div>

        {/* 数据记录表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              数据记录表单
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基础信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">记录日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormField('date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">记录时间</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => updateFormField('time', e.target.value)}
                />
              </div>
            </div>

            {/* 给料量和重量数据 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feedRate">给料量 (t/h)</Label>
                <Input
                  id="feedRate"
                  type="number"
                  step="0.1"
                  placeholder="输入给料量"
                  value={formData.feedRate}
                  onChange={(e) => updateFormField('feedRate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pot1Weight">一号壶重量 (g)</Label>
                <Input
                  id="pot1Weight"
                  type="number"
                  step="0.1"
                  placeholder="输入重量"
                  value={formData.pot1Weight}
                  onChange={(e) => updateFormField('pot1Weight', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pot2Weight">二号壶重量 (g)</Label>
                <Input
                  id="pot2Weight"
                  type="number"
                  step="0.1"
                  placeholder="输入重量"
                  value={formData.pot2Weight}
                  onChange={(e) => updateFormField('pot2Weight', e.target.value)}
                />
              </div>
            </div>

            {/* 浓度和细度数据 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>一号壶浓度 (%)</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="浓度值"
                    value={formData.pot1Density}
                    onChange={(e) => updateFormField('pot1Density', parseFloat(e.target.value) || '')}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openCalculator('density1')}
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>二号壶浓度 (%)</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="浓度值"
                    value={formData.pot2Density}
                    onChange={(e) => updateFormField('pot2Density', parseFloat(e.target.value) || '')}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openCalculator('density2')}
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>二号壶细度 (%)</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="细度值"
                    value={formData.pot2Fineness}
                    onChange={(e) => updateFormField('pot2Fineness', parseFloat(e.target.value) || '')}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openCalculator('fineness')}
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 筛下重量和备注 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pot2FineWeight">二号壶筛下 (g)</Label>
                <Input
                  id="pot2FineWeight"
                  type="number"
                  step="0.1"
                  placeholder="输入筛下重量"
                  value={formData.pot2FineWeight}
                  onChange={(e) => updateFormField('pot2FineWeight', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">备注</Label>
                <Textarea
                  id="remarks"
                  placeholder="输入备注信息"
                  value={formData.remarks}
                  onChange={(e) => updateFormField('remarks', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                重置
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "提交中..." : "提交记录"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 计算器弹窗 */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 mx-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                {calculatorType === 'density1' ? '一号壶浓度计算' :
                 calculatorType === 'density2' ? '二号壶浓度计算' : '二号壶细度计算'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>总重量 (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="输入总重量"
                  value={calculatorData.weight}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {calculatorType === 'fineness' ? '筛下重量 (g)' : '干重 (g)'}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={calculatorType === 'fineness' ? '输入筛下重量' : '输入干重'}
                  value={calculatorData.dryWeight}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, dryWeight: e.target.value }))}
                />
              </div>

              <Button onClick={calculateResult} className="w-full">
                计算
              </Button>

              {calculatorData.result !== '' && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {calculatorData.result}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {calculatorType === 'fineness' ? '细度结果' : '浓度结果'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCalculator(false)} className="flex-1">
                  取消
                </Button>
                <Button
                  onClick={applyCalculatorResult}
                  disabled={calculatorData.result === ''}
                  className="flex-1"
                >
                  应用结果
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
