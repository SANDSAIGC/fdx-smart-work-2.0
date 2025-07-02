"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Settings,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Header1 } from '@/components/headers';
import { Footer } from '@/components/ui/footer';

// 机器运行记录数据接口
interface MachineOperationRecord {
  id?: string;
  日期: string;
  时间: string;
  设备状态: '正常运行' | '设备维护';
  情况说明?: string;
  持续时长?: string | null;
  操作员: string;
  创建时间?: string;
}

export default function MachineOperationRecordPage() {
  const router = useRouter();

  // 用户状态
  const [user, setUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  
  // 表单状态
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [deviceStatus, setDeviceStatus] = useState<'正常运行' | '设备维护'>('正常运行');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 历史记录状态
  const [records, setRecords] = useState<MachineOperationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<MachineOperationRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;

  // 分页计算函数
  const getPaginatedRecords = (allRecords: MachineOperationRecord[]) => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return allRecords.slice(startIndex, endIndex);
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

  // 获取用户信息
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

      // 获取所有记录
      const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}?select=*`;
      
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
        const sortedRecords = (data || []).sort((a: MachineOperationRecord, b: MachineOperationRecord) => {
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
      } else {
        throw new Error('获取记录失败');
      }
    } catch (error) {
      console.error('获取机器运行记录失败:', error);
      toast.error('获取历史记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 提交记录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('用户信息未加载，请重新登录');
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
        设备状态: deviceStatus,
        情况说明: description || null,
        持续时长: null, // 持续时长由数据库触发器自动计算
        操作员: user.姓名 || user.name || '未知用户',
        创建时间: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}`, {
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
        console.log('✅ [机器运行记录] 记录创建成功:', newRecord);
        
        toast.success('记录提交成功');
        
        // 重置表单
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setTime(format(new Date(), 'HH:mm'));
        setDeviceStatus('正常运行');
        setDescription('');

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
        title="机器运行记录"
        subtitle="设备运行状态记录和管理系统"
        icon={Settings}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 记录提交表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5 text-primary" />
              新增运行记录
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

              {/* 设备状态选择 - 增强版 */}
              <div className="space-y-3">
                <Label className="flex items-center text-base font-medium">
                  <Settings className="mr-2 h-4 w-4 text-primary" />
                  设备状态
                </Label>
                <RadioGroup 
                  value={deviceStatus} 
                  onValueChange={(value: '正常运行' | '设备维护') => setDeviceStatus(value)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {/* 正常运行选项 */}
                  <Label 
                    htmlFor="normal"
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                      deviceStatus === '正常运行' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50 dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-950/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="正常运行" id="normal" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-green-700 dark:text-green-400">正常运行</span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-500 mt-1">设备运行状态良好</p>
                      </div>
                    </div>
                    {deviceStatus === '正常运行' && (
                      <Badge variant="secondary" className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        已选择
                      </Badge>
                    )}
                  </Label>

                  {/* 设备维护选项 */}
                  <Label 
                    htmlFor="maintenance"
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                      deviceStatus === '设备维护' 
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' 
                        : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50 dark:border-gray-700 dark:hover:border-yellow-600 dark:hover:bg-yellow-950/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="设备维护" id="maintenance" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium text-yellow-700 dark:text-yellow-400">设备维护</span>
                        </div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">设备正在维护保养</p>
                      </div>
                    </div>
                    {deviceStatus === '设备维护' && (
                      <Badge variant="secondary" className="absolute top-2 right-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                        已选择
                      </Badge>
                    )}
                  </Label>
                </RadioGroup>
              </div>

              {/* 情况说明 */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  情况说明
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请描述设备运行情况或维护详情"
                  rows={3}
                  className="resize-none"
                />
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
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-primary" />
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
                      <TableHead>设备状态</TableHead>
                      <TableHead>情况说明</TableHead>
                      <TableHead>持续时长</TableHead>
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
                              onClick={() => {
                                setEditingRecord(record);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('确定要删除这条记录吗？')) {
                                  // 删除逻辑
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{record.日期}</TableCell>
                        <TableCell>{record.时间}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.设备状态 === '正常运行' ? 'default' : 'secondary'}
                            className={`${
                              record.设备状态 === '正常运行' 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}
                          >
                            {record.设备状态 === '正常运行' ? (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 mr-1" />
                            )}
                            <span>{record.设备状态}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={record.情况说明 || '--'}>
                            {record.情况说明 || '--'}
                          </div>
                        </TableCell>
                        <TableCell>{record.持续时长 ?? '--'}</TableCell>
                        <TableCell>{record.操作员}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* 分页控件 */}
                {totalRecords > 0 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      显示第 {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)} - {Math.min(currentPage * recordsPerPage, totalRecords)} 条，共 {totalRecords} 条记录
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        上一页
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {/* 页码按钮 */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNumber)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}
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