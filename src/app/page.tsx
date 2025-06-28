"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/ui/footer";
import {
  CheckCircle,
  XCircle,
  Database,
  Factory,
  FlaskConical,
  Rocket,
  Users,
  ClipboardList,
  BarChart3,
  Clock,
  Trophy,
  Building2,
  Zap,
  PartyPopper
} from "lucide-react";

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      setHealthStatus({ success: false, error: 'Failed to connect' });
    }
    setLoading(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
            <Factory className="h-8 w-8" />
            FDX SMART WORK 2.0
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            智能化工业数据管理平台，采用现代化架构设计
          </p>
          <div className="flex justify-center gap-2 mb-8">
            <Badge variant="secondary">Next.js 15.3.4</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
            <Badge variant="secondary">Supabase</Badge>
            <Badge variant="secondary">API 代理架构</Badge>
          </div>
        </div>

        {/* 架构设计说明 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                系统架构特点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">API代理</Badge>
                  绕过 CORS 限制，密钥安全管理
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">响应式</Badge>
                  完整的移动端适配设计
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">类型安全</Badge>
                  TypeScript 全栈类型保护
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">现代UI</Badge>
                  shadcn/ui 组件库，支持暗色模式
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                项目核心优势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">快速启动</Badge>
                  5分钟完成项目初始化
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">开箱即用</Badge>
                  预配置的测试环境和组件
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">安全可靠</Badge>
                  服务端密钥管理，数据验证
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">易于扩展</Badge>
                  模块化设计，便于功能扩展
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Health Check */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              系统健康检查
            </CardTitle>
            <CardDescription>
              检查 Supabase 连接状态和 API 路由是否正常工作
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={checkHealth}
                disabled={loading}
                className="w-full"
              >
                {loading ? "检查中..." : "检查连接状态"}
              </Button>

              {healthStatus && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2 mb-3">
                    {healthStatus.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      {healthStatus.success ? "连接正常" : "连接失败"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>状态:</span>
                      <Badge variant={healthStatus.success ? "default" : "destructive"}>
                        {healthStatus.status || "unknown"}
                      </Badge>
                    </div>

                    {healthStatus.supabase_connection && (
                      <div className="flex justify-between">
                        <span>Supabase 连接:</span>
                        <Badge variant={healthStatus.supabase_connection === "connected" ? "default" : "destructive"}>
                          {healthStatus.supabase_connection}
                        </Badge>
                      </div>
                    )}

                    {healthStatus.supabase_url && (
                      <div className="flex justify-between">
                        <span>Supabase URL:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {healthStatus.supabase_url}
                        </code>
                      </div>
                    )}

                    {healthStatus.timestamp && (
                      <div className="flex justify-between">
                        <span>检查时间:</span>
                        <span className="text-xs">
                          {new Date(healthStatus.timestamp).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 全页面导航区域 */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Rocket className="h-5 w-5" />
              功能模块导航
            </CardTitle>
            <CardDescription className="text-center">
              选择您要访问的功能模块
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => window.location.href = '/lab'}
                className="flex items-center gap-2 h-16 text-left justify-start"
                variant="outline"
              >
                <FlaskConical className="h-8 w-8 text-primary" />
                <div>
                  <div className="font-semibold">化验室</div>
                  <div className="text-xs text-muted-foreground">样品数据管理</div>
                </div>
              </Button>

              <Button
                onClick={() => console.log('角色管理')}
                className="flex items-center gap-2 h-16 text-left justify-start"
                variant="outline"
                disabled
              >
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-semibold">角色管理</div>
                  <div className="text-xs text-muted-foreground">用户权限设置</div>
                </div>
              </Button>

              <Button
                onClick={() => console.log('任务管理')}
                className="flex items-center gap-2 h-16 text-left justify-start"
                variant="outline"
                disabled
              >
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-semibold">任务管理</div>
                  <div className="text-xs text-muted-foreground">工作流程管理</div>
                </div>
              </Button>

              <Button
                onClick={() => console.log('情况监控')}
                className="flex items-center gap-2 h-16 text-left justify-start"
                variant="outline"
                disabled
              >
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-semibold">情况监控</div>
                  <div className="text-xs text-muted-foreground">实时状态监控</div>
                </div>
              </Button>

              <Button
                onClick={() => console.log('考勤管理')}
                className="flex items-center gap-2 h-16 text-left justify-start"
                variant="outline"
                disabled
              >
                <Clock className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-semibold">考勤管理</div>
                  <div className="text-xs text-muted-foreground">员工考勤统计</div>
                </div>
              </Button>

              <Button
                onClick={() => console.log('积分系统')}
                className="flex items-center gap-2 h-16 text-left justify-start"
                variant="outline"
                disabled
              >
                <Trophy className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-semibold">积分系统</div>
                  <div className="text-xs text-muted-foreground">绩效积分管理</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 成功提示 */}
        <div className="text-center mt-12 text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <PartyPopper className="h-5 w-5" />
            FDX SMART WORK 2.0 智能化工业数据管理平台已就绪！
          </p>
          <p className="text-sm mt-2">基于 Next.js + Supabase 构建的现代化企业级应用</p>
        </div>
      </div>

      {/* 统一底部签名 */}
      <Footer />
    </div>
  );
}
