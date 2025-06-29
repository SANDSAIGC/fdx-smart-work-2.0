"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Scale, Search, Filter, Download, Calendar,
  Truck, Package, User, Clock, TrendingUp, TrendingDown,
  BarChart3, FileText, Eye, Edit, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 过磅记录数据接口 - 匹配数据库表结构
interface WeighbridgeRecord {
  id: number;
  时间: string;
  流水号: string;
  计量单位: string;
  车号: string;
  毛重: number;
  净重: number;
  毛重时间: string;
  空重时间: string;
  发货单位: string;
  收货单位: string;
  过磅员: string;
  驾驶员: string;
  created_at?: string;
  updated_at?: string;
}

// 地磅统计接口
interface WeighbridgeStats {
  totalRecords: number;
  todayRecords: number;
  totalWeight: number;
  todayWeight: number;
  averageWeight: number;
  inProgress: number;
  completed: number;
  totalValue: number;
}

export default function WeighbridgeDataPage() {
  const router = useRouter();
  const [records, setRecords] = useState<WeighbridgeRecord[]>([]);
  const [stats, setStats] = useState<WeighbridgeStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [loading, setLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    const generateMockRecords = (): WeighbridgeRecord[] => {
      const data: WeighbridgeRecord[] = [];
      const vehicleNumbers = ['云A12345', '云B67890', '云C11111', '云D22222', '云E33333', '云F44444'];
      const drivers = ['张师傅', '李师傅', '王师傅', '赵师傅', '陈师傅', '刘师傅'];
      const units = ['吨', '千克'];
      const shippers = ['金鼎锌业', '矿业公司A', '矿业公司B', '运输公司C'];
      const receivers = ['金鼎锌业', '选矿厂', '冶炼厂', '仓库A'];
      const operators = ['操作员A', '操作员B', '操作员C'];

      for (let i = 0; i < 100; i++) {
        const baseTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const grossTime = new Date(baseTime.getTime() + Math.random() * 2 * 60 * 60 * 1000);
        const tareTime = new Date(grossTime.getTime() + Math.random() * 4 * 60 * 60 * 1000);

        const grossWeight = Math.round((25 + Math.random() * 50) * 1000) / 1000; // 25-75吨毛重
        const netWeight = Math.round((15 + Math.random() * 35) * 1000) / 1000; // 15-50吨净重

        data.push({
          id: i + 1,
          时间: baseTime.toISOString(),
          流水号: `WB-${baseTime.getFullYear()}${String(baseTime.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
          计量单位: units[Math.floor(Math.random() * units.length)],
          车号: vehicleNumbers[Math.floor(Math.random() * vehicleNumbers.length)],
          毛重: grossWeight,
          净重: netWeight,
          毛重时间: grossTime.toISOString(),
          空重时间: tareTime.toISOString(),
          发货单位: shippers[Math.floor(Math.random() * shippers.length)],
          收货单位: receivers[Math.floor(Math.random() * receivers.length)],
          过磅员: operators[Math.floor(Math.random() * operators.length)],
          驾驶员: drivers[Math.floor(Math.random() * drivers.length)],
          created_at: baseTime.toISOString(),
          updated_at: baseTime.toISOString()
        });
      }

      return data.sort((a, b) => new Date(b.时间).getTime() - new Date(a.时间).getTime());
    };

    const mockRecords = generateMockRecords();
    setRecords(mockRecords);

    // 计算统计数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecords = mockRecords.filter(r => new Date(r.时间) >= today);

    const totalRecords = mockRecords.length;
    const todayRecordsCount = todayRecords.length;
    const totalWeight = Math.round(mockRecords.reduce((sum, r) => sum + r.净重, 0)); // 保持原单位
    const todayWeight = Math.round(todayRecords.reduce((sum, r) => sum + r.净重, 0));
    const averageWeight = totalRecords > 0 ? Math.round(totalWeight / totalRecords * 100) / 100 : 0;
    const inProgress = 0; // 简化统计
    const completed = totalRecords;
    const totalValue = 0; // 简化统计

    setStats({
      totalRecords,
      todayRecords: todayRecordsCount,
      totalWeight,
      todayWeight,
      averageWeight,
      inProgress,
      completed,
      totalValue
    });

    setLoading(false);
  }, []);

  // 筛选记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === "" ||
      record.流水号.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.车号.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.驾驶员.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.发货单位.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.收货单位.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateRange) {
      const recordDate = new Date(record.时间);
      const today = new Date();
      switch (dateRange) {
        case 'today':
          matchesDate = recordDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = recordDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = recordDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesDate;
  });



  // 导出数据
  const exportData = () => {
    const csvContent = [
      ['流水号', '车号', '驾驶员', '计量单位', '发货单位', '收货单位', '毛重', '净重', '毛重时间', '空重时间', '过磅员'],
      ...filteredRecords.map(record => [
        record.流水号,
        record.车号,
        record.驾驶员,
        record.计量单位,
        record.发货单位,
        record.收货单位,
        record.毛重,
        record.净重,
        new Date(record.毛重时间).toLocaleString(),
        new Date(record.空重时间).toLocaleString(),
        record.过磅员
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `过磅记录_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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
            <h1 className="text-lg font-semibold">地磅数据</h1>
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">总记录</p>
                    <p className="text-lg font-bold">{stats.totalRecords}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">今日记录</p>
                    <p className="text-lg font-bold">{stats.todayRecords}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">总重量(吨)</p>
                    <p className="text-lg font-bold">{stats.totalWeight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">今日重量(吨)</p>
                    <p className="text-lg font-bold">{stats.todayWeight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">平均重量(吨)</p>
                    <p className="text-lg font-bold">{stats.averageWeight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">进行中</p>
                    <p className="text-lg font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">已完成</p>
                    <p className="text-lg font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">总金额(万元)</p>
                    <p className="text-lg font-bold">{Math.round(stats.totalValue / 10000 * 100) / 100}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">过磅记录</TabsTrigger>
            <TabsTrigger value="statistics">统计分析</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* 数据筛选 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  数据筛选
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">搜索</Label>
                    <Input
                      id="search"
                      placeholder="记录号/车牌/司机/物料/供应商"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">过磅状态</Label>
                    <select
                      id="status"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">全部状态</option>
                      <option value="weigh_in">已进磅</option>
                      <option value="weigh_out">已出磅</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material">物料类型</Label>
                    <select
                      id="material"
                      value={selectedMaterial}
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">全部物料</option>
                      <option value="铅锌原矿">铅锌原矿</option>
                      <option value="铜矿石">铜矿石</option>
                      <option value="铁矿石">铁矿石</option>
                      <option value="煤炭">煤炭</option>
                      <option value="石灰石">石灰石</option>
                      <option value="精矿粉">精矿粉</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateRange">时间范围</Label>
                    <select
                      id="dateRange"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">全部时间</option>
                      <option value="today">今天</option>
                      <option value="week">最近一周</option>
                      <option value="month">最近一月</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button onClick={exportData} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      导出数据
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 过磅记录表格 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    过磅记录
                  </span>
                  <Badge variant="secondary">
                    共 {filteredRecords.length} 条记录
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>流水号</TableHead>
                        <TableHead>车号</TableHead>
                        <TableHead>驾驶员</TableHead>
                        <TableHead>计量单位</TableHead>
                        <TableHead>发货单位</TableHead>
                        <TableHead>收货单位</TableHead>
                        <TableHead>毛重</TableHead>
                        <TableHead>净重</TableHead>
                        <TableHead>毛重时间</TableHead>
                        <TableHead>空重时间</TableHead>
                        <TableHead>过磅员</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.slice(0, 20).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.流水号}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3 text-blue-500" />
                              <span>{record.车号}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{record.驾驶员}</span>
                            </div>
                          </TableCell>
                          <TableCell>{record.计量单位}</TableCell>
                          <TableCell>{record.发货单位}</TableCell>
                          <TableCell>{record.收货单位}</TableCell>
                          <TableCell className="text-right">{record.毛重.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{record.净重.toLocaleString()}</TableCell>
                          <TableCell>{new Date(record.毛重时间).toLocaleString()}</TableCell>
                          <TableCell>{new Date(record.空重时间).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{record.过磅员}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <FileText className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  统计分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">统计分析功能开发中...</p>
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
