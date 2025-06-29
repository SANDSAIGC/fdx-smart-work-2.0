"use client";

import React, { useState, useEffect } from "react";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Filter, Droplets, Clock,
  TrendingUp, TrendingDown, BarChart3, FileText,
  Download, Search, RefreshCw, AlertTriangle,
  CheckCircle, Settings, Activity, CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 压滤数据接口
interface FilterPressData {
  id: string;
  timestamp: string;
  batchNumber: string;
  startTime: string;
  endTime: string;
  duration: number; // 分钟
  inputVolume: number; // 立方米
  outputVolume: number; // 立方米
  moistureContent: number; // 百分比
  pressure: number; // MPa
  temperature: number; // 摄氏度
  efficiency: number; // 百分比
  status: 'running' | 'completed' | 'stopped' | 'maintenance';
  operator: string;
  remarks?: string;
}

// 统计数据接口
interface FilterPressStats {
  totalBatches: number;
  avgEfficiency: number;
  totalVolume: number;
  avgMoisture: number;
  uptime: number; // 百分比
}

export default function FilterPressDataDetailsPage() {
  const router = useRouter();
  const [filterData, setFilterData] = useState<FilterPressData[]>([]);
  const [stats, setStats] = useState<FilterPressStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // 模拟数据加载
  useEffect(() => {
    const generateMockData = (): FilterPressData[] => {
      const data: FilterPressData[] = [];
      const today = new Date();
      
      for (let i = 0; i < 20; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const batchCount = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 0; j < batchCount; j++) {
          const startHour = 8 + j * 8;
          const duration = 180 + Math.random() * 120; // 3-5小时
          
          data.push({
            id: `${i}-${j}`,
            timestamp: date.toISOString(),
            batchNumber: `FP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${j + 1}`,
            startTime: `${String(startHour).padStart(2, '0')}:00:00`,
            endTime: `${String(startHour + Math.floor(duration / 60)).padStart(2, '0')}:${String(Math.floor(duration % 60)).padStart(2, '0')}:00`,
            duration: Math.round(duration),
            inputVolume: 50 + Math.random() * 30,
            outputVolume: 15 + Math.random() * 10,
            moistureContent: 8 + Math.random() * 4,
            pressure: 0.6 + Math.random() * 0.4,
            temperature: 25 + Math.random() * 10,
            efficiency: 75 + Math.random() * 20,
            status: Math.random() > 0.1 ? 'completed' : 'stopped',
            operator: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
            remarks: Math.random() > 0.7 ? '设备运行正常' : undefined
          });
        }
      }
      
      return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const mockData = generateMockData();
    setFilterData(mockData);

    // 计算统计数据
    const completedBatches = mockData.filter(d => d.status === 'completed');
    const totalVolume = completedBatches.reduce((sum, d) => sum + d.outputVolume, 0);
    const avgEfficiency = completedBatches.reduce((sum, d) => sum + d.efficiency, 0) / completedBatches.length;
    const avgMoisture = completedBatches.reduce((sum, d) => sum + d.moistureContent, 0) / completedBatches.length;
    
    setStats({
      totalBatches: mockData.length,
      avgEfficiency: Math.round(avgEfficiency * 10) / 10,
      totalVolume: Math.round(totalVolume * 10) / 10,
      avgMoisture: Math.round(avgMoisture * 10) / 10,
      uptime: 92.5
    });
  }, []);

  // 过滤数据
  const filteredData = filterData.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operator.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !selectedDate ||
      item.timestamp.startsWith(format(selectedDate, 'yyyy-MM-dd'));
    
    return matchesSearch && matchesDate;
  });

  // 刷新数据
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // 导出数据
  const handleExport = () => {
    // 模拟导出功能
    const csvContent = "data:text/csv;charset=utf-8," + 
      "批次号,开始时间,结束时间,持续时间,进料量,出料量,含水率,压力,温度,效率,状态,操作员\n" +
      filteredData.map(row => 
        `${row.batchNumber},${row.startTime},${row.endTime},${row.duration},${row.inputVolume},${row.outputVolume},${row.moistureContent},${row.pressure},${row.temperature},${row.efficiency},${row.status},${row.operator}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `压滤数据_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-blue-500';
      case 'stopped': return 'text-red-500';
      case 'maintenance': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'running': return '运行中';
      case 'stopped': return '已停止';
      case 'maintenance': return '维护中';
      default: return '未知';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'stopped': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
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
            <h1 className="text-lg font-semibold">压滤数据详情</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 统计概览 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总批次</p>
                    <p className="text-2xl font-bold">{stats.totalBatches}</p>
                  </div>
                  <Filter className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">平均效率</p>
                    <p className="text-2xl font-bold">{stats.avgEfficiency}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总产量</p>
                    <p className="text-2xl font-bold">{stats.totalVolume}</p>
                    <p className="text-xs text-muted-foreground">m³</p>
                  </div>
                  <Droplets className="h-8 w-8 text-cyan-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">平均含水率</p>
                    <p className="text-2xl font-bold">{stats.avgMoisture}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">设备运行率</p>
                    <p className="text-2xl font-bold">{stats.uptime}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 数据筛选 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              数据筛选
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">搜索批次号/操作员</Label>
                <Input
                  id="search"
                  placeholder="输入批次号或操作员姓名"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  选择日期
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "yyyy-MM-dd") : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDate(undefined);
                    }}
                  >
                    清除筛选
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 数据表格 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                压滤数据记录
              </span>
              <Badge variant="secondary">
                共 {filteredData.length} 条记录
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>批次号</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>时间段</TableHead>
                    <TableHead>持续时间</TableHead>
                    <TableHead>进料量(m³)</TableHead>
                    <TableHead>出料量(m³)</TableHead>
                    <TableHead>含水率(%)</TableHead>
                    <TableHead>效率(%)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作员</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 10).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.batchNumber}</TableCell>
                      <TableCell>{new Date(item.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>{item.startTime} - {item.endTime}</TableCell>
                      <TableCell>{Math.floor(item.duration / 60)}h {item.duration % 60}m</TableCell>
                      <TableCell>{item.inputVolume.toFixed(1)}</TableCell>
                      <TableCell>{item.outputVolume.toFixed(1)}</TableCell>
                      <TableCell>{item.moistureContent.toFixed(1)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.efficiency >= 85 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : item.efficiency >= 75 ? (
                            <TrendingUp className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span>{item.efficiency.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          <span className={getStatusColor(item.status)}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.operator}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredData.length > 10 && (
              <div className="mt-4 text-center">
                <Button variant="outline">
                  加载更多数据
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
