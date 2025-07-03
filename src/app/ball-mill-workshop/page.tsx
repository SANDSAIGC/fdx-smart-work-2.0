"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, Save, RefreshCw, Clock, User,
  Gauge, Beaker, Target, TrendingUp, Upload, Image as ImageIcon,
  X, BarChart3, Activity, Loader2, Camera, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Header1 } from "@/components/headers";
import { Footer } from "@/components/ui/footer";
import { format } from "date-fns";
import { toast } from "sonner";
import { SampleDataService, type BallMillData } from "@/lib/supabase";

// 图片上传组件
interface ImageUploadComponentProps {
  label: string;
  field: string;
  uploadedImage?: string;
  isUploading: boolean;
  onImageUpload: (field: string, file: File) => void;
  onImageDelete: (field: string) => void;
}

const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({
  label,
  field,
  uploadedImage,
  isUploading,
  onImageUpload,
  onImageDelete
}) => {
  return (
    <div className="space-y-3">
      <Label className="flex items-center text-base font-medium">
        <Camera className="mr-2 h-4 w-4 text-primary" />
        {label}
      </Label>
      <div className="space-y-4">
        {uploadedImage ? (
          <div className="relative">
            <img
              src={uploadedImage}
              alt={label}
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => onImageDelete(field)}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <div className="mt-4">
                <Label htmlFor={`photo-upload-${field}`} className="cursor-pointer">
                  <span className="text-sm font-medium text-primary hover:text-primary/80">
                    点击上传照片
                  </span>
                  <Input
                    id={`photo-upload-${field}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageUpload(field, file);
                    }}
                    className="hidden"
                    disabled={isUploading}
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 JPG, PNG, WEBP 格式，最大 10MB
                </p>
              </div>
            </div>
          </div>
        )}
        {isUploading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">上传中...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 类型定义
interface BallMillRecord {
  id?: number;
  日期: string;
  时间: string;
  进料流量: number | '';
  一号壶称重: number | '';
  一号壶浓度: number | '';
  二号壶称重: number | '';
  二号壶浓度: number | '';
  二号壶细度称重: number | '';
  二号壶细度: number | '';
  一号壶称重照片url?: string;
  二号壶称重照片url?: string;
  二号壶细度称重照片url?: string;
  操作员?: string;
}

// 计算状态接口
interface CalculationState {
  isCalculating: boolean;
  error?: string;
}

interface TrendData {
  time: string;
  进料流量: number;
  一号壶浓度: number;
  二号壶浓度: number;
  二号壶细度: number;
}

// 图表配置
const chartConfig = {
  进料流量: {
    label: "进料流量",
    color: "var(--chart-1)",
  },
  一号壶浓度: {
    label: "一号壶浓度",
    color: "var(--chart-2)",
  },
  二号壶浓度: {
    label: "二号壶浓度",
    color: "var(--chart-3)",
  },
  二号壶细度: {
    label: "二号壶细度",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export default function BallMillWorkshopPage() {
  const router = useRouter();

  // 状态管理
  const [isLoading, setIsLoading] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState<BallMillRecord>({
    日期: new Date().toISOString().split('T')[0],
    时间: format(new Date(), "HH:mm"),
    进料流量: '',
    一号壶称重: '',
    一号壶浓度: '',
    二号壶称重: '',
    二号壶浓度: '',
    二号壶细度称重: '',
    二号壶细度: '',
  });

  // 计算状态
  const [calculationStates, setCalculationStates] = useState<{
    一号壶浓度: CalculationState;
    二号壶浓度: CalculationState;
    二号壶细度: CalculationState;
  }>({
    一号壶浓度: { isCalculating: false },
    二号壶浓度: { isCalculating: false },
    二号壶细度: { isCalculating: false },
  });

  // 24小时趋势数据
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoadingTrend, setIsLoadingTrend] = useState(true);

  // 图片上传状态
  const [uploadedImages, setUploadedImages] = useState<{
    一号壶称重照片url?: string;
    二号壶称重照片url?: string;
    二号壶细度称重照片url?: string;
  }>({});

  // 图片上传加载状态
  const [isUploading, setIsUploading] = useState<{
    [key: string]: boolean;
  }>({});

  // 用户信息
  const [user, setUser] = useState<any>(null);

  // 防抖hook
  const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // 获取用户信息
  const fetchUser = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/users?id=${userId}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.data); // 修复：使用data.data而不是data.user
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      router.push('/auth/login');
    }
  }, [router]);

  // 获取24小时趋势数据
  const fetch24HourTrendData = useCallback(async () => {
    try {
      setIsLoadingTrend(true);
      const today = new Date().toISOString().split('T')[0];

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('浓细度记录-FDX')}?select=*&日期=eq.${today}&order=时间.asc`;

      const response = await fetch(queryUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // 转换数据格式用于图表显示
        const chartData = data.map((item: any) => ({
          time: item.时间,
          进料流量: parseFloat(item.进料流量) || 0,
          一号壶浓度: parseFloat(item.一号壶浓度) || 0,
          二号壶浓度: parseFloat(item.二号壶浓度) || 0,
          二号壶细度: parseFloat(item.二号壶细度) || 0,
        }));

        setTrendData(chartData);
      } else {
        // 如果没有数据，生成模拟数据用于演示
        const mockData = generateMock24HourData();
        setTrendData(mockData);
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      // 生成模拟数据
      const mockData = generateMock24HourData();
      setTrendData(mockData);
    } finally {
      setIsLoadingTrend(false);
    }
  }, []);

  // 生成模拟24小时数据
  const generateMock24HourData = (): TrendData[] => {
    const data: TrendData[] = [];
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        进料流量: 40 + Math.random() * 20,
        一号壶浓度: 65 + Math.random() * 10,
        二号壶浓度: 70 + Math.random() * 10,
        二号壶细度: 80 + Math.random() * 15,
      });
    }
    return data;
  };

  // 一号壶浓度自动计算
  const calculatePot1Density = useCallback(async (weight: number) => {
    if (!weight || weight <= 0) {
      updateFormField('一号壶浓度', '');
      return;
    }

    setCalculationStates(prev => ({
      ...prev,
      一号壶浓度: { isCalculating: true }
    }));

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('浓细度参数-#1浓度')}?select=*&order=重量g.asc`;

      const response = await fetch(queryUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // 找到最接近的重量值
        let closestRecord = null;
        let minDiff = Infinity;

        for (const record of data) {
          const diff = Math.abs(parseFloat(record['重量g']) - weight);
          if (diff < minDiff) {
            minDiff = diff;
            closestRecord = record;
          }
        }

        if (closestRecord) {
          updateFormField('一号壶浓度', parseFloat(closestRecord['浓度%']));
          setCalculationStates(prev => ({
            ...prev,
            一号壶浓度: { isCalculating: false }
          }));
        } else {
          throw new Error('未找到匹配的数据');
        }
      } else {
        throw new Error('查询失败');
      }
    } catch (error) {
      console.error('一号壶浓度计算失败:', error);
      setCalculationStates(prev => ({
        ...prev,
        一号壶浓度: { isCalculating: false, error: '计算失败' }
      }));
    }
  }, []);

  // 二号壶浓度自动计算
  const calculatePot2Density = useCallback(async (weight: number) => {
    if (!weight || weight <= 0) {
      updateFormField('二号壶浓度', '');
      return;
    }

    setCalculationStates(prev => ({
      ...prev,
      二号壶浓度: { isCalculating: true }
    }));

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('浓细度参数-#2浓度')}?select=*&order=重量g.asc`;

      const response = await fetch(queryUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // 找到最接近的重量值
        let closestRecord = null;
        let minDiff = Infinity;

        for (const record of data) {
          const diff = Math.abs(parseFloat(record['重量g']) - weight);
          if (diff < minDiff) {
            minDiff = diff;
            closestRecord = record;
          }
        }

        if (closestRecord) {
          updateFormField('二号壶浓度', parseFloat(closestRecord['浓度%']));
          setCalculationStates(prev => ({
            ...prev,
            二号壶浓度: { isCalculating: false }
          }));
        } else {
          throw new Error('未找到匹配的数据');
        }
      } else {
        throw new Error('查询失败');
      }
    } catch (error) {
      console.error('二号壶浓度计算失败:', error);
      setCalculationStates(prev => ({
        ...prev,
        二号壶浓度: { isCalculating: false, error: '计算失败' }
      }));
    }
  }, []);

  // 二号壶细度自动计算
  const calculatePot2Fineness = useCallback(async (weight: number, density: number) => {
    if (!weight || weight <= 0 || !density || density <= 0) {
      updateFormField('二号壶细度', '');
      return;
    }

    setCalculationStates(prev => ({
      ...prev,
      二号壶细度: { isCalculating: true }
    }));

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      // 先获取所有细度数据
      const allDataUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('浓细度参数-#2细度')}?select=*`;
      const response = await fetch(allDataUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const allData = await response.json();

      if (!allData || allData.length === 0) {
        throw new Error('参数表中没有数据');
      }

      // 找到最接近的浓度
      let closestDensity = null;
      let minDensityDiff = Infinity;

      for (const record of allData) {
        const recordDensity = parseFloat(record['浓度%']);
        const densityDiff = Math.abs(recordDensity - density);
        if (densityDiff < minDensityDiff) {
          minDensityDiff = densityDiff;
          closestDensity = recordDensity;
        }
      }

      if (closestDensity === null) {
        throw new Error('无法找到匹配的浓度');
      }

      // 筛选出匹配浓度的记录
      const matchingDensityRecords = allData.filter(record =>
        parseFloat(record['浓度%']) === closestDensity
      );

      if (matchingDensityRecords.length === 0) {
        throw new Error('没有找到匹配浓度的记录');
      }

      // 在匹配浓度的记录中找到最接近的重量
      let closestRecord = null;
      let minWeightDiff = Infinity;

      for (const record of matchingDensityRecords) {
        const recordWeight = parseFloat(record['重量2']);
        const weightDiff = Math.abs(recordWeight - weight);
        if (weightDiff < minWeightDiff) {
          minWeightDiff = weightDiff;
          closestRecord = record;
        }
      }

      if (closestRecord) {
        const fineness = parseFloat(closestRecord['细度%']);
        updateFormField('二号壶细度', fineness);
        setCalculationStates(prev => ({
          ...prev,
          二号壶细度: { isCalculating: false }
        }));
      } else {
        throw new Error('未找到匹配的重量数据');
      }
    } catch (error) {
      console.error('二号壶细度计算失败:', error);
      setCalculationStates(prev => ({
        ...prev,
        二号壶细度: { isCalculating: false, error: error.message || '计算失败' }
      }));
    }
  }, []);

  // 更新表单字段
  const updateFormField = (field: keyof BallMillRecord, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  // 图片上传处理
  const handleImageUpload = async (field: string, file: File) => {
    if (!file) return;

    try {
      setIsUploading(prev => ({ ...prev, [field]: true }));

      // 确定照片类型
      let photoType = '';
      if (field === '一号壶称重照片url') photoType = '一号壶称重';
      else if (field === '二号壶称重照片url') photoType = '二号壶称重';
      else if (field === '二号壶细度称重照片url') photoType = '二号壶细度称重';

      console.log(`📸 [球磨车间] 开始上传 ${photoType} 图片`);

      // 创建表单数据
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('photoType', photoType);
      uploadFormData.append('date', formData.日期);
      uploadFormData.append('time', formData.时间);
      uploadFormData.append('userName', user?.name || user?.姓名 || '未知用户');

      // 调用上传API
      const response = await fetch('/api/upload-ball-mill-photo', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ [球磨车间] ${photoType} 图片上传成功:`, result.data.publicUrl);

        // 更新状态
        setUploadedImages(prev => ({
          ...prev,
          [field]: result.data.publicUrl
        }));

        toast.success(result.message || `${photoType}图片上传成功`);
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error(`❌ [球磨车间] ${field} 图片上传失败:`, error);
      toast.error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  // 删除图片
  const removeImage = async (field: string) => {
    try {
      const imageUrl = uploadedImages[field as keyof typeof uploadedImages];
      if (imageUrl) {
        // 从URL提取文件路径
        const bucketPath = '/storage/v1/object/public/ball-mill-photos/';
        const index = imageUrl.indexOf(bucketPath);
        if (index !== -1) {
          const filePath = imageUrl.substring(index + bucketPath.length);

          console.log(`🗑️ [球磨车间] 开始删除存储文件:`, filePath);

          // 调用删除API
          const response = await fetch('/api/delete-ball-mill-photo', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath }),
          });

          const result = await response.json();

          if (result.success) {
            console.log(`✅ [球磨车间] 存储文件删除成功:`, filePath);
          } else {
            console.warn('⚠️ [球磨车间] 删除存储文件失败:', result.error);
            // 继续删除本地状态，不阻止用户操作
          }
        }
      }

      setUploadedImages(prev => ({
        ...prev,
        [field]: undefined
      }));
      setFormData(prev => ({
        ...prev,
        [field]: undefined
      }));
      toast.success('图片已删除');
    } catch (error) {
      console.error('❌ [球磨车间] 删除图片失败:', error);
      // 即使删除失败，也清除本地状态
      setUploadedImages(prev => ({
        ...prev,
        [field]: undefined
      }));
      toast.success('图片已删除');
    }
  };



  // 提交表单
  const handleSubmit = async () => {
    console.log('开始提交，用户信息:', user);

    if (!user) {
      console.error('用户信息未加载');
      toast.error('用户信息未加载，请重新登录');
      return;
    }

    setIsLoading(true);

    let recordData = null; // 在try块外部声明

    try {
      // 构建提交数据
      const ballMillData: BallMillData = {
        操作员: user.name || user.姓名 || '未知用户',
        日期: formData.日期,
        时间: formData.时间,
        进料流量: formData.进料流量 ? Number(formData.进料流量) : undefined,
        一号壶称重: formData.一号壶称重 ? Number(formData.一号壶称重) : undefined,
        一号壶浓度: formData.一号壶浓度 ? Number(formData.一号壶浓度) : undefined,
        二号壶称重: formData.二号壶称重 ? Number(formData.二号壶称重) : undefined,
        二号壶浓度: formData.二号壶浓度 ? Number(formData.二号壶浓度) : undefined,
        二号壶细度称重: formData.二号壶细度称重 ? Number(formData.二号壶细度称重) : undefined,
        二号壶细度: formData.二号壶细度 ? Number(formData.二号壶细度) : undefined,
        一号壶称重照片url: uploadedImages.一号壶称重照片url,
        二号壶称重照片url: uploadedImages.二号壶称重照片url,
        二号壶细度称重照片url: uploadedImages.二号壶细度称重照片url
      };

      console.log('📤 [球磨车间] 准备提交的数据:', ballMillData);

      // 使用SampleDataService提交数据
      const result = await SampleDataService.submitBallMillData(ballMillData);

      if (result.success) {
        console.log('✅ [球磨车间] 提交成功:', result);
        toast.success(result.message || '记录提交成功');

        // 重置表单
        setFormData({
          日期: new Date().toISOString().split('T')[0],
          时间: format(new Date(), "HH:mm"),
          进料流量: '',
          一号壶称重: '',
          一号壶浓度: '',
          二号壶称重: '',
          二号壶浓度: '',
          二号壶细度称重: '',
          二号壶细度: '',
        });

        setUploadedImages({});

        // 刷新趋势数据
        await fetch24HourTrendData();
      } else {
        console.error('❌ [球磨车间] 提交失败:', result);
        toast.error(result.message || '提交失败');
      }


    } catch (error) {
      console.error('❌ [球磨车间] 提交异常:', error);
      toast.error(`提交失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchUser();
    fetch24HourTrendData();
  }, [fetchUser, fetch24HourTrendData]);

  // 防抖处理的重量值
  const debouncedPot1Weight = useDebounce(formData.一号壶称重, 500);
  const debouncedPot2Weight = useDebounce(formData.二号壶称重, 500);
  const debouncedPot2FineWeight = useDebounce(formData.二号壶细度称重, 500);

  // 一号壶称重变化时自动计算浓度
  useEffect(() => {
    if (debouncedPot1Weight && typeof debouncedPot1Weight === 'number') {
      calculatePot1Density(debouncedPot1Weight);
    }
  }, [debouncedPot1Weight, calculatePot1Density]);

  // 二号壶称重变化时自动计算浓度
  useEffect(() => {
    if (debouncedPot2Weight && typeof debouncedPot2Weight === 'number') {
      calculatePot2Density(debouncedPot2Weight);
    }
  }, [debouncedPot2Weight, calculatePot2Density]);

  // 二号壶细度称重和浓度变化时自动计算细度
  useEffect(() => {
    if (debouncedPot2FineWeight && typeof debouncedPot2FineWeight === 'number' &&
        formData.二号壶浓度 && typeof formData.二号壶浓度 === 'number') {
      calculatePot2Fineness(debouncedPot2FineWeight, formData.二号壶浓度);
    }
  }, [debouncedPot2FineWeight, formData.二号壶浓度, calculatePot2Fineness]);

  // 24小时趋势图表组件
  const TrendChart = ({ data, title }: { data: TrendData[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>当前日期24小时趋势变化 (0:00-24:00)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="进料流量"
              type="monotone"
              stroke="var(--color-进料流量)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="一号壶浓度"
              type="monotone"
              stroke="var(--color-一号壶浓度)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="二号壶浓度"
              type="monotone"
              stroke="var(--color-二号壶浓度)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="二号壶细度"
              type="monotone"
              stroke="var(--color-二号壶细度)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 font-medium leading-none">
              24小时数据趋势监控 <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              实时更新球磨车间关键参数
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header-1: 汉堡菜单(左) -- 居中标题 -- 主题切换(右) */}
      <Header1
        title="球磨车间"
        subtitle="实时监控 · 精确记录 · 智能分析"
        icon={Settings}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* 24小时趋势图 */}
        {isLoadingTrend ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : (
          <TrendChart data={trendData} title="24小时趋势监控" />
        )}

        {/* 基本信息区 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">记录日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.日期}
                  onChange={(e) => updateFormField('日期', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">记录时间</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.时间}
                  onChange={(e) => updateFormField('时间', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedRate">进料流量 (t/h)</Label>
              <Input
                id="feedRate"
                type="number"
                step="0.1"
                placeholder="输入进料流量"
                value={formData.进料流量}
                onChange={(e) => updateFormField('进料流量', parseFloat(e.target.value) || '')}
                className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              />
              <p className="text-xs text-muted-foreground">输入值 - 手动输入</p>
            </div>
          </CardContent>
        </Card>

        {/* 一号壶数据区 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Beaker className="w-5 h-5 mr-2" />
              一号壶数据
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 一号壶称重图片上传 */}
            <ImageUploadComponent
              label="一号壶称重照片"
              field="一号壶称重照片url"
              uploadedImage={uploadedImages.一号壶称重照片url}
              isUploading={isUploading['一号壶称重照片url'] || false}
              onImageUpload={handleImageUpload}
              onImageDelete={removeImage}
            />

            <div className="space-y-2">
              <Label htmlFor="pot1Weight">一号壶称重 (g)</Label>
              <Input
                id="pot1Weight"
                type="number"
                step="0.1"
                placeholder="输入一号壶称重"
                value={formData.一号壶称重}
                onChange={(e) => updateFormField('一号壶称重', parseFloat(e.target.value) || '')}
                className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              />
              <p className="text-xs text-muted-foreground">输入值 - 手动输入称重数据</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                一号壶浓度 (%)
                {calculationStates.一号壶浓度.isCalculating && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="自动计算浓度值"
                value={formData.一号壶浓度}
                className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                计算值 - 基于称重数据自动计算
                {calculationStates.一号壶浓度.error && (
                  <span className="text-red-500 ml-2">{calculationStates.一号壶浓度.error}</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 二号壶数据区 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              二号壶数据
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 二号壶称重图片上传 */}
            <ImageUploadComponent
              label="二号壶称重照片"
              field="二号壶称重照片url"
              uploadedImage={uploadedImages.二号壶称重照片url}
              isUploading={isUploading['二号壶称重照片url'] || false}
              onImageUpload={handleImageUpload}
              onImageDelete={removeImage}
            />

            <div className="space-y-2">
              <Label htmlFor="pot2Weight">二号壶称重 (g)</Label>
              <Input
                id="pot2Weight"
                type="number"
                step="0.1"
                placeholder="输入二号壶称重"
                value={formData.二号壶称重}
                onChange={(e) => updateFormField('二号壶称重', parseFloat(e.target.value) || '')}
                className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              />
              <p className="text-xs text-muted-foreground">输入值 - 手动输入称重数据</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                二号壶浓度 (%)
                {calculationStates.二号壶浓度.isCalculating && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="自动计算浓度值"
                value={formData.二号壶浓度}
                className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                计算值 - 基于称重数据自动计算
                {calculationStates.二号壶浓度.error && (
                  <span className="text-red-500 ml-2">{calculationStates.二号壶浓度.error}</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 二号壶细度数据区 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gauge className="w-5 h-5 mr-2" />
              二号壶细度数据
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 二号壶细度称重图片上传 */}
            <ImageUploadComponent
              label="二号壶细度称重照片"
              field="二号壶细度称重照片url"
              uploadedImage={uploadedImages.二号壶细度称重照片url}
              isUploading={isUploading['二号壶细度称重照片url'] || false}
              onImageUpload={handleImageUpload}
              onImageDelete={removeImage}
            />

            <div className="space-y-2">
              <Label htmlFor="pot2FineWeight">二号壶细度称重 (g)</Label>
              <Input
                id="pot2FineWeight"
                type="number"
                step="0.1"
                placeholder="输入二号壶细度称重"
                value={formData.二号壶细度称重}
                onChange={(e) => updateFormField('二号壶细度称重', parseFloat(e.target.value) || '')}
                className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              />
              <p className="text-xs text-muted-foreground">输入值 - 手动输入称重数据</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                二号壶细度 (%)
                {calculationStates.二号壶细度.isCalculating && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="自动计算细度值"
                value={formData.二号壶细度}
                className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                计算值 - 基于称重数据和浓度自动计算
                {calculationStates.二号壶细度.error && (
                  <span className="text-red-500 ml-2">{calculationStates.二号壶细度.error}</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮区 */}
        <Card>
          <CardContent className="pt-6">
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


      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
