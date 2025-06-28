"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Calculator,
  Save,
  Loader2,
  Package,
  Droplets,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Menu,
  User,
  Bell,
  AlertTriangle,
  UserCheck,
  Trophy,
  LogOut
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/ui/footer";

// 表单数据接口
interface OutgoingSampleFormData {
  date: Date | undefined;
  moisture: string;
  pbGrade: string;
  znGrade: string;
  remarks: string;
}

// 计算器数据接口
interface MoistureCalculatorData {
  wetWeight: string;
  tareWeight: string;
  dryWeight: string;
}

interface GradeCalculatorData {
  edtaConsumption: string;
  edtaConcentration: string;
  sampleWeight: string;
}

// 初始表单数据
const initialFormData: OutgoingSampleFormData = {
  date: undefined,
  moisture: "",
  pbGrade: "",
  znGrade: "",
  remarks: "",
};

// 初始计算器数据
const initialMoistureData: MoistureCalculatorData = {
  wetWeight: "",
  tareWeight: "",
  dryWeight: "",
};

const initialGradeData: GradeCalculatorData = {
  edtaConsumption: "",
  edtaConcentration: "",
  sampleWeight: "",
};

export default function OutgoingSamplePage() {
  const router = useRouter();

  // 状态管理
  const [formData, setFormData] = useState<OutgoingSampleFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moistureCalcData, setMoistureCalcData] = useState<MoistureCalculatorData>(initialMoistureData);
  const [gradeCalcData, setGradeCalcData] = useState<GradeCalculatorData>(initialGradeData);
  const [moistureDialogOpen, setMoistureDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [currentGradeField, setCurrentGradeField] = useState<string>("");
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string>("");

  // 表单字段更新
  const updateFormField = useCallback((field: keyof OutgoingSampleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 数字输入验证
  const handleNumberInput = useCallback((field: keyof OutgoingSampleFormData, value: string) => {
    // 只允许数字和小数点
    const numericValue = value.replace(/[^0-9.]/g, '');
    updateFormField(field, numericValue);
  }, [updateFormField]);

  // 水份计算
  const calculateMoisture = useCallback(() => {
    const { wetWeight, tareWeight, dryWeight } = moistureCalcData;
    const wet = parseFloat(wetWeight);
    const tare = parseFloat(tareWeight);
    const dry = parseFloat(dryWeight);

    if (isNaN(wet) || isNaN(tare) || isNaN(dry)) {
      return null;
    }

    if (wet <= tare || dry <= tare) {
      return null;
    }

    // 水份% = (湿重-干重)/(湿重-皮重) × 100%
    const moisture = ((wet - dry) / (wet - tare)) * 100;
    return moisture.toFixed(2);
  }, [moistureCalcData]);

  // 品位计算
  const calculateGrade = useCallback(() => {
    const { edtaConsumption, edtaConcentration, sampleWeight } = gradeCalcData;
    const consumption = parseFloat(edtaConsumption);
    const concentration = parseFloat(edtaConcentration);
    const weight = parseFloat(sampleWeight);

    if (isNaN(consumption) || isNaN(concentration) || isNaN(weight) || weight === 0) {
      return null;
    }

    // 品位% = (EDTA消耗量 × EDTA浓度)/样品质量 × 100%
    const grade = (consumption * concentration) / weight * 100;
    return grade.toFixed(2);
  }, [gradeCalcData]);

  // 应用水份计算结果
  const applyMoistureCalculation = useCallback(() => {
    const result = calculateMoisture();
    if (result !== null) {
      updateFormField('moisture', result);
      setMoistureDialogOpen(false);
      setMoistureCalcData(initialMoistureData);
    }
  }, [calculateMoisture, updateFormField]);

  // 应用品位计算结果
  const applyGradeCalculation = useCallback(() => {
    const result = calculateGrade();
    if (result !== null && currentGradeField) {
      updateFormField(currentGradeField as keyof OutgoingSampleFormData, result);
      setGradeDialogOpen(false);
      setGradeCalcData(initialGradeData);
      setCurrentGradeField("");
    }
  }, [calculateGrade, currentGradeField, updateFormField]);

  // 打开品位计算器
  const openGradeCalculator = useCallback((field: string) => {
    setCurrentGradeField(field);
    setGradeDialogOpen(true);
  }, []);

  // 表单验证
  const validateForm = useCallback(() => {
    if (!formData.date) {
      return "请选择日期";
    }
    if (!formData.moisture || !formData.pbGrade || !formData.znGrade) {
      return "请填写所有必填字段";
    }
    return null;
  }, [formData]);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setSubmitStatus('error');
      setSubmitMessage(validationError);
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus('success');
      setSubmitMessage('出厂样数据提交成功！');
      setFormData(initialFormData);
      setTimeout(() => setSubmitStatus('idle'), 3000);

    } catch (error) {
      console.error('提交失败:', error);
      setSubmitStatus('error');
      setSubmitMessage(`提交失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <div className="container mx-auto p-6">
        <div className="relative mb-6">
          {/* 汉堡菜单 - 左上角 */}
          <div className="absolute top-0 left-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => console.log('角色管理')}>
                  <User className="mr-2 h-4 w-4" />
                  角色
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('任务管理')}>
                  <Bell className="mr-2 h-4 w-4" />
                  任务
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('情况监控')}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  情况
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('考勤管理')}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  考勤
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('积分系统')}>
                  <Trophy className="mr-2 h-4 w-4" />
                  积分
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/')}>
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 返回按钮 - 左侧 */}
          <div className="absolute top-0 left-16">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/lab')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回化验室
            </Button>
          </div>

          {/* 主题切换按钮 - 右上角 */}
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>

          {/* 页面标题 - 居中 */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Package className="h-6 w-6 sm:h-8 sm:w-8" />
              出厂样化验
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              出厂精矿化验数据填报系统
            </p>
          </div>
        </div>

        {/* 主要内容 */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>出厂精矿化验数据填报</span>
            </CardTitle>
            <CardDescription>
              请填写出厂样记录数据，包含日期和化验结果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基础信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 日期选择 */}
              <div className="space-y-2">
                <Label htmlFor="date">日期</Label>
                <DatePicker
                  date={formData.date}
                  onDateChange={(date) => updateFormField('date', date)}
                  placeholder="选择日期"
                />
              </div>
            </div>

            {/* 化验数据 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Droplets className="h-5 w-5" />
                <span>化验数据</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 水份 */}
                <div className="space-y-2">
                  <Label htmlFor="moisture">水份 (%)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="moisture"
                      type="text"
                      placeholder="0.00"
                      value={formData.moisture}
                      onChange={(e) => handleNumberInput('moisture', e.target.value)}
                      className="flex-1"
                    />
                    <Dialog open={moistureDialogOpen} onOpenChange={setMoistureDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>水份计算器</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="wetWeight">湿重 (g)</Label>
                            <Input
                              id="wetWeight"
                              type="text"
                              placeholder="0.00"
                              value={moistureCalcData.wetWeight}
                              onChange={(e) => setMoistureCalcData(prev => ({
                                ...prev,
                                wetWeight: e.target.value.replace(/[^0-9.]/g, '')
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tareWeight">皮重 (g)</Label>
                            <Input
                              id="tareWeight"
                              type="text"
                              placeholder="0.00"
                              value={moistureCalcData.tareWeight}
                              onChange={(e) => setMoistureCalcData(prev => ({
                                ...prev,
                                tareWeight: e.target.value.replace(/[^0-9.]/g, '')
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dryWeight">干重 (g)</Label>
                            <Input
                              id="dryWeight"
                              type="text"
                              placeholder="0.00"
                              value={moistureCalcData.dryWeight}
                              onChange={(e) => setMoistureCalcData(prev => ({
                                ...prev,
                                dryWeight: e.target.value.replace(/[^0-9.]/g, '')
                              }))}
                            />
                          </div>
                          {calculateMoisture() && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium">计算结果: {calculateMoisture()}%</p>
                            </div>
                          )}
                          <div className="flex justify-end space-x-2">
                            <DialogClose asChild>
                              <Button variant="outline">取消</Button>
                            </DialogClose>
                            <Button
                              onClick={applyMoistureCalculation}
                              disabled={!calculateMoisture()}
                            >
                              应用结果
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Pb品位 */}
                <div className="space-y-2">
                  <Label htmlFor="pbGrade">Pb品位 (%)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="pbGrade"
                      type="text"
                      placeholder="0.00"
                      value={formData.pbGrade}
                      onChange={(e) => handleNumberInput('pbGrade', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openGradeCalculator('pbGrade')}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Zn品位 */}
                <div className="space-y-2">
                  <Label htmlFor="znGrade">Zn品位 (%)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="znGrade"
                      type="text"
                      placeholder="0.00"
                      value={formData.znGrade}
                      onChange={(e) => handleNumberInput('znGrade', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openGradeCalculator('znGrade')}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 品位计算器对话框 */}
            <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>品位计算器</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edtaConsumption">EDTA消耗量 (mL)</Label>
                    <Input
                      id="edtaConsumption"
                      type="text"
                      placeholder="0.00"
                      value={gradeCalcData.edtaConsumption}
                      onChange={(e) => setGradeCalcData(prev => ({
                        ...prev,
                        edtaConsumption: e.target.value.replace(/[^0-9.]/g, '')
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edtaConcentration">EDTA浓度 (mol/L)</Label>
                    <Input
                      id="edtaConcentration"
                      type="text"
                      placeholder="0.00"
                      value={gradeCalcData.edtaConcentration}
                      onChange={(e) => setGradeCalcData(prev => ({
                        ...prev,
                        edtaConcentration: e.target.value.replace(/[^0-9.]/g, '')
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sampleWeight">样品质量 (g)</Label>
                    <Input
                      id="sampleWeight"
                      type="text"
                      placeholder="0.00"
                      value={gradeCalcData.sampleWeight}
                      onChange={(e) => setGradeCalcData(prev => ({
                        ...prev,
                        sampleWeight: e.target.value.replace(/[^0-9.]/g, '')
                      }))}
                    />
                  </div>
                  {calculateGrade() && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">计算结果: {calculateGrade()}%</p>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <DialogClose asChild>
                      <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button
                      onClick={applyGradeCalculation}
                      disabled={!calculateGrade()}
                    >
                      应用结果
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="remarks">备注</Label>
              <Textarea
                id="remarks"
                placeholder="请输入备注信息（可选）"
                value={formData.remarks}
                onChange={(e) => updateFormField('remarks', e.target.value)}
                rows={3}
              />
            </div>

            {/* 提交状态显示 */}
            {submitStatus !== 'idle' && (
              <div className={cn(
                "flex items-center space-x-2 p-3 rounded-lg",
                submitStatus === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              )}>
                {submitStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{submitMessage}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    提交数据
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 统一底部签名 */}
      <Footer />
    </div>
  );
}
