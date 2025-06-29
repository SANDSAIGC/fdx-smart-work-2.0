"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ClipboardList, Plus, Search, Filter, Users, 
  Calendar, Clock, Flag, CheckCircle, AlertCircle, User,
  Target, FileText, Edit, Trash2, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 任务接口
interface Task {
  id: string;
  taskNumber: string;
  title: string;
  description: string;
  category: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignee?: string;
  assigner: string;
  createDate: string;
  dueDate: string;
  completedDate?: string;
  estimatedHours: number;
  actualHours?: number;
  department: string;
  location: string;
  progress: number;
  attachments?: string[];
  comments?: string;
}

// 任务统计接口
interface TaskStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
}

export default function TaskAssignmentPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [loading, setLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    const generateMockTasks = (): Task[] => {
      const data: Task[] = [];
      const categories = ['设备维护', '质量检查', '安全巡检', '生产调度', '数据录入', '培训任务'];
      const departments = ['生产部', '技术部', '质检部', '安全部', '维修部'];
      const locations = ['浮选车间', '压滤车间', '化验室', '办公楼', '仓库', '配电房'];
      const assigners = ['张经理', '李主任', '王总监', '赵班长'];
      const assignees = ['刘工程师', '周技术员', '吴操作员', '徐维修工', '陈质检员', '孙安全员'];
      const priorities: ('urgent' | 'high' | 'medium' | 'low')[] = ['urgent', 'high', 'medium', 'low'];
      const statuses: ('pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled')[] = 
        ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];

      for (let i = 0; i < 50; i++) {
        const createTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const dueTime = new Date(createTime.getTime() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const estimatedHours = Math.floor(Math.random() * 16) + 1;
        const progress = status === 'completed' ? 100 : 
                        status === 'in_progress' ? Math.floor(Math.random() * 80) + 10 :
                        status === 'assigned' ? Math.floor(Math.random() * 20) : 0;

        data.push({
          id: `TASK${createTime.getFullYear()}${String(createTime.getMonth() + 1).padStart(2, '0')}-${String(i % 100).padStart(3, '0')}`,
          taskNumber: `T-${createTime.getFullYear()}${String(createTime.getMonth() + 1).padStart(2, '0')}-${String(i % 100 + 1).padStart(3, '0')}`,
          title: `${category}任务${i + 1}`,
          description: `${category}相关的具体工作内容，需要按照标准操作程序执行`,
          category,
          priority,
          status,
          assignee: ['assigned', 'in_progress', 'completed'].includes(status) ? 
            assignees[Math.floor(Math.random() * assignees.length)] : undefined,
          assigner: assigners[Math.floor(Math.random() * assigners.length)],
          createDate: createTime.toISOString(),
          dueDate: dueTime.toISOString(),
          completedDate: status === 'completed' ? 
            new Date(createTime.getTime() + Math.random() * (dueTime.getTime() - createTime.getTime())).toISOString() : undefined,
          estimatedHours,
          actualHours: status === 'completed' ? Math.floor(estimatedHours * (0.8 + Math.random() * 0.4)) : undefined,
          department: departments[Math.floor(Math.random() * departments.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          progress,
          attachments: Math.random() > 0.7 ? ['任务说明.pdf', '操作手册.doc'] : undefined,
          comments: Math.random() > 0.6 ? '任务执行过程中需要注意安全操作规程' : undefined
        });
      }
      
      return data.sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime());
    };

    const mockTasks = generateMockTasks();
    setTasks(mockTasks);

    // 计算统计数据
    const total = mockTasks.length;
    const pending = mockTasks.filter(t => t.status === 'pending').length;
    const assigned = mockTasks.filter(t => t.status === 'assigned').length;
    const inProgress = mockTasks.filter(t => t.status === 'in_progress').length;
    const completed = mockTasks.filter(t => t.status === 'completed').length;
    const cancelled = mockTasks.filter(t => t.status === 'cancelled').length;
    const overdue = mockTasks.filter(t => 
      new Date(t.dueDate) < new Date() && !['completed', 'cancelled'].includes(t.status)
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({
      total,
      pending,
      assigned,
      inProgress,
      completed,
      cancelled,
      overdue,
      completionRate
    });

    setLoading(false);
  }, []);

  // 筛选任务
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === "" || 
      task.taskNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigner.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "" || task.status === selectedStatus;
    const matchesPriority = selectedPriority === "" || task.priority === selectedPriority;
    const matchesAssignee = selectedAssignee === "" || task.assignee === selectedAssignee;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待分配';
      case 'assigned': return '已分配';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return '紧急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-lg font-semibold">任务分配</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">总任务</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">待分配</p>
                    <p className="text-lg font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">已分配</p>
                    <p className="text-lg font-bold">{stats.assigned}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">进行中</p>
                    <p className="text-lg font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">已完成</p>
                    <p className="text-lg font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">已取消</p>
                    <p className="text-lg font-bold">{stats.cancelled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Flag className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">逾期</p>
                    <p className="text-lg font-bold">{stats.overdue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
                  <div>
                    <p className="text-xs text-muted-foreground">完成率</p>
                    <p className="text-lg font-bold">{stats.completionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">任务列表</TabsTrigger>
            <TabsTrigger value="create">创建任务</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* 数据筛选 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  任务筛选
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">搜索</Label>
                    <Input
                      id="search"
                      placeholder="任务号/标题/执行人/分配人"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">任务状态</Label>
                    <select
                      id="status"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">全部状态</option>
                      <option value="pending">待分配</option>
                      <option value="assigned">已分配</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">优先级</Label>
                    <select
                      id="priority"
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">全部优先级</option>
                      <option value="urgent">紧急</option>
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignee">执行人</Label>
                    <select
                      id="assignee"
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">全部执行人</option>
                      <option value="刘工程师">刘工程师</option>
                      <option value="周技术员">周技术员</option>
                      <option value="吴操作员">吴操作员</option>
                      <option value="徐维修工">徐维修工</option>
                      <option value="陈质检员">陈质检员</option>
                      <option value="孙安全员">孙安全员</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 任务表格 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    任务列表
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      共 {filteredTasks.length} 条记录
                    </Badge>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      新建任务
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>任务号</TableHead>
                        <TableHead>任务标题</TableHead>
                        <TableHead>类别</TableHead>
                        <TableHead>优先级</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>执行人</TableHead>
                        <TableHead>分配人</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>截止时间</TableHead>
                        <TableHead>进度</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.slice(0, 15).map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.taskNumber}</TableCell>
                          <TableCell>
                            <div className="max-w-32 truncate" title={task.title}>
                              {task.title}
                            </div>
                          </TableCell>
                          <TableCell>{task.category}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityText(task.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusText(task.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.assignee ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{task.assignee}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">未分配</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{task.assigner}</span>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(task.createDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className={new Date(task.dueDate) < new Date() && !['completed', 'cancelled'].includes(task.status) ? 'text-red-600' : ''}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={task.progress} className="w-16" />
                              <span className="text-xs">{task.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  创建新任务
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">任务创建功能开发中...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
