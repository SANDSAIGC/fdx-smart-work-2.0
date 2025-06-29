"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Settings, Activity, Gauge, Zap,
  Thermometer, Droplets, BarChart3, AlertTriangle,
  CheckCircle, XCircle, Clock, RefreshCw,
  TrendingUp, TrendingDown, Wrench, Power
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

// 设备运行数据接口
interface MachineData {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'maintenance' | 'error';
  uptime: number; // 运行时间百分比
  efficiency: number; // 效率百分比
  temperature: number; // 温度
  pressure: number; // 压力
  vibration: number; // 振动
  power: number; // 功率
  speed: number; // 转速
  lastMaintenance: string;
  nextMaintenance: string;
  totalRuntime: number; // 总运行时间(小时)
  faultCount: number; // 故障次数
  operator: string;
}

// 报警记录接口
interface AlarmRecord {
  id: string;
  timestamp: string;
  machineId: string;
  machineName: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  status: 'active' | 'acknowledged' | 'resolved';
  operator?: string;
}

export default function MachineRunningDetailsPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [alarms, setAlarms] = useState<AlarmRecord[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 模拟数据加载
  useEffect(() => {
    const generateMockMachines = (): MachineData[] => {
      const machineTypes = ['球磨机', '浮选机', '压滤机', '破碎机', '分级机'];
      const operators = ['张师傅', '李师傅', '王师傅', '赵师傅'];
      
      return Array.from({ length: 8 }, (_, i) => ({
        id: `machine-${i + 1}`,
        name: `${machineTypes[i % machineTypes.length]}${Math.floor(i / machineTypes.length) + 1}号`,
        type: machineTypes[i % machineTypes.length],
        status: Math.random() > 0.8 ? 'maintenance' : Math.random() > 0.9 ? 'error' : Math.random() > 0.1 ? 'running' : 'stopped',
        uptime: 85 + Math.random() * 10,
        efficiency: 75 + Math.random() * 20,
        temperature: 45 + Math.random() * 30,
        pressure: 0.5 + Math.random() * 1.5,
        vibration: 2 + Math.random() * 3,
        power: 50 + Math.random() * 100,
        speed: 800 + Math.random() * 400,
        lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalRuntime: 1000 + Math.random() * 5000,
        faultCount: Math.floor(Math.random() * 10),
        operator: operators[Math.floor(Math.random() * operators.length)]
      }));
    };

    const generateMockAlarms = (): AlarmRecord[] => {
      const alarmTypes = ['温度过高', '压力异常', '振动超标', '功率异常', '转速异常', '润滑不足'];
      const machines = generateMockMachines();
      
      return Array.from({ length: 15 }, (_, i) => {
        const machine = machines[Math.floor(Math.random() * machines.length)];
        const level = Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low';
        
        return {
          id: `alarm-${i + 1}`,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          machineId: machine.id,
          machineName: machine.name,
          level,
          type: alarmTypes[Math.floor(Math.random() * alarmTypes.length)],
          description: `${machine.name}发生${alarmTypes[Math.floor(Math.random() * alarmTypes.length)]}报警`,
          status: Math.random() > 0.3 ? 'resolved' : Math.random() > 0.5 ? 'acknowledged' : 'active',
          operator: Math.random() > 0.5 ? machine.operator : undefined
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const mockMachines = generateMockMachines();
    const mockAlarms = generateMockAlarms();
    
    setMachines(mockMachines);
    setAlarms(mockAlarms);
    setSelectedMachine(mockMachines[0]?.id || "");

    // 模拟实时数据更新
    const interval = setInterval(() => {
      setMachines(prev => prev.map(machine => ({
        ...machine,
        temperature: machine.temperature + (Math.random() - 0.5) * 2,
        pressure: Math.max(0, machine.pressure + (Math.random() - 0.5) * 0.1),
        vibration: Math.max(0, machine.vibration + (Math.random() - 0.5) * 0.5),
        power: Math.max(0, machine.power + (Math.random() - 0.5) * 5),
        speed: Math.max(0, machine.speed + (Math.random() - 0.5) * 20)
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

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-500';
      case 'stopped': return 'text-gray-500';
      case 'maintenance': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '运行中';
      case 'stopped': return '已停止';
      case 'maintenance': return '维护中';
      case 'error': return '故障';
      default: return '未知';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'stopped': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取报警级别颜色
  const getAlarmLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  // 获取报警级别文本
  const getAlarmLevelText = (level: string) => {
    switch (level) {
      case 'critical': return '严重';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  // 获取选中的设备
  const currentMachine = machines.find(m => m.id === selectedMachine);

  // 统计数据
  const runningCount = machines.filter(m => m.status === 'running').length;
  const maintenanceCount = machines.filter(m => m.status === 'maintenance').length;
  const errorCount = machines.filter(m => m.status === 'error').length;
  const activeAlarms = alarms.filter(a => a.status === 'active').length;

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
            <h1 className="text-lg font-semibold">设备运行详情</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 设备状态概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">运行设备</p>
                  <p className="text-2xl font-bold text-green-500">{runningCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">维护设备</p>
                  <p className="text-2xl font-bold text-yellow-500">{maintenanceCount}</p>
                </div>
                <Wrench className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">故障设备</p>
                  <p className="text-2xl font-bold text-red-500">{errorCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">活跃报警</p>
                  <p className="text-2xl font-bold text-orange-500">{activeAlarms}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">设备概览</TabsTrigger>
            <TabsTrigger value="details">详细参数</TabsTrigger>
            <TabsTrigger value="alarms">报警记录</TabsTrigger>
            <TabsTrigger value="maintenance">维护计划</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  设备状态总览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {machines.map((machine) => (
                    <Card key={machine.id} className={`cursor-pointer transition-colors ${
                      selectedMachine === machine.id ? 'ring-2 ring-primary' : ''
                    }`} onClick={() => setSelectedMachine(machine.id)}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{machine.name}</h3>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(machine.status)}
                              <span className={`text-xs ${getStatusColor(machine.status)}`}>
                                {getStatusText(machine.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>运行率</span>
                              <span>{machine.uptime.toFixed(1)}%</span>
                            </div>
                            <Progress value={machine.uptime} className="h-2" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>效率</span>
                              <span>{machine.efficiency.toFixed(1)}%</span>
                            </div>
                            <Progress value={machine.efficiency} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>温度: {machine.temperature.toFixed(1)}°C</div>
                            <div>压力: {machine.pressure.toFixed(2)}MPa</div>
                            <div>功率: {machine.power.toFixed(0)}kW</div>
                            <div>转速: {machine.speed.toFixed(0)}rpm</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {currentMachine && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    {currentMachine.name} - 详细参数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 温度 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">温度</span>
                      </div>
                      <div className="text-2xl font-bold">{currentMachine.temperature.toFixed(1)}°C</div>
                      <Progress 
                        value={(currentMachine.temperature / 100) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">正常范围: 40-80°C</div>
                    </div>

                    {/* 压力 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">压力</span>
                      </div>
                      <div className="text-2xl font-bold">{currentMachine.pressure.toFixed(2)} MPa</div>
                      <Progress 
                        value={(currentMachine.pressure / 2) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">正常范围: 0.5-1.5 MPa</div>
                    </div>

                    {/* 振动 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">振动</span>
                      </div>
                      <div className="text-2xl font-bold">{currentMachine.vibration.toFixed(1)} mm/s</div>
                      <Progress 
                        value={(currentMachine.vibration / 10) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">正常范围: 0-5 mm/s</div>
                    </div>

                    {/* 功率 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">功率</span>
                      </div>
                      <div className="text-2xl font-bold">{currentMachine.power.toFixed(0)} kW</div>
                      <Progress 
                        value={(currentMachine.power / 200) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">额定功率: 150 kW</div>
                    </div>

                    {/* 转速 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">转速</span>
                      </div>
                      <div className="text-2xl font-bold">{currentMachine.speed.toFixed(0)} rpm</div>
                      <Progress 
                        value={(currentMachine.speed / 1500) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">额定转速: 1200 rpm</div>
                    </div>

                    {/* 效率 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">效率</span>
                      </div>
                      <div className="text-2xl font-bold">{currentMachine.efficiency.toFixed(1)}%</div>
                      <Progress 
                        value={currentMachine.efficiency} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">目标效率: 85%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="alarms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  报警记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>设备</TableHead>
                        <TableHead>级别</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>处理人</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alarms.slice(0, 10).map((alarm) => (
                        <TableRow key={alarm.id}>
                          <TableCell>{new Date(alarm.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{alarm.machineName}</TableCell>
                          <TableCell>
                            <Badge className={getAlarmLevelColor(alarm.level)}>
                              {getAlarmLevelText(alarm.level)}
                            </Badge>
                          </TableCell>
                          <TableCell>{alarm.type}</TableCell>
                          <TableCell>{alarm.description}</TableCell>
                          <TableCell>
                            <Badge variant={
                              alarm.status === 'resolved' ? 'default' :
                              alarm.status === 'acknowledged' ? 'secondary' : 'destructive'
                            }>
                              {alarm.status === 'resolved' ? '已解决' :
                               alarm.status === 'acknowledged' ? '已确认' : '活跃'}
                            </Badge>
                          </TableCell>
                          <TableCell>{alarm.operator || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  维护计划
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {machines.map((machine) => (
                    <div key={machine.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(machine.status)}
                        <div>
                          <div className="font-medium">{machine.name}</div>
                          <div className="text-sm text-muted-foreground">
                            操作员: {machine.operator}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <div>上次维护: {machine.lastMaintenance}</div>
                          <div>下次维护: {machine.nextMaintenance}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          运行时长: {machine.totalRuntime.toFixed(0)}h | 故障次数: {machine.faultCount}
                        </div>
                      </div>
                    </div>
                  ))}
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
