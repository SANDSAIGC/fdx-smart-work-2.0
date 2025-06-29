"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Check,
  Lock,
  Image,
  CalendarCheck,
  ArrowLeft,
  Loader2,
  Upload,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

// 定义数据类型
interface FilterPressRecord {
  id?: string;
  name: string;
  record_date: string;
  record_time: string;
  shift: '早班' | '中班' | '夜班';
  photo_url?: string | null;
}

interface FilterPressRecordData {
  name: string;
  record_date: string;
  record_time: string;
  shift: '早班' | '中班' | '夜班';
  photo_url?: string | null;
}

export default function FilterPressWorkshopPage() {
  const router = useRouter();
  const [recordDateTime, setRecordDateTime] = useState<Date>(new Date());
  const [shift, setShift] = useState<'早班' | '中班' | '夜班'>('早班');
  const [dailyCount, setDailyCount] = useState<number | null>(null);
  const [shiftCount, setShiftCount] = useState<number | null>(null);
  const [recentRecords, setRecentRecords] = useState<FilterPressRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 模拟用户信息
  const displayName = '操作员';
  const displayTitle = '技术员';

  // 模拟数据获取
  const fetchRecentRecords = async () => {
    try {
      // 生成模拟数据
      const mockRecords: FilterPressRecord[] = Array.from({ length: 5 }, (_, index) => ({
        id: `record_${index + 1}`,
        name: `操作员${index + 1}`,
        record_date: format(new Date(), 'yyyy-MM-dd'),
        record_time: format(new Date(), 'HH:mm:ss'),
        shift: index % 3 === 0 ? '早班' : index % 3 === 1 ? '中班' : '夜班',
        photo_url: index % 2 === 0 ? 'mock_photo_url' : null
      }));
      
      setRecentRecords(mockRecords);
      
      // 模拟计数更新
      setDailyCount(Math.floor(Math.random() * 10) + 5);
      setShiftCount(Math.floor(Math.random() * 5) + 2);
    } catch (error) {
      console.error('获取压滤机记录失败:', error);
    }
  };

  useEffect(() => {
    fetchRecentRecords();
  }, [recordDateTime, shift]);

  // 处理照片上传
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setPhotoFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);
  };

  // 清除照片
  const handleClearPhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  };

  // 提交记录
  const handleSubmitRecord = async () => {
    setIsSubmitting(true);
    setSubmissionStatus('submitting');

    try {
      // 模拟照片上传
      let photoUrl = null;
      if (photoFile) {
        setIsUploadingPhoto(true);
        try {
          // 模拟上传延迟
          await new Promise(resolve => setTimeout(resolve, 2000));
          photoUrl = 'mock_uploaded_photo_url';
        } catch (error) {
          console.error('照片上传失败:', error);
          photoUrl = null;
        } finally {
          setIsUploadingPhoto(false);
        }
      }
      
      const recordData: FilterPressRecordData = {
        name: displayName,
        record_date: format(recordDateTime, 'yyyy-MM-dd'),
        record_time: format(recordDateTime, 'HH:mm:ss'),
        shift,
        photo_url: photoUrl
      };

      console.log('准备提交的记录数据:', recordData);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSubmissionStatus('success');
      setIsSuccess(true);

      setTimeout(() => {
        setIsSubmitting(false);
        setTimeout(() => {
          setSubmissionStatus('idle');
          setIsSuccess(false);
          handleClearPhoto();
        }, 3000);
      }, 500);

      fetchRecentRecords();
    } catch (error) {
      console.error('提交记录过程中发生错误:', error);
      setSubmissionStatus('error');
      setIsSubmitting(false);
    }
  };

  // 处理班次变更
  const handleShiftChange = (value: string) => {
    setShift(value as '早班' | '中班' | '夜班');
  };

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
              <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8" />
              压滤车间
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              当前操作员: {displayName} ({displayTitle})
            </p>
          </div>
        </div>

        {/* 压滤机运行记录 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RotateCcw className="mr-2 h-5 w-5 text-primary" />
              压滤机运行记录
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 周期计数显示 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-primary" />
                  当日周期数
                </Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-center">
                    {dailyCount !== null ? dailyCount : '计算中...'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-primary" />
                  当班周期数
                </Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-center">
                    {shiftCount !== null ? shiftCount : '计算中...'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 记录日期时间 */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <CalendarCheck className="mr-2 h-4 w-4 text-primary" />
                记录日期时间
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !recordDateTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recordDateTime ? format(recordDateTime, "yyyy-MM-dd HH:mm") : "选择日期时间"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={recordDateTime}
                    onSelect={(date) => date && setRecordDateTime(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* 班次选择 */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <CalendarCheck className="mr-2 h-4 w-4 text-primary" />
                班次
              </Label>
              <RadioGroup 
                value={shift} 
                onValueChange={handleShiftChange}
                className="grid grid-cols-3 gap-4"
              >
                {['早班', '中班', '夜班'].map((shiftOption) => (
                  <div key={shiftOption} className="flex items-center space-x-2">
                    <RadioGroupItem value={shiftOption} id={shiftOption} />
                    <Label htmlFor={shiftOption} className="cursor-pointer font-medium">
                      {shiftOption}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 照片上传 */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Image className="mr-2 h-4 w-4 text-primary" />
                操作照片记录
              </Label>
              <div className="space-y-4">
                {photoPreviewUrl ? (
                  <div className="relative">
                    <img
                      src={photoPreviewUrl}
                      alt="预览"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleClearPhoto}
                      disabled={isSubmitting || isUploadingPhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <div className="mt-4">
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                          <span className="text-sm font-medium text-primary hover:text-primary/80">
                            点击上传照片
                          </span>
                          <Input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            disabled={isSubmitting || isUploadingPhoto}
                          />
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          支持 JPG, PNG 格式
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <Button
              onClick={handleSubmitRecord}
              className={cn(
                "w-full",
                isSuccess && "bg-green-500 text-white hover:bg-green-600"
              )}
              disabled={isSubmitting || isUploadingPhoto}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploadingPhoto ? '上传照片中...' : '提交中...'}
                </div>
              ) : submissionStatus === 'success' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  提交成功
                </>
              ) : "提交记录"}
            </Button>

            {/* 最近记录 */}
            {recentRecords.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground flex items-center">
                  <span className="bg-primary/10 rounded-full w-1.5 h-1.5 mr-1.5"></span>
                  最近记录
                </div>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {recentRecords.map((record) => (
                      <Card key={record.id} className="p-3">
                        <div className="text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">
                              {record.shift} - {format(new Date(record.record_date), 'MM-dd')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(`${record.record_date}T${record.record_time}`), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>操作员: {record.name || '未知'}</span>
                            {record.photo_url && (
                              <span className="flex items-center text-primary">
                                <Image className="h-3 w-3 mr-1" />
                                有照片记录
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
