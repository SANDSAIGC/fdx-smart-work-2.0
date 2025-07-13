"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Bell, CalendarCheck, User, ArrowLeft,
  ClipboardList, Users, Table, Flag,
  Gauge, Percent, TrendingUp, BarChart3,
  Package, DollarSign, Activity, Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 类型定义
interface ManagementModule {
  icon: React.ReactNode;
  label: string;
  path: string;
  description: string;
  status?: "active" | "pending" | "completed";
}

interface ProductionMetric {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
}

export default function ManagerPage() {
  const router = useRouter();
  
  // 状态管理
  const [productionProgress, setProductionProgress] = useState(65);
  const [isLoading, setIsLoading] = useState(false);
  
  // 管理模块配置
  const managementModules: ManagementModule[] = [
    {
      icon: <Flag className="w-6 h-6 text-red-500" />,
      label: "情况处理",
      path: "/situation-management",
      description: "处理生产异常情况",
      status: "active"
    },
    {
      icon: <ClipboardList className="w-6 h-6 text-blue-500" />,
      label: "任务指派",
      path: "/task-assignment", 
      description: "分配和管理任务",
      status: "pending"
    },
    {
      icon: <Users className="w-6 h-6 text-green-500" />,
      label: "考勤管理",
      path: "/attendance-management",
      description: "员工考勤统计",
      status: "completed"
    },
    {
      icon: <Table className="w-6 h-6 text-purple-500" />,
      label: "数据表格",
      path: "/data-table-center",
      description: "查看数据报表",
      status: "active"
    }
  ];

  // 生产指标数据
  const productionMetrics: ProductionMetric[] = [
    {
      title: "今日产量",
      value: "1,245 吨",
      change: "+12.5%",
      trend: "up",
      icon: <Package className="h-4 w-4" />
    },
    {
      title: "设备效率",
      value: "87.3%",
      change: "+2.1%", 
      trend: "up",
      icon: <Activity className="h-4 w-4" />
    },
    {
      title: "质量合格率",
      value: "98.7%",
      change: "-0.3%",
      trend: "down", 
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      title: "成本控制",
      value: "¥2.3万",
      change: "+5.2%",
      trend: "up",
      icon: <DollarSign className="h-4 w-4" />
    }
  ];

  // 获取状态颜色
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  // 获取趋势颜色
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      case "stable": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  // 处理模块点击
  const handleModuleClick = (path: string) => {
    setIsLoading(true);
    // 模拟加载
    setTimeout(() => {
      router.push(path);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    // 模拟数据更新
    const interval = setInterval(() => {
      setProductionProgress(prev => {
        const newValue = prev + Math.random() * 2 - 1; // 随机波动
        return Math.max(0, Math.min(100, newValue));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
              <User className="h-6 w-6 sm:h-8 sm:w-8" />
              经理工作台
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              实时数据系统 · 智能管理平台
            </p>
          </div>
        </div>

        {/* 生产指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {productionMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                {metric.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs ${getTrendColor(metric.trend)}`}>
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  {metric.change} 较昨日
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 生产进度 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-purple-500" />
              今日生产完成率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">当前进度</span>
                <span className="text-2xl font-bold text-purple-600">
                  {productionProgress.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={productionProgress} 
                className="h-3"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>目标: 90%</span>
                <span>状态: 进行中</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProductionProgress(prev => Math.min(prev + 5, 100))}
                >
                  +5%
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setProductionProgress(prev => Math.max(prev - 5, 0))}
                >
                  -5%
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 管理功能模块 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>管理功能</CardTitle>
            <p className="text-sm text-muted-foreground">点击选择管理模块</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {managementModules.map((module, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 relative"
                  onClick={() => handleModuleClick(module.path)}
                  disabled={isLoading}
                >
                  {module.status && (
                    <Badge
                      className={`absolute top-2 right-2 w-2 h-2 p-0 ${getStatusColor(module.status)}`}
                    />
                  )}
                  {module.icon}
                  <div className="text-center">
                    <div className="font-medium text-sm">{module.label}</div>
                    <div className="text-xs text-muted-foreground">{module.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 进销存管理 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              进销存管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">实时库存监控</h3>
                <p className="text-sm text-muted-foreground">查看物料和产品库存状态</p>
              </div>
              <Button onClick={() => router.push("/inventory-management")}>
                查看详情
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="flex justify-around items-center p-4">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2">
            <FileText className="w-5 h-5" />
            <span className="text-xs">情况上报</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2">
            <Bell className="w-5 h-5" />
            <span className="text-xs">任务通知</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center space-y-1 h-auto py-2">
            <CalendarCheck className="w-5 h-5" />
            <span className="text-xs">考勤打卡</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => router.push("/account-management")}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">账号管理</span>
          </Button>
        </div>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
