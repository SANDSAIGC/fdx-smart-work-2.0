"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Server, Database, Zap, Shield } from "lucide-react";

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
          <h1 className="text-4xl font-bold mb-4">
            🚀 Next.js + Supabase 快速启动模板
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            采用 API 路由代理架构，完美解决自部署环境的 CORS 限制和安全性问题
          </p>
          <div className="flex justify-center gap-2 mb-8">
            <Badge variant="secondary">Next.js 15.3.4</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
            <Badge variant="secondary">Supabase</Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Server className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">API 路由代理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                绕过 CORS 限制，服务端到服务端通信
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">安全管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                密钥只在服务端使用，更高安全性
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">开箱即用</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                预配置的测试环境，无需额外设置
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Database className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">完整 CRUD</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                提供创建、读取、更新、删除的完整API接口
              </p>
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

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          <p>🎉 恭喜！您的 Next.js + Supabase 项目已经可以运行了！</p>
        </div>
      </div>
    </div>
  );
}
