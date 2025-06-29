"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, AlertTriangle, CheckCircle, Clock, Eye,
  TrendingUp, BarChart3, Users, MapPin, Calendar,
  RefreshCw, Search, Filter, Plus, MessageSquare, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 情况报告接口
interface SituationReport {
  id: string;
  reportNumber: string;
  title: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  reporter: string;
  reportTime: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  assignee?: string;
  priority: number; // 1-5, 5最高
  estimatedResolution?: string;
  actualResolution?: string;
  resolutionNotes?: string;
  attachments?: string[];
  followUpRequired: boolean;
}

// 情况统计接口
interface SituationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  criticalReports: number;
  avgResolutionTime: number;
  resolutionRate: number;
}

export default function SituationManagementPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SituationReport[]>([]);
  const [stats, setStats] = useState<SituationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 模拟数据加载
  useEffect(() => {
    const generateMockReports = (): SituationReport[] => {
      const data: SituationReport[] = [];
      const categories = ['安全事故', '设备故障', '质量问题', '环境异常', '人员事件'];
      const locations = ['浮选车间', '压滤车间', '化验室', '办公楼', '仓库'];
      const reporters = ['张安全员', '李操作员', '王技术员', '赵班长', '陈主管'];
      const assignees = ['刘经理', '周主任', '吴工程师', '徐技术员'];
      const severities: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];
      const statuses: ('pending' | 'investigating' | 'resolved' | 'closed')[] = ['pending', 'investigating', 'resolved', 'closed'];
      
      for (let i = 0; i < 60; i++) {
        const reportTime = new Date(Date.now() - i * 8 * 60 * 60 * 1000); // 每8小时一个报告
        const category = categories[Math.floor(Math.random() * categories.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        // 根据严重程度设置优先级
        const priority = severity === 'critical' ? 5 : 
                        severity === 'high' ? 4 : 
                        severity === 'medium' ? 3 : 
                        Math.floor(Math.random() * 2) + 1;
        
        // 生成描述
        const descriptions = {
          '安全事故': '发生轻微安全事故，需要立即处理和调查',
          '设备故障': '设备出现异常运行状态，影响正常生产',
          '质量问题': '产品质量检测发现异常，需要分析原因',
          '环境异常': '工作环境出现异常情况，需要及时处理',
          '人员事件': '人员相关事件，需要妥善处理'
        };
        
        const estimatedDays = severity === 'critical' ? 1 : 
                             severity === 'high' ? 3 : 
                             severity === 'medium' ? 7 : 14;
        
        const estimatedResolution = new Date(reportTime.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
        
        data.push({
          id: `SIT${reportTime.getFullYear()}${String(reportTime.getMonth() + 1).padStart(2, '0')}${String(reportTime.getDate()).padStart(2, '0')}-${String(i % 100).padStart(3, '0')}`,
          reportNumber: `SR-${reportTime.getFullYear()}${String(reportTime.getMonth() + 1).padStart(2, '0')}-${String(i % 100 + 1).padStart(3, '0')}`,
          title: `${location}${category}`,
          category,
          severity,
          location,
          reporter: reporters[Math.floor(Math.random() * reporters.length)],
          reportTime: reportTime.toISOString(),
          description: descriptions[category as keyof typeof descriptions],
          status,
          assignee: ['investigating', 'resolved', 'closed'].includes(status) ? assignees[Math.floor(Math.random() * assignees.length)] : undefined,
          priority,
          estimatedResolution: estimatedResolution.toISOString().split('T')[0],
          actualResolution: ['resolved', 'closed'].includes(status) ? 
            new Date(reportTime.getTime() + Math.random() * estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
          resolutionNotes: ['resolved', 'closed'].includes(status) ? '问题已得到妥善处理，采取了相应的预防措施' : undefined,
          attachments: Math.random() > 0.7 ? ['照片1.jpg', '报告.pdf'] : undefined,
          followUpRequired: Math.random() > 0.6
        });
      }
      
      return data.sort((a, b) => new Date(b.reportTime).getTime() - new Date(a.reportTime).getTime());
    };

    const mockReports = generateMockReports();
    setReports(mockReports);

    // 计算统计数据
    const pendingReports = mockReports.filter(r => ['pending', 'investigating'].includes(r.status));
    const resolvedReports = mockReports.filter(r => ['resolved', 'closed'].includes(r.status));
    const criticalReports = mockReports.filter(r => r.severity === 'critical');
    
    // 计算平均解决时间（天）
    const resolvedWithTime = resolvedReports.filter(r => r.actualResolution);
    const avgResolutionTime = resolvedWithTime.length > 0 ? 
      resolvedWithTime.reduce((sum, r) => {
        const reportDate = new Date(r.reportTime);
        const resolutionDate = new Date(r.actualResolution!);
        return sum + (resolutionDate.getTime() - reportDate.getTime()) / (24 * 60 * 60 * 1000);
      }, 0) / resolvedWithTime.length : 0;
    
    const resolutionRate = mockReports.length > 0 ? (resolvedReports.length / mockReports.length) * 100 : 0;
    
    setStats({
      totalReports: mockReports.length,
      pendingReports: pendingReports.length,
      resolvedReports: resolvedReports.length,
      criticalReports: criticalReports.length,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      resolutionRate: Math.round(resolutionRate * 100) / 100
    });
  }, []);

  // 过滤数据
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === "" || 
      report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "" || report.status === selectedStatus;
    const matchesSeverity = selectedSeverity === "" || report.severity === selectedSeverity;
    const matchesCategory = selectedCategory === "" || report.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesSeverity && matchesCategory;
  });

  // 刷新数据
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-500';
      case 'closed': return 'text-blue-500';
      case 'investigating': return 'text-yellow-500';
      case 'pending': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved': return '已解决';
      case 'closed': return '已关闭';
      case 'investigating': return '调查中';
      case 'pending': return '待处理';
      default: return '未知';
    }
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 获取严重程度文本
  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return '严重';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  // 获取优先级星级
  const getPriorityStars = (priority: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < priority ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // 获取类别列表
  const categories = Array.from(new Set(reports.map(report => report.category)));

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
            <h1 className="text-lg font-semibold">情况管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 功能按钮区域 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">情况管理</h2>
            <p className="text-sm text-muted-foreground">管理和跟踪各类情况报告</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              新建报告
            </Button>
          </div>
        </div>

        {/* 情况统计概览 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总报告数</p>
                    <p className="text-2xl font-bold">{stats.totalReports}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">待处理</p>
                    <p className="text-2xl font-bold text-red-500">{stats.pendingReports}</p>
                  </div>
                  <Clock className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">已解决</p>
                    <p className="text-2xl font-bold text-green-500">{stats.resolvedReports}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">严重事件</p>
                    <p className="text-2xl font-bold text-red-600">{stats.criticalReports}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">平均解决</p>
                    <p className="text-2xl font-bold">{stats.avgResolutionTime}</p>
                    <p className="text-xs text-muted-foreground">天</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">解决率</p>
                    <p className="text-2xl font-bold">{stats.resolutionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-cyan-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 数据筛选 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              报告筛选
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">搜索</Label>
                <Input
                  id="search"
                  placeholder="报告号/标题/报告人/地点"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">处理状态</Label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="investigating">调查中</option>
                  <option value="resolved">已解决</option>
                  <option value="closed">已关闭</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">严重程度</Label>
                <select
                  id="severity"
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">全部程度</option>
                  <option value="critical">严重</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">事件类别</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">全部类别</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("");
                    setSelectedSeverity("");
                    setSelectedCategory("");
                  }}
                  className="w-full"
                >
                  清除筛选
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 情况报告表格 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                情况报告列表
              </span>
              <Badge variant="secondary">
                共 {filteredReports.length} 条记录
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>报告号</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>严重程度</TableHead>
                    <TableHead>地点</TableHead>
                    <TableHead>报告人</TableHead>
                    <TableHead>报告时间</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>负责人</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.slice(0, 15).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.reportNumber}</TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={report.title}>
                          {report.title}
                        </div>
                      </TableCell>
                      <TableCell>{report.category}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(report.severity)}>
                          {getSeverityText(report.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span>{report.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{report.reporter}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(report.reportTime).toLocaleString()}</TableCell>
                      <TableCell>
                        <div title={`优先级: ${report.priority}/5`}>
                          {getPriorityStars(report.priority)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getStatusColor(report.status)}>
                          {getStatusText(report.status)}
                        </span>
                      </TableCell>
                      <TableCell>{report.assignee || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredReports.length > 15 && (
              <div className="mt-4 text-center">
                <Button variant="outline">
                  加载更多数据
                </Button>
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
