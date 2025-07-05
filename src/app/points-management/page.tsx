"use client";

import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft, Users, Award, TrendingUp, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header2 } from "@/components/headers/header-2";
import { Footer } from "@/components/ui/footer";

export default function PointsManagementPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header2 
        title="积分管理"
        onBack={() => router.back()}
      />

      <div className="container mx-auto px-6 pb-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">积分管理系统</h1>
            <p className="text-muted-foreground">员工积分奖励、兑换、排行榜管理</p>
          </div>
        </div>

        {/* 积分概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">总积分池</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234,567</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.5%</span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">活跃用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8.3%</span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">本月兑换</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,678</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">+15.2%</span> 较上月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">兑换率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68.9%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+3.7%</span> 较上月
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 功能模块 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                用户积分管理
              </CardTitle>
              <CardDescription>
                查看和管理员工积分记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">张三</span>
                  <Badge variant="secondary">8,520 分</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">李四</span>
                  <Badge variant="secondary">7,890 分</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">王五</span>
                  <Badge variant="secondary">7,234 分</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  查看全部
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                积分规则设置
              </CardTitle>
              <CardDescription>
                配置积分获取和消耗规则
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>签到奖励</span>
                  <span className="font-medium">+10 分/天</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>任务完成</span>
                  <span className="font-medium">+50 分/次</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>月度考核</span>
                  <span className="font-medium">+200 分</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  编辑规则
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-500" />
                奖品兑换管理
              </CardTitle>
              <CardDescription>
                管理积分商城和兑换记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>购物卡</span>
                  <span className="font-medium">1000 分</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>带薪假期</span>
                  <span className="font-medium">2000 分</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>电子产品</span>
                  <span className="font-medium">5000 分</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  管理奖品
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 积分趋势 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              积分趋势分析
            </CardTitle>
            <CardDescription>
              最近6个月的积分发放和兑换趋势
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">积分发放</span>
                <div className="flex items-center gap-2">
                  <Progress value={75} className="w-32" />
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">积分兑换</span>
                <div className="flex items-center gap-2">
                  <Progress value={68} className="w-32" />
                  <span className="text-sm font-medium">68%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">用户活跃度</span>
                <div className="flex items-center gap-2">
                  <Progress value={82} className="w-32" />
                  <span className="text-sm font-medium">82%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 开发中提示 */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">功能开发中</h3>
              <p className="text-muted-foreground mb-4">
                积分管理系统正在开发中，敬请期待完整功能上线
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回上一页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
