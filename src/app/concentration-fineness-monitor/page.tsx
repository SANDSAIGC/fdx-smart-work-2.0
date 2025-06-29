"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Gauge, Droplets, Target, TrendingUp, 
  TrendingDown, AlertTriangle, CheckCircle, RefreshCw,
  BarChart3, Activity, Settings, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 监控数据接口
interface MonitorData {
  id: string;
  timestamp: string;
  concentration: number;
  fineness: number;
  temperature: number;
  pressure: number;
  flowRate: number;
  status: 'normal' | 'warning' | 'alarm';
}

// 设备状态接口
interface EquipmentStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  lastUpdate: string;
  concentration: number;
  fineness: number;
}

export default function ConcentrationFinenessMonitorPage() {
  const router = useRouter();
  const [currentData, setCurrentData] = useState<MonitorData | null>(null);
  const [equipmentList, setEquipmentList] = useState<EquipmentStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 模拟实时数据更新
  useEffect(() => {
    const generateMockData = (): MonitorData => {
      const baseConcentration = 65;
      const baseFineness = 85;
      
      return {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        concentration: baseConcentration + (Math.random() - 0.5) * 10,
        fineness: baseFineness + (Math.random() - 0.5) * 15,
        temperature: 25 + Math.random() * 10,
        pressure: 0.8 + Math.random() * 0.4,
        flowRate: 120 + Math.random() * 40,
        status: Math.random() > 0.8 ? 'warning' : 'normal'
      };
    };

    // 初始化数据
    setCurrentData(generateMockData());

    // 模拟设备列表
    const mockEquipment: EquipmentStatus[] = [
      {
        id: '1',
        name: '一号球磨机',
        status: 'online',
        lastUpdate: new Date().toISOString(),
        concentration: 68.5,
        fineness: 82.3
      },
      {
        id: '2',
        name: '二号球磨机',
        status: 'online',
        lastUpdate: new Date().toISOString(),
        concentration: 66.2,
        fineness: 85.7
      },
      {
        id: '3',
        name: '三号球磨机',
        status: 'maintenance',
        lastUpdate: new Date(Date.now() - 3600000).toISOString(),
        concentration: 0,
        fineness: 0
      }
    ];
    setEquipmentList(mockEquipment);

    // 定时更新数据
    const interval = setInterval(() => {
      setCurrentData(generateMockData());
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 手动刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // 模拟API调用延迟
    setTimeout(() => {
      setCurrentData(prev => ({
        ...prev!,
        concentration: 65 + (Math.random() - 0.5) * 10,
        fineness: 85 + (Math.random() - 0.5) * 15,
        timestamp: new Date().toISOString()
      }));
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'alarm': return 'text-red-500';
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'maintenance': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'alarm':
      case 'offline':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取浓度状态
  const getConcentrationStatus = (value: number) => {
    if (value >= 60 && value <= 70) return 'normal';
    if (value >= 55 && value <= 75) return 'warning';
    return 'alarm';
  };

  // 获取细度状态
  const getFinenessStatus = (value: number) => {
    if (value >= 80 && value <= 90) return 'normal';
    if (value >= 75 && value <= 95) return 'warning';
    return 'alarm';
  };

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
            <h1 className="text-lg font-semibold">浓度细度监控</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 实时监控概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">浓度</p>
                  <p className="text-2xl font-bold">{currentData?.concentration.toFixed(1)}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusIcon(getConcentrationStatus(currentData?.concentration || 0))}
                    <span className={`text-xs ${getStatusColor(getConcentrationStatus(currentData?.concentration || 0))}`}>
                      {getConcentrationStatus(currentData?.concentration || 0) === 'normal' ? '正常' : 
                       getConcentrationStatus(currentData?.concentration || 0) === 'warning' ? '警告' : '报警'}
                    </span>
                  </div>
                </div>
                <Droplets className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">细度</p>
                  <p className="text-2xl font-bold">{currentData?.fineness.toFixed(1)}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusIcon(getFinenessStatus(currentData?.fineness || 0))}
                    <span className={`text-xs ${getStatusColor(getFinenessStatus(currentData?.fineness || 0))}`}>
                      {getFinenessStatus(currentData?.fineness || 0) === 'normal' ? '正常' : 
                       getFinenessStatus(currentData?.fineness || 0) === 'warning' ? '警告' : '报警'}
                    </span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">温度</p>
                  <p className="text-2xl font-bold">{currentData?.temperature.toFixed(1)}°C</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500">正常</span>
                  </div>
                </div>
                <Gauge className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">流量</p>
                  <p className="text-2xl font-bold">{currentData?.flowRate.toFixed(0)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-500">L/min</span>
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细监控数据 */}
        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="realtime">实时数据</TabsTrigger>
            <TabsTrigger value="equipment">设备状态</TabsTrigger>
            <TabsTrigger value="trends">趋势分析</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    实时监控数据
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    最后更新: {lastUpdate.toLocaleTimeString()}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 浓度监控 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">浓度监控</span>
                    <span className="text-sm text-muted-foreground">目标: 60-70%</span>
                  </div>
                  <Progress 
                    value={(currentData?.concentration || 0)} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">{currentData?.concentration.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* 细度监控 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">细度监控</span>
                    <span className="text-sm text-muted-foreground">目标: 80-90%</span>
                  </div>
                  <Progress 
                    value={(currentData?.fineness || 0)} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">{currentData?.fineness.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* 其他参数 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">压力</span>
                    <div className="text-lg font-semibold">{currentData?.pressure.toFixed(2)} MPa</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">温度</span>
                    <div className="text-lg font-semibold">{currentData?.temperature.toFixed(1)} °C</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">流量</span>
                    <div className="text-lg font-semibold">{currentData?.flowRate.toFixed(0)} L/min</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  设备运行状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipmentList.map((equipment) => (
                    <div key={equipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(equipment.status)}
                        <div>
                          <div className="font-medium">{equipment.name}</div>
                          <div className="text-sm text-muted-foreground">
                            最后更新: {new Date(equipment.lastUpdate).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={equipment.status === 'online' ? 'default' : 
                                      equipment.status === 'maintenance' ? 'secondary' : 'destructive'}>
                          {equipment.status === 'online' ? '在线' :
                           equipment.status === 'maintenance' ? '维护中' : '离线'}
                        </Badge>
                        {equipment.status === 'online' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            浓度: {equipment.concentration}% | 细度: {equipment.fineness}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  趋势分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>趋势图表功能开发中...</p>
                  <p className="text-sm mt-2">将显示浓度和细度的历史趋势数据</p>
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
