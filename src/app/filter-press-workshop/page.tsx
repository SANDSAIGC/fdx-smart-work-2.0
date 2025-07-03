'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Loader2,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Camera
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Header1 } from '@/components/headers';
import { Footer } from '@/components/ui/footer';

// 压滤记录数据接口
interface FilterPressRecord {
  id?: number;
  日期: string;
  时间: string;
  班次: '早班' | '中班' | '夜班';
  操作员: string;
  照片url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 用户信息接口
interface User {
  id: string;
  姓名?: string;
  name?: string;
  重定向路由?: string;
}

export default function FilterPressWorkshopPage() {
  const router = useRouter();

  // 用户状态
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // 表单状态
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [shift, setShift] = useState<'早班' | '中班' | '夜班'>('早班');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 图片上传状态
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 历史记录状态
  const [records, setRecords] = useState<FilterPressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<FilterPressRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;

  // 统计状态
  const [dailyCycles, setDailyCycles] = useState(0);
  const [shiftCycles, setShiftCycles] = useState(0);

  // 编辑表单状态
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editShift, setEditShift] = useState<'早班' | '中班' | '夜班'>('早班');
  const [isUpdating, setIsUpdating] = useState(false);

  // 分页计算函数
  const getPaginatedRecords = (allRecords: FilterPressRecord[]) => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return allRecords.slice(startIndex, endIndex);
  };

  // 计算总页数
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  // 获取用户信息
  const fetchUser = async () => {
    try {
      setIsUserLoading(true);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      // 从localStorage获取用户ID
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('用户资料')}?id=eq.${userId}&select=*`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.length > 0) {
          setUser(userData[0]);
        } else {
          throw new Error('用户信息未找到');
        }
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      toast.error('获取用户信息失败');
      router.push('/login');
    } finally {
      setIsUserLoading(false);
    }
  };

  // 获取历史记录
  const fetchRecords = async () => {
    try {
      setIsLoading(true);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      // 获取所有记录
      const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('压滤记录')}?select=*`;

      const response = await fetch(queryUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // 按日期和时间倒序排列
        const sortedRecords = (data || []).sort((a: FilterPressRecord, b: FilterPressRecord) => {
          const dateComparison = new Date(b.日期).getTime() - new Date(a.日期).getTime();
          if (dateComparison !== 0) return dateComparison;

          const timeA = a.时间.split(':').map(Number);
          const timeB = b.时间.split(':').map(Number);
          const timeAMinutes = timeA[0] * 60 + timeA[1];
          const timeBMinutes = timeB[0] * 60 + timeB[1];
          return timeBMinutes - timeAMinutes;
        });

        // 设置总记录数
        setTotalRecords(sortedRecords.length);

        // 设置所有记录（用于分页）
        setRecords(sortedRecords);

        // 计算统计数据
        calculateCycles(sortedRecords);
      } else {
        throw new Error('获取记录失败');
      }
    } catch (error) {
      console.error('获取压滤记录失败:', error);
      toast.error('获取历史记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 计算周期数统计
  const calculateCycles = (allRecords: FilterPressRecord[]) => {
    const selectedDate = date;
    const selectedShift = shift;

    // 当日周期数：所选日期下所有班次提交记录次数总和
    const dailyCount = allRecords.filter(record => {
      const recordDate = format(new Date(record.日期), 'yyyy-MM-dd');
      return recordDate === selectedDate;
    }).length;
    setDailyCycles(dailyCount);

    // 当班周期数：所选日期下所选班次提交记录次数总和
    const shiftCount = allRecords.filter(record => {
      const recordDate = format(new Date(record.日期), 'yyyy-MM-dd');
      return recordDate === selectedDate && record.班次 === selectedShift;
    }).length;
    setShiftCycles(shiftCount);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('用户信息未加载');
      return;
    }

    try {
      setIsSubmitting(true);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      const recordData = {
        日期: date,
        时间: time,
        班次: shift,
        操作员: user.姓名 || user.name || '未知用户',
        照片url: uploadedImage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('压滤记录')}`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(recordData)
      });

      if (response.ok) {
        const newRecord = await response.json();
        console.log('✅ [压滤记录] 记录创建成功:', newRecord);

        toast.success('记录提交成功');

        // 重置表单
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setTime(format(new Date(), 'HH:mm'));
        setShift('早班');
        setUploadedImage(null);

        // 刷新记录列表
        await fetchRecords();

        // 重置到第一页显示新记录
        setCurrentPage(1);
      } else {
        throw new Error('提交失败');
      }
    } catch (error) {
      console.error('提交记录失败:', error);
      toast.error('提交记录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 图片上传处理
  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast.error('用户信息未加载');
      return;
    }

    try {
      setIsUploading(true);

      console.log('📸 [压滤车间] 开始上传图片');

      // 创建表单数据
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('date', date);
      uploadFormData.append('time', time);
      uploadFormData.append('shift', shift);
      uploadFormData.append('userName', user?.姓名 || user?.name || '未知用户');

      // 调用上传API
      const response = await fetch('/api/upload-filter-press-photo', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ [压滤车间] 图片上传成功:', result.data.publicUrl);

        // 更新状态
        setUploadedImage(result.data.publicUrl);
        toast.success(result.message || '图片上传成功');
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('❌ [压滤车间] 图片上传失败:', error);
      toast.error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 删除图片
  const handleImageDelete = () => {
    setUploadedImage(null);
    toast.success('图片已删除');
  };

  // 打开编辑对话框
  const handleEditRecord = (record: FilterPressRecord) => {
    setEditingRecord(record);
    setEditDate(format(new Date(record.日期), 'yyyy-MM-dd'));
    setEditTime(record.时间);
    setEditShift(record.班次);
    setIsEditDialogOpen(true);
  };

  // 更新记录
  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRecord) {
      toast.error('编辑记录信息未找到');
      return;
    }

    try {
      setIsUpdating(true);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      const updateData = {
        日期: editDate,
        时间: editTime,
        班次: editShift,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('压滤记录')}?id=eq.${editingRecord.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('记录更新成功');
        setIsEditDialogOpen(false);
        setEditingRecord(null);
        await fetchRecords();
      } else {
        throw new Error('更新失败');
      }
    } catch (error) {
      console.error('更新记录失败:', error);
      toast.error('更新记录失败');
    } finally {
      setIsUpdating(false);
    }
  };

  // 删除记录
  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('确定要删除这条记录吗？')) {
      return;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('压滤记录')}?id=eq.${recordId}`, {
        method: 'DELETE',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('记录删除成功');
        await fetchRecords();
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      toast.error('删除记录失败');
    }
  };

  // 更新统计数据当日期或班次改变时
  useEffect(() => {
    if (records.length > 0) {
      calculateCycles(records);
    }
  }, [date, shift, records]);

  useEffect(() => {
    fetchUser();
    fetchRecords();
  }, []);

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header-1: 汉堡菜单(左) -- 居中标题 -- 主题切换(右) */}
      <Header1
        title="压滤车间"
        subtitle="压滤设备操作记录和管理系统"
        icon={Filter}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">当日周期数</p>
                  <p className="text-2xl font-bold text-primary">{dailyCycles}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">当班周期数</p>
                  <p className="text-2xl font-bold text-primary">{shiftCycles}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 记录提交表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5 text-primary" />
              新增压滤记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 日期选择 */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-primary" />
                    日期
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                {/* 时间选择 */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    时间
                  </Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 班次选择 */}
              <div className="space-y-3">
                <Label className="flex items-center text-base font-medium">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  班次
                </Label>
                <RadioGroup
                  value={shift}
                  onValueChange={(value: '早班' | '中班' | '夜班') => setShift(value)}
                  className="grid grid-cols-3 gap-3"
                >
                  {/* 早班选项 */}
                  <Label
                    htmlFor="morning-shift"
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                      shift === '早班'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="早班" id="morning-shift" />
                      <div className="flex-1">
                        <span className="font-medium text-blue-700 dark:text-blue-400">早班</span>
                        <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">08:00 - 16:00</p>
                      </div>
                    </div>
                    {shift === '早班' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </Label>

                  {/* 中班选项 */}
                  <Label
                    htmlFor="afternoon-shift"
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                      shift === '中班'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 dark:border-gray-700 dark:hover:border-orange-600 dark:hover:bg-orange-950/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="中班" id="afternoon-shift" />
                      <div className="flex-1">
                        <span className="font-medium text-orange-700 dark:text-orange-400">中班</span>
                        <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">16:00 - 24:00</p>
                      </div>
                    </div>
                    {shift === '中班' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      </div>
                    )}
                  </Label>

                  {/* 夜班选项 */}
                  <Label
                    htmlFor="night-shift"
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                      shift === '夜班'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 dark:border-gray-700 dark:hover:border-purple-600 dark:hover:bg-purple-950/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="夜班" id="night-shift" />
                      <div className="flex-1">
                        <span className="font-medium text-purple-700 dark:text-purple-400">夜班</span>
                        <p className="text-sm text-purple-600 dark:text-purple-500 mt-1">00:00 - 08:00</p>
                      </div>
                    </div>
                    {shift === '夜班' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      </div>
                    )}
                  </Label>
                </RadioGroup>
              </div>

              {/* 图片上传 */}
              <div className="space-y-3">
                <Label className="flex items-center text-base font-medium">
                  <Camera className="mr-2 h-4 w-4 text-primary" />
                  操作照片记录
                </Label>
                <div className="space-y-4">
                  {uploadedImage ? (
                    <div className="relative">
                      <img
                        src={uploadedImage}
                        alt="压滤操作照片"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleImageDelete}
                        disabled={isSubmitting || isUploading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center">
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <div className="mt-4">
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-primary hover:text-primary/80">
                              点击上传照片
                            </span>
                            <Input
                              id="photo-upload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                              }}
                              className="hidden"
                              disabled={isSubmitting || isUploading}
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

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    上传图片中...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    提交记录
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 历史记录 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5 text-primary" />
              历史记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>操作</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead>班次</TableHead>
                      <TableHead>操作员</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedRecords(records).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRecord(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRecord(record.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(record.日期), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{record.时间}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.班次 === '早班'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : record.班次 === '中班'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {record.班次}
                          </span>
                        </TableCell>
                        <TableCell>{record.操作员}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 分页控制 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      显示 {(currentPage - 1) * recordsPerPage + 1} 到{' '}
                      {Math.min(currentPage * recordsPerPage, totalRecords)} 条，共 {totalRecords} 条记录
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        上一页
                      </Button>
                      <span className="text-sm">
                        第 {currentPage} 页，共 {totalPages} 页
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        下一页
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑压滤记录</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">日期</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-time">时间</Label>
              <Input
                id="edit-time"
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>班次</Label>
              <RadioGroup
                value={editShift}
                onValueChange={(value: '早班' | '中班' | '夜班') => setEditShift(value)}
                className="grid grid-cols-3 gap-2"
              >
                <Label htmlFor="edit-morning-shift" className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="早班" id="edit-morning-shift" />
                  <span>早班</span>
                </Label>
                <Label htmlFor="edit-afternoon-shift" className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="中班" id="edit-afternoon-shift" />
                  <span>中班</span>
                </Label>
                <Label htmlFor="edit-night-shift" className="flex items-center space-x-2 cursor-pointer">
                  <RadioGroupItem value="夜班" id="edit-night-shift" />
                  <span>夜班</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                取消
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  '更新记录'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
