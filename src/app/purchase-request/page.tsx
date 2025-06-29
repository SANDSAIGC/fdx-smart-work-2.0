"use client";

import React, { useState } from "react";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, CheckCircle,
  Package, User, FileText, AlertCircle, CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";
import { PurchaseRequestForm, PurchaseStatus } from "@/types/purchase";

export default function PurchaseRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 日期选择器状态
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState<PurchaseRequestForm>({
    date: format(new Date(), 'yyyy-MM-dd'),
    applicant: "当前用户", // 从用户上下文自动获取
    itemName: "",
    quantity: 0,
    purpose: "",
    expectedDate: "",
    status: PurchaseStatus.PENDING
  });

  const updateFormField = (field: keyof PurchaseRequestForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 准备提交数据，确保日期格式正确
      const submitData = {
        ...formData,
        date: format(selectedDate, 'yyyy-MM-dd'),
        expectedDate: expectedDate ? format(expectedDate, 'yyyy-MM-dd') : ""
      };

      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.push('/purchase-management');
        }, 2000);
      } else {
        setError(result.error || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.itemName && formData.quantity > 0 && formData.purpose;
  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-lg font-semibold">采购申请</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {showSuccess && (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardContent className="flex items-center space-x-2 pt-6">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 dark:text-green-200">采购申请提交成功！正在跳转到管理页面...</span>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="flex items-center space-x-2 pt-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>新建采购申请</span>
            </CardTitle>
            <CardDescription>
              请填写完整的采购申请信息，确保所有必填项都已填写
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>基本信息</span>
                </h3>

                <div className="space-y-2">
                  <Label className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    申请日期 *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "yyyy-MM-dd") : "选择申请日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">品名 *</Label>
                    <Input
                      id="itemName"
                      value={formData.itemName}
                      onChange={(e) => updateFormField('itemName', e.target.value)}
                      placeholder="请输入物品名称"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">数量 *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => updateFormField('quantity', parseFloat(e.target.value) || 0)}
                      placeholder="请输入数量"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">用途 *</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => updateFormField('purpose', e.target.value)}
                    placeholder="请详细说明采购用途"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      期望完成日期
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !expectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expectedDate ? format(expectedDate, "yyyy-MM-dd") : "选择期望完成日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expectedDate}
                          onSelect={(date) => setExpectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="min-w-24"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      提交申请
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

