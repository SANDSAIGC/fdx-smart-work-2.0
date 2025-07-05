"use client";

import { useRouter } from "next/navigation";
import { Package, ArrowLeft, Plus, Search, Filter, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Header2 } from "@/components/headers/header-2";
import { Footer } from "@/components/ui/footer";

export default function MaterialManagementPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header2 
        title="物资管理"
        onBack={() => router.back()}
      />

      <div className="container mx-auto px-6 pb-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">物资管理系统</h1>
            <p className="text-muted-foreground">企业物资采购、库存、配送全流程管理</p>
          </div>
        </div>

        {/* 功能概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                库存管理
              </CardTitle>
              <CardDescription>
                实时库存监控、预警和补货管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>当前库存品类</span>
                  <span className="font-medium">156 种</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>低库存预警</span>
                  <span className="font-medium text-orange-600">12 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>库存总价值</span>
                  <span className="font-medium">¥2,456,789</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-500" />
                采购管理
              </CardTitle>
              <CardDescription>
                采购申请、审批、订单跟踪管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>待审批申请</span>
                  <span className="font-medium text-blue-600">8 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>进行中订单</span>
                  <span className="font-medium">23 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>本月采购额</span>
                  <span className="font-medium">¥456,123</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-purple-500" />
                配送管理
              </CardTitle>
              <CardDescription>
                物资配送、签收、退货流程管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>配送中订单</span>
                  <span className="font-medium text-purple-600">15 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>今日配送</span>
                  <span className="font-medium">7 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>配送完成率</span>
                  <span className="font-medium text-green-600">96.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快捷操作区域 */}
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
            <CardDescription>
              常用的物资管理操作和功能入口
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span>新增采购申请</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Search className="h-6 w-6" />
                <span>库存查询</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Filter className="h-6 w-6" />
                <span>订单跟踪</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Upload className="h-6 w-6" />
                <span>入库登记</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 开发中提示 */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">功能开发中</h3>
              <p className="text-muted-foreground mb-4">
                物资管理系统正在开发中，敬请期待完整功能上线
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
