"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Bell, BellRing, Check, Clock, AlertTriangle,
  User, Calendar, FileText, Flag, Eye, Trash2, MoreVertical,
  CheckCircle, AlertCircle, Info, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";
import { cn } from "@/lib/utils";

// 通知接口
interface Notification {
  id: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_overdue' | 'system' | 'reminder';
  title: string;
  message: string;
  sender: string;
  recipient: string;
  taskId?: string;
  taskTitle?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
  readAt?: string;
  actionRequired: boolean;
  actionUrl?: string;
  category: string;
  attachments?: string[];
}

// 通知统计接口
interface NotificationStats {
  total: number;
  unread: number;
  important: number;
  actionRequired: number;
  taskRelated: number;
  systemNotifications: number;
}

export default function TaskNotificationPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    const generateMockNotifications = (): Notification[] => {
      const data: Notification[] = [];
      const types: ('task_assigned' | 'task_updated' | 'task_completed' | 'task_overdue' | 'system' | 'reminder')[] = 
        ['task_assigned', 'task_updated', 'task_completed', 'task_overdue', 'system', 'reminder'];
      const senders = ['张经理', '李主任', '王总监', '赵班长', '系统管理员'];
      const priorities: ('urgent' | 'high' | 'medium' | 'low')[] = ['urgent', 'high', 'medium', 'low'];
      const categories = ['任务分配', '任务更新', '任务完成', '系统通知', '提醒事项', '逾期警告'];

      const notificationTemplates = {
        task_assigned: {
          title: '新任务分配',
          message: '您有一个新的任务需要处理',
          category: '任务分配'
        },
        task_updated: {
          title: '任务状态更新',
          message: '您的任务状态已更新',
          category: '任务更新'
        },
        task_completed: {
          title: '任务完成确认',
          message: '任务已完成，请确认',
          category: '任务完成'
        },
        task_overdue: {
          title: '任务逾期提醒',
          message: '您有任务已逾期，请及时处理',
          category: '逾期警告'
        },
        system: {
          title: '系统通知',
          message: '系统维护通知',
          category: '系统通知'
        },
        reminder: {
          title: '工作提醒',
          message: '请及时完成相关工作',
          category: '提醒事项'
        }
      };

      for (let i = 0; i < 30; i++) {
        const createdTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const type = types[Math.floor(Math.random() * types.length)];
        const template = notificationTemplates[type];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const isRead = Math.random() > 0.4;
        const isImportant = Math.random() > 0.7;
        const actionRequired = ['task_assigned', 'task_overdue', 'reminder'].includes(type) && Math.random() > 0.5;

        data.push({
          id: `NOTIF${createdTime.getFullYear()}${String(createdTime.getMonth() + 1).padStart(2, '0')}-${String(i % 100).padStart(3, '0')}`,
          type,
          title: template.title,
          message: `${template.message} - ${type === 'task_assigned' ? '设备维护任务' : type === 'task_updated' ? '质量检查任务' : type === 'task_completed' ? '安全巡检任务' : type === 'task_overdue' ? '数据录入任务' : '系统相关'}`,
          sender: type === 'system' ? '系统管理员' : senders[Math.floor(Math.random() * (senders.length - 1))],
          recipient: '当前用户',
          taskId: ['task_assigned', 'task_updated', 'task_completed', 'task_overdue'].includes(type) ? 
            `T-${createdTime.getFullYear()}${String(createdTime.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}` : undefined,
          taskTitle: ['task_assigned', 'task_updated', 'task_completed', 'task_overdue'].includes(type) ? 
            `${['设备维护', '质量检查', '安全巡检', '数据录入'][Math.floor(Math.random() * 4)]}任务` : undefined,
          priority,
          isRead,
          isImportant,
          createdAt: createdTime.toISOString(),
          readAt: isRead ? new Date(createdTime.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined,
          actionRequired,
          actionUrl: actionRequired ? '/task-assignment' : undefined,
          category: template.category,
          attachments: Math.random() > 0.8 ? ['任务详情.pdf'] : undefined
        });
      }
      
      return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const mockNotifications = generateMockNotifications();
    setNotifications(mockNotifications);

    // 计算统计数据
    const total = mockNotifications.length;
    const unread = mockNotifications.filter(n => !n.isRead).length;
    const important = mockNotifications.filter(n => n.isImportant).length;
    const actionRequired = mockNotifications.filter(n => n.actionRequired).length;
    const taskRelated = mockNotifications.filter(n => n.taskId).length;
    const systemNotifications = mockNotifications.filter(n => n.type === 'system').length;

    setStats({
      total,
      unread,
      important,
      actionRequired,
      taskRelated,
      systemNotifications
    });

    setLoading(false);
  }, []);

  // 筛选通知
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'important':
        return notifications.filter(n => n.isImportant);
      case 'action':
        return notifications.filter(n => n.actionRequired);
      case 'task':
        return notifications.filter(n => n.taskId);
      case 'system':
        return notifications.filter(n => n.type === 'system');
      default:
        return notifications;
    }
  };

  // 标记为已读
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    ));
  };

  // 标记全部为已读
  const markAllAsRead = () => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt || now })));
  };

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 获取通知类型图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <Bell className="h-4 w-4 text-blue-500" />;
      case 'task_updated': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'task_completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'task_overdue': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'system': return <AlertCircle className="h-4 w-4 text-purple-500" />;
      case 'reminder': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  // 获取相对时间
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return `${Math.floor(diffInMinutes / 1440)}天前`;
  };

  const filteredNotifications = getFilteredNotifications();

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
            <h1 className="text-lg font-semibold">任务通知</h1>
            {stats && stats.unread > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 cursor-pointer hover:bg-red-600"
                onClick={() => {
                  if (window.confirm('确定要将所有通知标记为已读吗？')) {
                    markAllAsRead();
                  }
                }}
                title="点击标记全部为已读"
              >
                {stats.unread}
              </Badge>
            )}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">总通知</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BellRing className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">未读</p>
                    <p className="text-lg font-bold">{stats.unread}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Flag className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">重要</p>
                    <p className="text-lg font-bold">{stats.important}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">需处理</p>
                    <p className="text-lg font-bold">{stats.actionRequired}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">任务相关</p>
                    <p className="text-lg font-bold">{stats.taskRelated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">系统通知</p>
                    <p className="text-lg font-bold">{stats.systemNotifications}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="unread">未读</TabsTrigger>
            <TabsTrigger value="important">重要</TabsTrigger>
            <TabsTrigger value="action">需处理</TabsTrigger>
            <TabsTrigger value="task">任务</TabsTrigger>
            <TabsTrigger value="system">系统</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无通知</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={cn(
                      "border-l-4 transition-all hover:shadow-md",
                      getPriorityColor(notification.priority),
                      !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className={cn(
                                "text-sm font-medium truncate",
                                !notification.isRead && "font-semibold"
                              )}>
                                {notification.title}
                              </h3>
                              {notification.isImportant && (
                                <Flag className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            {notification.taskTitle && (
                              <div className="flex items-center space-x-1 mb-2">
                                <FileText className="h-3 w-3 text-blue-500" />
                                <span className="text-xs text-blue-600">
                                  任务: {notification.taskTitle}
                                </span>
                                {notification.taskId && (
                                  <span className="text-xs text-muted-foreground">
                                    ({notification.taskId})
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <User className="h-4 w-4" />
                                  <span>{notification.sender}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{getRelativeTime(notification.createdAt)}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                              </div>
                              
                              {notification.actionRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  需要处理
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {notification.actionUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(notification.actionUrl!)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
