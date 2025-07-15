"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { cn } from "@/lib/utils";
import {
  Save,
  Loader2,
  Package,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/ui/footer";
import { SampleDataService } from "@/lib/supabase";

// 表单数据接口
interface OutgoingSampleInternalFormData {
  date: string;
  receivingUnit: string;
  sampleNumber: string;
  moisture: string;
  pbGrade: string;
  znGrade: string;
}

// 初始表单数据
const initialFormData: OutgoingSampleInternalFormData = {
  date: "",
  receivingUnit: "金鼎锌业",
  sampleNumber: "",
  moisture: "",
  pbGrade: "",
  znGrade: "",
};

export default function OutgoingSampleInternalPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<OutgoingSampleInternalFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  // 更新表单字段
  const updateFormField = useCallback((field: keyof OutgoingSampleInternalFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 表单验证
  const validateForm = useCallback(() => {
    if (!formData.date) {
      return "请选择计量日期";
    }
    if (!formData.sampleNumber) {
      return "请填写样品编号";
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
      // 准备提交数据，映射到数据库字段
      const submitData = {
        计量日期: formData.date,
        收货单位名称: formData.receivingUnit,
        样品编号: formData.sampleNumber,
        水份: formData.moisture,
        Pb: formData.pbGrade,
        Zn: formData.znGrade,
      };

      console.log('提交出厂样内部取样数据:', submitData);

      // 获取用户头信息
      const getCurrentUserHeaders = async (): Promise<Record<string, string>> => {
        try {
          const currentUserId = localStorage.getItem('fdx_current_user_id');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (currentUserId) {
            headers['x-user-id'] = currentUserId;
          }

          const sessionData = localStorage.getItem('fdx_session_data');
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              if (session.token) {
                headers['Authorization'] = `Bearer ${session.token}`;
              }
            } catch (e) {
              console.warn('解析会话数据失败:', e);
            }
          }

          return headers;
        } catch (error) {
          console.error('获取用户头信息失败:', error);
          return {
            'Content-Type': 'application/json',
          };
        }
      };

      const headers = await getCurrentUserHeaders();

      // 调用API提交数据
      const response = await fetch('/api/samples/outgoing-sample-internal', {
        method: 'POST',
        headers,
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error(`提交失败: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ 出厂样内部取样数据提交成功:', result);

      setSubmitStatus('success');
      setSubmitMessage('出厂样内部取样数据提交成功！');
      
      // 重置表单
      setFormData(initialFormData);
      
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('❌ 出厂样内部取样数据提交失败:', error);
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : '提交失败，请重试');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">出厂样内部取样</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>出厂样内部取样数据填报</span>
            </CardTitle>
            <CardDescription>
              请填写出厂样内部取样记录数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 计量日期 */}
              <div className="space-y-2">
                <Label htmlFor="date">计量日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormField('date', e.target.value)}
                />
              </div>

              {/* 收货单位 */}
              <div className="space-y-2">
                <Label htmlFor="receivingUnit">收货单位</Label>
                <Input
                  id="receivingUnit"
                  type="text"
                  value={formData.receivingUnit}
                  onChange={(e) => updateFormField('receivingUnit', e.target.value)}
                  placeholder="请输入收货单位名称"
                />
              </div>

              {/* 样品编号 */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sampleNumber">样品编号</Label>
                <Input
                  id="sampleNumber"
                  type="text"
                  value={formData.sampleNumber}
                  onChange={(e) => updateFormField('sampleNumber', e.target.value)}
                  placeholder="请输入样品编号"
                />
              </div>
            </div>

            {/* 化验数据 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">化验数据</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 水份 */}
                <div className="space-y-2">
                  <Label htmlFor="moisture">水份 (%)</Label>
                  <Input
                    id="moisture"
                    type="text"
                    value={formData.moisture}
                    onChange={(e) => updateFormField('moisture', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {/* Pb品位 */}
                <div className="space-y-2">
                  <Label htmlFor="pbGrade">Pb品位 (%)</Label>
                  <Input
                    id="pbGrade"
                    type="text"
                    value={formData.pbGrade}
                    onChange={(e) => updateFormField('pbGrade', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {/* Zn品位 */}
                <div className="space-y-2">
                  <Label htmlFor="znGrade">Zn品位 (%)</Label>
                  <Input
                    id="znGrade"
                    type="text"
                    value={formData.znGrade}
                    onChange={(e) => updateFormField('znGrade', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "min-w-32 transition-all duration-200",
                  submitStatus === 'success' && "bg-green-600 hover:bg-green-700",
                  submitStatus === 'error' && "bg-red-600 hover:bg-red-700"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : submitStatus === 'success' ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    提交成功
                  </>
                ) : submitStatus === 'error' ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    提交失败
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    提交数据
                  </>
                )}
              </Button>
            </div>

            {/* 状态消息 */}
            {submitMessage && (
              <div className={cn(
                "text-center text-sm p-3 rounded-md",
                submitStatus === 'success' && "bg-green-50 text-green-700 border border-green-200",
                submitStatus === 'error' && "bg-red-50 text-red-700 border border-red-200"
              )}>
                {submitMessage}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
