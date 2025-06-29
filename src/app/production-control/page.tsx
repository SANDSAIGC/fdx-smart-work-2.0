"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Play, Pause, Square, Settings,
  Gauge, Activity, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Users, BarChart3,
  RefreshCw, Target, Zap, Thermometer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 生产线数据接口
interface ProductionLine {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'maintenance' | 'standby';
  currentProduct: string;
  targetOutput: number; // 目标产量 (吨/小时)
  actualOutput: number; // 实际产量 (吨/小时)
  efficiency: number; // 效率百分比
  quality: number; // 质量评分
  temperature: number; // 温度
  pressure: number; // 压力
  operatorCount: number; // 操作员数量
  shiftLeader: string;
  startTime: string;
  plannedDuration: number; // 计划时长(小时)
  actualDuration: number; // 实际时长(小时)
}

// 生产计划接口
interface ProductionPlan {
  id: string;
  productName: string;
  plannedQuantity: number;
  actualQuantity: number;
  startDate: string;
  endDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  assignedLine: string;
  responsible: string;
}

// 质量指标接口
interface QualityMetrics {
  pbGrade: number;
  znGrade: number;
  moisture: number;
  recovery: number;
  defectRate: number;
}

export default function ProductionControlPage() {
  const router = useRouter();
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 模拟数据加载
  useEffect(() => {
    const generateMockLines = (): ProductionLine[] => {
      const lines = ['浮选生产线1', '浮选生产线2', '压滤生产线', '精矿处理线'];
      const products = ['铅精矿', '锌精矿', '混合精矿', '尾矿处理'];
      const leaders = ['张班长', '李班长', '王班长', '赵班长'];
      
      return lines.map((line, i) => ({
        id: `line-${i + 1}`,
        name: line,
        status: Math.random() > 0.8 ? 'maintenance' : Math.random() > 0.9 ? 'stopped' : Math.random() > 0.1 ? 'running' : 'standby',
        currentProduct: products[i],
        targetOutput: 8 + Math.random() * 4, // 8-12吨/小时
        actualOutput: 6 + Math.random() * 5, // 6-11吨/小时
        efficiency: 75 + Math.random() * 20,
        quality: 85 + Math.random() * 10,
        temperature: 45 + Math.random() * 15,
        pressure: 0.8 + Math.random() * 0.4,
        operatorCount: 3 + Math.floor(Math.random() * 3),
        shiftLeader: leaders[i],
        startTime: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000).toISOString(),
        plannedDuration: 8,
        actualDuration: Math.random() * 8
      }));
    };

    const generateMockPlans = (): ProductionPlan[] => {
      const products = ['铅精矿', '锌精矿', '混合精矿', '铅块', '锌锭'];
      const lines = ['浮选生产线1', '浮选生产线2', '压滤生产线', '精矿处理线'];
      const responsible = ['张主管', '李主管', '王主管', '赵主管'];
      
      return Array.from({ length: 10 }, (_, i) => {
        const startDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        const endDate = new Date(startDate.getTime() + (2 + Math.random() * 3) * 24 * 60 * 60 * 1000);
        const plannedQuantity = 50 + Math.random() * 100;
        
        return {
          id: `plan-${i + 1}`,
          productName: products[Math.floor(Math.random() * products.length)],
          plannedQuantity: Math.round(plannedQuantity),
          actualQuantity: i < 3 ? Math.round(plannedQuantity * (0.8 + Math.random() * 0.3)) : 0,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          status: i < 2 ? 'in_progress' : i < 4 ? 'completed' : i < 6 ? 'pending' : 'delayed',
          assignedLine: lines[Math.floor(Math.random() * lines.length)],
          responsible: responsible[Math.floor(Math.random() * responsible.length)]
        };
      });
    };

    const mockLines = generateMockLines();
    const mockPlans = generateMockPlans();
    
    setProductionLines(mockLines);
    setProductionPlans(mockPlans);
    setSelectedLine(mockLines[0]?.id || "");

    // 生成质量指标
    setQualityMetrics({
      pbGrade: 65 + Math.random() * 10,
      znGrade: 55 + Math.random() * 15,
      moisture: 2 + Math.random() * 3,
      recovery: 85 + Math.random() * 10,
      defectRate: Math.random() * 5
    });

    // 模拟实时数据更新
    const interval = setInterval(() => {
      setProductionLines(prev => prev.map(line => ({
        ...line,
        actualOutput: Math.max(0, line.actualOutput + (Math.random() - 0.5) * 0.5),
        efficiency: Math.max(0, Math.min(100, line.efficiency + (Math.random() - 0.5) * 2)),
        temperature: line.temperature + (Math.random() - 0.5) * 2,
        pressure: Math.max(0, line.pressure + (Math.random() - 0.5) * 0.05),
        actualDuration: line.actualDuration + 0.1
      })));
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 手动刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }, 1000);
  };

  // 控制生产线
  const handleLineControl = (lineId: string, action: 'start' | 'pause' | 'stop') => {
    setProductionLines(prev => prev.map(line => 
      line.id === lineId 
        ? { 
            ...line, 
            status: action === 'start' ? 'running' : action === 'pause' ? 'standby' : 'stopped'
          }
        : line
    ));
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-500';
      case 'stopped': return 'text-red-500';
      case 'maintenance': return 'text-yellow-500';
      case 'standby': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '运行中';
      case 'stopped': return '已停止';
      case 'maintenance': return '维护中';
      case 'standby': return '待机';
      default: return '未知';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4 text-green-500" />;
      case 'stopped': return <Square className="h-4 w-4 text-red-500" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-yellow-500" />;
      case 'standby': return <Pause className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  // 获取计划状态颜色
  const getPlanStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'in_progress': return 'text-blue-500';
      case 'pending': return 'text-gray-500';
      case 'delayed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // 统计数据
  const runningLines = productionLines.filter(l => l.status === 'running').length;
  const totalOutput = productionLines.reduce((sum, l) => sum + l.actualOutput, 0);
  const avgEfficiency = productionLines.reduce((sum, l) => sum + l.efficiency, 0) / productionLines.length;
  const activePlans = productionPlans.filter(p => p.status === 'in_progress').length;

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
            <h1 className="text-lg font-semibold">生产控制</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 生产概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">运行生产线</p>
                  <p className="text-2xl font-bold text-green-500">{runningLines}</p>
                </div>
                <Play className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总产量</p>
                  <p className="text-2xl font-bold">{totalOutput.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">吨/小时</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均效率</p>
                  <p className="text-2xl font-bold">{avgEfficiency.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">活跃计划</p>
                  <p className="text-2xl font-bold text-purple-500">{activePlans}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <Tabs defaultValue="lines" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lines">生产线状态</TabsTrigger>
            <TabsTrigger value="control">生产控制</TabsTrigger>
            <TabsTrigger value="plans">生产计划</TabsTrigger>
            <TabsTrigger value="quality">质量监控</TabsTrigger>
          </TabsList>

          <TabsContent value="lines" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  生产线实时状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productionLines.map((line) => (
                    <Card key={line.id} className={`cursor-pointer transition-colors ${
                      selectedLine === line.id ? 'ring-2 ring-primary' : ''
                    }`} onClick={() => setSelectedLine(line.id)}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{line.name}</h3>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(line.status)}
                              <span className={`text-xs ${getStatusColor(line.status)}`}>
                                {getStatusText(line.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            产品: {line.currentProduct} | 班长: {line.shiftLeader}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>产量 ({line.actualOutput.toFixed(1)}/{line.targetOutput.toFixed(1)} t/h)</span>
                              <span>{((line.actualOutput / line.targetOutput) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(line.actualOutput / line.targetOutput) * 100} className="h-2" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>效率</span>
                              <span>{line.efficiency.toFixed(1)}%</span>
                            </div>
                            <Progress value={line.efficiency} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>温度: {line.temperature.toFixed(1)}°C</div>
                            <div>压力: {line.pressure.toFixed(2)}MPa</div>
                            <div>操作员: {line.operatorCount}人</div>
                            <div>质量: {line.quality.toFixed(1)}分</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="control" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  生产线控制面板
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productionLines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(line.status)}
                        <div>
                          <div className="font-medium">{line.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {line.currentProduct} | {line.shiftLeader}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLineControl(line.id, 'start')}
                          disabled={line.status === 'running'}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          启动
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLineControl(line.id, 'pause')}
                          disabled={line.status === 'standby'}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          暂停
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLineControl(line.id, 'stop')}
                          disabled={line.status === 'stopped'}
                        >
                          <Square className="h-4 w-4 mr-1" />
                          停止
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  生产计划管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>产品名称</TableHead>
                        <TableHead>计划数量</TableHead>
                        <TableHead>实际数量</TableHead>
                        <TableHead>完成率</TableHead>
                        <TableHead>开始日期</TableHead>
                        <TableHead>结束日期</TableHead>
                        <TableHead>优先级</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>分配生产线</TableHead>
                        <TableHead>负责人</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.productName}</TableCell>
                          <TableCell>{plan.plannedQuantity}吨</TableCell>
                          <TableCell>{plan.actualQuantity}吨</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={plan.plannedQuantity > 0 ? (plan.actualQuantity / plan.plannedQuantity) * 100 : 0} 
                                className="h-2 w-16"
                              />
                              <span className="text-sm">
                                {plan.plannedQuantity > 0 ? ((plan.actualQuantity / plan.plannedQuantity) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{plan.startDate}</TableCell>
                          <TableCell>{plan.endDate}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(plan.priority)}>
                              {plan.priority === 'high' ? '高' : plan.priority === 'medium' ? '中' : '低'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={getPlanStatusColor(plan.status)}>
                              {plan.status === 'completed' ? '已完成' :
                               plan.status === 'in_progress' ? '进行中' :
                               plan.status === 'pending' ? '待开始' : '延期'}
                            </span>
                          </TableCell>
                          <TableCell>{plan.assignedLine}</TableCell>
                          <TableCell>{plan.responsible}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            {qualityMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    质量监控指标
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">铅品位</span>
                      </div>
                      <div className="text-2xl font-bold">{qualityMetrics.pbGrade.toFixed(1)}%</div>
                      <Progress value={qualityMetrics.pbGrade} className="h-2" />
                      <div className="text-xs text-muted-foreground">目标: ≥65%</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">锌品位</span>
                      </div>
                      <div className="text-2xl font-bold">{qualityMetrics.znGrade.toFixed(1)}%</div>
                      <Progress value={qualityMetrics.znGrade} className="h-2" />
                      <div className="text-xs text-muted-foreground">目标: ≥55%</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">水分含量</span>
                      </div>
                      <div className="text-2xl font-bold">{qualityMetrics.moisture.toFixed(1)}%</div>
                      <Progress value={(qualityMetrics.moisture / 10) * 100} className="h-2" />
                      <div className="text-xs text-muted-foreground">目标: ≤3%</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">回收率</span>
                      </div>
                      <div className="text-2xl font-bold">{qualityMetrics.recovery.toFixed(1)}%</div>
                      <Progress value={qualityMetrics.recovery} className="h-2" />
                      <div className="text-xs text-muted-foreground">目标: ≥90%</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">缺陷率</span>
                      </div>
                      <div className="text-2xl font-bold">{qualityMetrics.defectRate.toFixed(1)}%</div>
                      <Progress value={qualityMetrics.defectRate * 20} className="h-2" />
                      <div className="text-xs text-muted-foreground">目标: ≤2%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
