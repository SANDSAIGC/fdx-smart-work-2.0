"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Truck,
  Calendar,
  Clock,
  Calculator,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ArrowRight,
  Download,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Header1 } from '@/components/headers';
import { Footer } from '@/components/ui/footer';

// 原矿进料记录数据接口
interface RawMaterialFeedingRecord {
  id?: number;
  日期: string;
  班次: '白班' | '夜班';
  进料量: number;
  操作员: string;
  created_at?: string;
  updated_at?: string;
}

// 生产班报数据接口
interface ProductionShiftReport {
  id?: number;
  日期: string;
  班次: '白班' | '夜班';
  '氧化锌原矿-湿重（t）': number | null;
  created_at?: string;
  updated_at?: string;
}

export default function RawMaterialFeedingRecordPage() {
  const router = useRouter();
  
  // 表单状态
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shift, setShift] = useState<'白班' | '夜班'>('白班');
  const [feedingAmount, setFeedingAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 计算器状态
  const [startReading, setStartReading] = useState('');
  const [endReading, setEndReading] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);

  // 历史记录状态
  const [records, setRecords] = useState<ProductionShiftReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<RawMaterialFeedingRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;

  // 排序状态
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 用户状态
  const [user, setUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // 计算进料量
  useEffect(() => {
    const start = parseFloat(startReading) || 0;
    const end = parseFloat(endReading) || 0;
    const result = end - start;
    setCalculatedAmount(result > 0 ? result : 0);
  }, [startReading, endReading]);

  // 一键填入计算结果
  const handleFillCalculatedAmount = () => {
    if (calculatedAmount > 0) {
      setFeedingAmount(calculatedAmount.toFixed(2));
      setCalculatorDialogOpen(false);
      setStartReading('');
      setEndReading('');
      setCalculatedAmount(0);
      toast.success('计算结果已填入进料量');
    } else {
      toast.error('请先输入有效的起始和结束读数');
    }
  };

  // 分页计算函数
  const getPaginatedRecords = (allRecords: ProductionShiftReport[]) => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return allRecords.slice(startIndex, endIndex);
  };

  // 排序切换函数
  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    const sortedRecords = [...records].sort((a, b) => {
      const dateA = new Date(a.日期).getTime();
      const dateB = new Date(b.日期).getTime();
      return sortOrder === 'desc' ? dateA - dateB : dateB - dateA;
    });
    setRecords(sortedRecords);
  };

  // 导出Excel功能
  const exportToExcel = () => {
    // 准备导出数据
    const exportData = records.map(record => ({
      '日期': record.日期,
      '班次': record.班次,
      '氧化锌原矿-湿重（t）': record['氧化锌原矿-湿重（t）'] || '--',
      '创建时间': record.created_at ? format(new Date(record.created_at), 'yyyy-MM-dd HH:mm') : '--'
    }));

    // 创建CSV内容
    const headers = ['日期', '班次', '氧化锌原矿-湿重（t）', '创建时间'];
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `原料投料记录_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('数据导出成功');
  };

  // 刷新数据
  const refreshData = () => {
    fetchRecords();
    toast.success('数据已刷新');
  };

  // 计算总页数
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  // 分页控制函数
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 获取用户信息（复制自机器运行记录页面的成功配置）
  const fetchUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/users?id=${userId}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      router.push('/auth/login');
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

      // 从生产班报-FDX表获取有氧化锌原矿-湿重（t）数据的记录
      const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报-FDX')}?select=*&氧化锌原矿-湿重（t）=not.is.null&order=日期.desc,班次.desc`;

      const response = await fetch(queryUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // 过滤出有效的记录并按日期和班次排序
        const validRecords = (data || []).filter((record: ProductionShiftReport) =>
          record['氧化锌原矿-湿重（t）'] !== null && record['氧化锌原矿-湿重（t）'] !== undefined
        );

        // 设置总记录数
        setTotalRecords(validRecords.length);

        // 设置所有记录（用于分页）
        setRecords(validRecords);
      } else {
        throw new Error('获取记录失败');
      }
    } catch (error) {
      console.error('获取生产班报记录失败:', error);
      toast.error('获取历史记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除记录
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) {
      return;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('原矿进料记录')}?id=eq.${id}`, {
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

        // 如果当前页没有记录了，回到上一页
        const newTotalRecords = totalRecords - 1;
        const newTotalPages = Math.ceil(newTotalRecords / recordsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      toast.error('删除记录失败');
    }
  };

  // 提交记录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('用户信息未加载，请重新登录');
      return;
    }

    if (!feedingAmount || parseFloat(feedingAmount) <= 0) {
      toast.error('请输入有效的进料量');
      return;
    }

    try {
      setIsSubmitting(true);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      // 1. 先保存到原矿进料记录表（保持原有功能）
      const recordData = {
        日期: date,
        班次: shift,
        进料量: parseFloat(feedingAmount),
        操作员: user.姓名 || user.name || '未知用户'
      };

      const recordResponse = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('原矿进料记录')}`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(recordData)
      });

      if (!recordResponse.ok) {
        throw new Error('保存原矿进料记录失败');
      }

      // 2. 更新生产班报-FDX表中的氧化锌原矿-湿重（t）字段
      // 首先检查是否已存在相同日期和班次的记录
      const checkUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报-FDX')}?日期=eq.${date}&班次=eq.${shift}`;

      const checkResponse = await fetch(checkUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!checkResponse.ok) {
        throw new Error('检查生产班报记录失败');
      }

      const existingRecords = await checkResponse.json();

      if (existingRecords && existingRecords.length > 0) {
        // 记录已存在，更新氧化锌原矿-湿重（t）字段
        const updateUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报-FDX')}?日期=eq.${date}&班次=eq.${shift}`;

        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            '氧化锌原矿-湿重（t）': parseFloat(feedingAmount)
          })
        });

        if (!updateResponse.ok) {
          throw new Error('更新生产班报记录失败');
        }

        console.log('✅ [生产班报-FDX] 氧化锌原矿-湿重（t）字段更新成功');
      } else {
        // 记录不存在，创建新记录，仅设置日期、班次和氧化锌原矿-湿重（t）字段
        const createUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报-FDX')}`;

        const createResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            日期: date,
            班次: shift,
            '氧化锌原矿-湿重（t）': parseFloat(feedingAmount)
          })
        });

        if (!createResponse.ok) {
          throw new Error('创建生产班报记录失败');
        }

        console.log('✅ [生产班报-FDX] 新记录创建成功，氧化锌原矿-湿重（t）字段已设置');
      }

      const newRecord = await recordResponse.json();
      console.log('✅ [原矿进料记录] 记录创建成功:', newRecord);

      toast.success('记录提交成功，已同步到生产班报');

      // 重置表单
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setShift('白班');
      setFeedingAmount('');
      setStartReading('');
      setEndReading('');
      setCalculatedAmount(0);

      // 刷新记录列表
      await fetchRecords();

      // 重置到第一页显示新记录
      setCurrentPage(1);
    } catch (error) {
      console.error('提交记录失败:', error);
      toast.error(`提交记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 编辑保存功能
  const handleEditSave = async (updatedRecord: RawMaterialFeedingRecord) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase配置未找到');
      }

      // 直接更新生产班报-FDX表中的氧化锌原矿-湿重（t）字段
      const updateUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报-FDX')}?id=eq.${updatedRecord.id}`;

      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          日期: updatedRecord.日期,
          班次: updatedRecord.班次,
          '氧化锌原矿-湿重（t）': updatedRecord.进料量
        })
      });

      if (!updateResponse.ok) {
        throw new Error('更新生产班报记录失败');
      }

      console.log('✅ [生产班报-FDX] 氧化锌原矿-湿重（t）字段更新成功');

      toast.success('记录更新成功');
      setIsEditDialogOpen(false);
      setEditingRecord(null);
      await fetchRecords();
    } catch (error) {
      console.error('更新记录失败:', error);
      toast.error(`更新记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

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
        title="原矿进料记录"
        subtitle="原矿进料数据记录和管理系统"
        icon={Truck}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 记录提交表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5 text-primary" />
              新增进料记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* 班次选择 */}
              <div className="space-y-3">
                <Label className="flex items-center text-base font-medium">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  班次
                </Label>
                <RadioGroup
                  value={shift}
                  onValueChange={(value: '白班' | '夜班') => setShift(value)}
                  className="grid grid-cols-2 gap-3"
                >
                  {/* 白班选项 */}
                  <Label
                    htmlFor="day-shift"
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                      shift === '白班'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="白班" id="day-shift" />
                      <div className="flex-1">
                        <span className="font-medium text-blue-700 dark:text-blue-400">白班</span>
                        <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">08:00 - 20:00</p>
                      </div>
                    </div>
                    {shift === '白班' && (
                      <Badge variant="secondary" className="absolute top-2 right-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        已选择
                      </Badge>
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
                        <p className="text-sm text-purple-600 dark:text-purple-500 mt-1">20:00 - 08:00</p>
                      </div>
                    </div>
                    {shift === '夜班' && (
                      <Badge variant="secondary" className="absolute top-2 right-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        已选择
                      </Badge>
                    )}
                  </Label>
                </RadioGroup>
              </div>

              {/* 进料量输入框 */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Activity className="mr-2 h-4 w-4 text-primary" />
                  进料量 (吨)
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={feedingAmount}
                    onChange={(e) => setFeedingAmount(e.target.value)}
                    placeholder="请输入进料量或使用计算器"
                    className="flex-1"
                    required
                  />
                  <Dialog open={calculatorDialogOpen} onOpenChange={setCalculatorDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Calculator className="h-5 w-5" />
                          <span>进料量计算器</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="startReading">起始读数 (吨)</Label>
                          <Input
                            id="startReading"
                            type="number"
                            step="0.01"
                            value={startReading}
                            onChange={(e) => setStartReading(e.target.value)}
                            placeholder="请输入起始读数"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endReading">结束读数 (吨)</Label>
                          <Input
                            id="endReading"
                            type="number"
                            step="0.01"
                            value={endReading}
                            onChange={(e) => setEndReading(e.target.value)}
                            placeholder="请输入结束读数"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>计算结果</Label>
                          <div className="p-3 bg-muted rounded-md text-center font-medium">
                            {calculatedAmount.toFixed(2)} 吨
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleFillCalculatedAmount}
                            disabled={calculatedAmount <= 0}
                            className="flex-1"
                          >
                            一键填入
                          </Button>
                          <DialogClose asChild>
                            <Button variant="outline">取消</Button>
                          </DialogClose>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交记录'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 历史记录 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <CardTitle>历史记录</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  className="text-xs"
                >
                  <Download className="h-4 w-4 mr-1" />
                  导出EXCEL
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshData}
                  disabled={isLoading}
                  className="h-8 w-8"
                  title="刷新数据"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <CardDescription>查看和管理氧化锌原矿投料记录</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作</TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={toggleSort}
                        >
                          日期 {sortOrder === 'desc' ? '↓' : '↑'}
                        </TableHead>
                        <TableHead>班次</TableHead>
                        <TableHead>氧化锌原矿-湿重(t)</TableHead>
                        <TableHead>创建时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginatedRecords(records).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // 转换数据格式以适应编辑表单
                                  const editRecord: RawMaterialFeedingRecord = {
                                    id: record.id,
                                    日期: record.日期,
                                    班次: record.班次,
                                    进料量: record['氧化锌原矿-湿重（t）'] || 0,
                                    操作员: '系统记录',
                                    created_at: record.created_at,
                                    updated_at: record.updated_at
                                  };
                                  setEditingRecord(editRecord as any);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{record.日期}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${
                                record.班次 === '白班'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300'
                              }`}
                            >
                              {record.班次}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {record['氧化锌原矿-湿重（t）'] ? record['氧化锌原矿-湿重（t）']!.toFixed(3) : '--'}
                          </TableCell>
                          <TableCell>
                            {record.created_at ? format(new Date(record.created_at), 'yyyy-MM-dd HH:mm') : '--'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控制 */}
                {(() => {
                  const totalPages = Math.ceil(totalRecords / recordsPerPage);

                  if (totalPages <= 1) return null;

                  return (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        共 {totalRecords} 条记录，第 {currentPage} 页，共 {totalPages} 页
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          上一页
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          下一页
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>编辑氧化锌原矿湿重</span>
            </DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <EditRecordForm
              record={editingRecord}
              onSave={handleEditSave}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}

// 编辑记录表单组件
function EditRecordForm({
  record,
  onSave,
  onCancel
}: {
  record: RawMaterialFeedingRecord;
  onSave: (updatedRecord: RawMaterialFeedingRecord) => void;
  onCancel: () => void;
}) {
  const [editFeedingAmount, setEditFeedingAmount] = useState(record.进料量.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFeedingAmount || parseFloat(editFeedingAmount) <= 0) {
      toast.error('请输入有效的氧化锌原矿湿重');
      return;
    }

    setIsUpdating(true);

    const updatedRecord = {
      ...record,
      进料量: parseFloat(editFeedingAmount)
    };

    try {
      onSave(updatedRecord);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 只读信息显示 */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">日期</Label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{record.日期}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">班次</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge
                variant="secondary"
                className={`${
                  record.班次 === '白班'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                }`}
              >
                {record.班次}
              </Badge>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground flex items-center space-x-1">
          <RotateCcw className="h-3 w-3" />
          <span>日期和班次信息为只读，仅可修改氧化锌原矿湿重数值</span>
        </div>
      </div>

      {/* 可编辑的氧化锌原矿湿重字段 */}
      <div className="space-y-2">
        <Label className="flex items-center">
          <Activity className="mr-2 h-4 w-4 text-primary" />
          氧化锌原矿-湿重 (吨)
        </Label>
        <Input
          type="number"
          step="0.001"
          value={editFeedingAmount}
          onChange={(e) => setEditFeedingAmount(e.target.value)}
          placeholder="请输入氧化锌原矿湿重"
          className="font-medium"
          required
        />
        <div className="text-xs text-muted-foreground">
          支持三位小数精度，例如：123.456
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-4 w-4" />
              保存修改
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
