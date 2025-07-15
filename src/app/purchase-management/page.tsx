"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, FileText, Calendar, DollarSign,
  CheckCircle, Clock, AlertTriangle, User, Send,
  RefreshCw, Search, Filter, Edit, Trash2, Eye,
  Download, Upload, BarChart3, TrendingUp, Package,
  Zap, Users, ShoppingBag, Check, ArrowUp, ArrowDown,
  X, Bell, ShoppingCart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";
import { PurchaseRequest, PurchaseStatus, PurchaseRequestFilter } from "@/types/purchase";
import { format } from "date-fns";

// 采购申请统计接口
interface PurchaseStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  completedRequests: number;
  totalAmount: number;
  avgProcessingTime: number;
}

// 定义排序类型
type SortField = 'itemName' | 'quantity' | 'applicant' | 'requestDate';
type SortDirection = 'asc' | 'desc';

export default function PurchaseManagementPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [filter, setFilter] = useState<PurchaseRequestFilter>({
    searchTerm: "",
    status: "",
    dateRange: {},
    applicant: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // 新增状态管理
  const [activeTab, setActiveTab] = useState("pending");
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [sortField, setSortField] = useState<SortField>('requestDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 加载采购申请数据
  const loadPurchaseRequests = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filter.searchTerm) queryParams.append('search', filter.searchTerm);
      if (filter.status && filter.status !== 'all') queryParams.append('status', filter.status);
      if (filter.applicant && filter.applicant !== 'all') queryParams.append('applicant', filter.applicant);

      const response = await fetch(`/api/purchase-requests?${queryParams.toString()}`);
      const result = await response.json();

      if (result.success) {
        setRequests(result.data);
        calculateStats(result.data);
      } else {
        console.error('加载数据失败:', result.error);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 计算统计数据
  const calculateStats = (data: PurchaseRequest[]) => {
    const pendingRequests = data.filter(r => r.status === PurchaseStatus.PENDING);
    const approvedRequests = data.filter(r => r.status === PurchaseStatus.APPROVED);
    const rejectedRequests = data.filter(r => r.status === PurchaseStatus.REJECTED);
    const completedRequests = data.filter(r => r.status === PurchaseStatus.COMPLETED);

    setStats({
      totalRequests: data.length,
      pendingRequests: pendingRequests.length,
      approvedRequests: approvedRequests.length,
      rejectedRequests: rejectedRequests.length,
      completedRequests: completedRequests.length,
      totalAmount: data.reduce((sum, r) => sum + (r.quantity * 100), 0), // 假设单价100元
      avgProcessingTime: 3.5 // 假设平均处理时间
    });
  };

  // 初始加载数据
  useEffect(() => {
    loadPurchaseRequests();
  }, [filter]);

  // 更新申请状态
  const updateRequestStatus = async (id: number, status: string) => {
    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();
      if (result.success) {
        loadPurchaseRequests(); // 重新加载数据
      } else {
        console.error('更新状态失败:', result.error);
      }
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  // 删除申请
  const deleteRequest = async (id: number) => {
    if (!confirm('确定要删除这个采购申请吗？')) return;

    try {
      const response = await fetch(`/api/purchase-requests?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        loadPurchaseRequests(); // 重新加载数据
      } else {
        console.error('删除失败:', result.error);
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 新增功能函数
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // 根据选项卡过滤请求
  const filteredRequests = requests.filter(request => {
    if (activeTab === "pending") return request.status === PurchaseStatus.PENDING;
    if (activeTab === "approved") return request.status === PurchaseStatus.APPROVED;
    if (activeTab === "completed") return request.status === PurchaseStatus.COMPLETED;
    return true;
  });

  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 排序数据
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'itemName':
        comparison = a.itemName.localeCompare(b.itemName);
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'applicant':
        comparison = a.applicant.localeCompare(b.applicant);
        break;
      case 'requestDate':
        comparison = a.requestDate.localeCompare(b.requestDate);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // 获取状态对应的图标和颜色
  const getStatusIcon = (status: string) => {
    switch(status) {
      case PurchaseStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case PurchaseStatus.APPROVED:
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case PurchaseStatus.COMPLETED:
        return <Check className="h-4 w-4 text-green-500" />;
      case PurchaseStatus.REJECTED:
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // 显示排序指示器
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ArrowUp className="inline h-4 w-4" /> :
      <ArrowDown className="inline h-4 w-4" />;
  };

  // 显示详情对话框
  const showRequestDetails = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  // 导出数据
  const exportData = () => {
    const csvContent = [
      ['ID', '日期', '申请者', '品名', '数量', '用途', '期望完成日期', '状态'],
      ...requests.map(r => [
        r.id,
        r.date,
        r.applicant,
        r.itemName,
        r.quantity,
        r.purpose,
        r.expectedDate || '',
        r.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `采购申请_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case PurchaseStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case PurchaseStatus.APPROVED: return 'bg-green-100 text-green-800';
      case PurchaseStatus.REJECTED: return 'bg-red-100 text-red-800';
      case PurchaseStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case PurchaseStatus.COMPLETED: return 'bg-purple-100 text-purple-800';
      case PurchaseStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取申请者列表
  const applicants = Array.from(new Set(requests.map(r => r.applicant).filter(a => a)));

  const updateFilter = (key: keyof PurchaseRequestFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - 标准化布局 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">采购管理</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* 页面标题和欢迎信息 */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold">采购管理中心</h1>
          <p className="text-muted-foreground">统一管理和跟踪所有采购申请的状态和进度</p>
        </div>

        {/* 视图模式选择 */}
        <div className="flex justify-center">
          <RadioGroup
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'card' | 'list')}
            className="flex"
          >
            <div className="flex items-center space-x-2 mr-4">
              <RadioGroupItem value="card" id="card-mode" />
              <label htmlFor="card-mode" className="text-sm font-medium leading-none cursor-pointer">
                卡片模式
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="list" id="list-mode" />
              <label htmlFor="list-mode" className="text-sm font-medium leading-none cursor-pointer">
                清单模式
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* 选项卡导航 */}
        <div className="flex justify-center">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">申请中</TabsTrigger>
              <TabsTrigger value="approved">已批准</TabsTrigger>
              <TabsTrigger value="completed">已完成</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {/* 排序控制 */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('itemName')}
            className="flex items-center space-x-1"
          >
            <span>产品名称</span>
            {getSortIndicator('itemName')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('quantity')}
            className="flex items-center space-x-1"
          >
            <span>数量</span>
            {getSortIndicator('quantity')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('applicant')}
            className="flex items-center space-x-1"
          >
            <span>申请者</span>
            {getSortIndicator('applicant')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('requestDate')}
            className="flex items-center space-x-1"
          >
            <span>申请日期</span>
            {getSortIndicator('requestDate')}
          </Button>
        </div>

        {/* 采购申请内容显示 */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无采购申请</h3>
              <p className="text-muted-foreground mb-4">当前选项卡下没有找到任何采购申请</p>
              <Button onClick={() => router.push('/purchase-request')}>
                <Plus className="h-4 w-4 mr-2" />
                创建新申请
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{request.itemName}</CardTitle>
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            {getStatusIcon(request.status)}
                            <span>{request.status}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">申请者</p>
                            <p className="font-medium">{request.applicant}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">数量</p>
                            <p className="font-medium">{request.quantity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">申请日期</p>
                            <p className="font-medium">{format(new Date(request.requestDate), 'yyyy-MM-dd')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">用途</p>
                            <p className="font-medium truncate">{request.purpose}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showRequestDetails(request)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            详情
                          </Button>
                          {request.status === PurchaseStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, PurchaseStatus.APPROVED)}
                                className="flex-1"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                批准
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateRequestStatus(request.id, PurchaseStatus.REJECTED)}
                                className="flex-1"
                              >
                                <X className="h-4 w-4 mr-1" />
                                拒绝
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>采购申请列表</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {sortedRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{request.itemName}</h4>
                                <Badge variant="secondary" className="flex items-center space-x-1">
                                  {getStatusIcon(request.status)}
                                  <span>{request.status}</span>
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                申请者: {request.applicant} | 数量: {request.quantity} | 日期: {format(new Date(request.requestDate), 'yyyy-MM-dd')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                用途: {request.purpose}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => showRequestDetails(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {request.status === PurchaseStatus.PENDING && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateRequestStatus(request.id, PurchaseStatus.APPROVED)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateRequestStatus(request.id, PurchaseStatus.REJECTED)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* 详情对话框 */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>采购申请详情</DialogTitle>
              <DialogClose />
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>申请ID</Label>
                    <p className="font-medium">{selectedRequest.id}</p>
                  </div>
                  <div>
                    <Label>申请日期</Label>
                    <p className="font-medium">{format(new Date(selectedRequest.requestDate), 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <Label>申请者</Label>
                    <p className="font-medium">{selectedRequest.applicant}</p>
                  </div>
                  <div>
                    <Label>产品名称</Label>
                    <p className="font-medium">{selectedRequest.itemName}</p>
                  </div>
                  <div>
                    <Label>数量</Label>
                    <p className="font-medium">{selectedRequest.quantity}</p>
                  </div>
                  <div>
                    <Label>状态</Label>
                    <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
                      {getStatusIcon(selectedRequest.status)}
                      <span>{selectedRequest.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>用途说明</Label>
                  <p className="font-medium">{selectedRequest.purpose}</p>
                </div>
                {selectedRequest.status === PurchaseStatus.PENDING && (
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => {
                        updateRequestStatus(selectedRequest.id, PurchaseStatus.APPROVED);
                        setShowDetailDialog(false);
                      }}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      批准申请
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateRequestStatus(selectedRequest.id, PurchaseStatus.REJECTED);
                        setShowDetailDialog(false);
                      }}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      拒绝申请
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}