"use client";

import React, { useState, useEffect } from "react";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Package, Truck, FlaskConical,
  TrendingUp, TrendingDown, BarChart3, FileText,
  Download, Search, RefreshCw, CheckCircle,
  Clock, MapPin, DollarSign, Users, CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";

// 出厂数据接口
interface OutgoingData {
  id: string;
  timestamp: string;
  batchNumber: string;
  productType: string;
  customer: string;
  vehicleNumber: string;
  grossWeight: number; // 毛重 (吨)
  tareWeight: number; // 皮重 (吨)
  netWeight: number; // 净重 (吨)
  pbGrade: number; // 铅品位 (%)
  znGrade: number; // 锌品位 (%)
  moisture: number; // 水分 (%)
  pbMetal: number; // 铅金属量 (吨)
  znMetal: number; // 锌金属量 (吨)
  unitPrice: number; // 单价 (元/吨)
  totalAmount: number; // 总金额 (元)
  destination: string;
  status: 'pending' | 'loaded' | 'shipped' | 'delivered';
  operator: string;
  qualityInspector: string;
  remarks?: string;
}

// 统计数据接口
interface OutgoingStats {
  totalBatches: number;
  totalWeight: number;
  avgPbGrade: number;
  avgZnGrade: number;
  totalRevenue: number;
  avgMoisture: number;
}

export default function OutgoingDataDetailsPage() {
  const router = useRouter();
  const [outgoingData, setOutgoingData] = useState<OutgoingData[]>([]);
  const [stats, setStats] = useState<OutgoingStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 模拟数据加载
  useEffect(() => {
    const generateMockData = (): OutgoingData[] => {
      const data: OutgoingData[] = [];
      const customers = ['华南冶炼厂', '江苏金属公司', '浙江有色集团', '广东冶金厂', '福建矿业公司'];
      const productTypes = ['铅精矿', '锌精矿', '铅锌混合精矿', '铅块', '锌锭'];
      const destinations = ['广州港', '上海港', '深圳港', '宁波港', '厦门港'];
      const operators = ['张发货', '李装车', '王质检', '赵调度'];
      const inspectors = ['陈检验', '刘化验', '周质控', '吴分析'];
      
      for (let i = 0; i < 60; i++) {
        const date = new Date(Date.now() - i * 12 * 60 * 60 * 1000); // 每12小时一批
        const grossWeight = 28 + Math.random() * 12; // 28-40吨
        const tareWeight = 8 + Math.random() * 2; // 8-10吨
        const netWeight = grossWeight - tareWeight;
        const pbGrade = 55 + Math.random() * 20; // 55-75%
        const znGrade = 45 + Math.random() * 25; // 45-70%
        const moisture = 1 + Math.random() * 3; // 1-4%
        const pbMetal = netWeight * pbGrade / 100;
        const znMetal = netWeight * znGrade / 100;
        const unitPrice = 4000 + Math.random() * 2000; // 4000-6000元/吨
        
        data.push({
          id: `OUT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(i % 100).padStart(3, '0')}`,
          timestamp: date.toISOString(),
          batchNumber: `FP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(i % 10 + 1).padStart(2, '0')}`,
          productType: productTypes[Math.floor(Math.random() * productTypes.length)],
          customer: customers[Math.floor(Math.random() * customers.length)],
          vehicleNumber: `粤B${String(Math.floor(Math.random() * 90000) + 10000)}`,
          grossWeight: Math.round(grossWeight * 100) / 100,
          tareWeight: Math.round(tareWeight * 100) / 100,
          netWeight: Math.round(netWeight * 100) / 100,
          pbGrade: Math.round(pbGrade * 100) / 100,
          znGrade: Math.round(znGrade * 100) / 100,
          moisture: Math.round(moisture * 100) / 100,
          pbMetal: Math.round(pbMetal * 100) / 100,
          znMetal: Math.round(znMetal * 100) / 100,
          unitPrice: Math.round(unitPrice),
          totalAmount: Math.round(netWeight * unitPrice),
          destination: destinations[Math.floor(Math.random() * destinations.length)],
          status: Math.random() > 0.7 ? 'delivered' : Math.random() > 0.5 ? 'shipped' : Math.random() > 0.3 ? 'loaded' : 'pending',
          operator: operators[Math.floor(Math.random() * operators.length)],
          qualityInspector: inspectors[Math.floor(Math.random() * inspectors.length)],
          remarks: Math.random() > 0.8 ? '产品质量优良，客户满意' : undefined
        });
      }
      
      return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const mockData = generateMockData();
    setOutgoingData(mockData);

    // 计算统计数据
    const deliveredData = mockData.filter(d => d.status === 'delivered');
    const totalWeight = deliveredData.reduce((sum, d) => sum + d.netWeight, 0);
    const totalRevenue = deliveredData.reduce((sum, d) => sum + d.totalAmount, 0);
    const avgPbGrade = deliveredData.reduce((sum, d) => sum + d.pbGrade, 0) / deliveredData.length;
    const avgZnGrade = deliveredData.reduce((sum, d) => sum + d.znGrade, 0) / deliveredData.length;
    const avgMoisture = deliveredData.reduce((sum, d) => sum + d.moisture, 0) / deliveredData.length;
    
    setStats({
      totalBatches: mockData.length,
      totalWeight: Math.round(totalWeight * 100) / 100,
      avgPbGrade: Math.round(avgPbGrade * 100) / 100,
      avgZnGrade: Math.round(avgZnGrade * 100) / 100,
      totalRevenue: Math.round(totalRevenue),
      avgMoisture: Math.round(avgMoisture * 100) / 100
    });
  }, []);

  // 获取客户列表 - 过滤掉空字符串
  const customers = Array.from(new Set(outgoingData.map(item => item.customer).filter(customer => customer && customer.trim() !== '')));

  // 过滤数据
  const filteredData = outgoingData.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !selectedDate ||
      item.timestamp.startsWith(format(selectedDate, 'yyyy-MM-dd'));
    
    const matchesCustomer = selectedCustomer === "all" || selectedCustomer === "" ||
      item.customer === selectedCustomer;

    const matchesStatus = selectedStatus === "all" || selectedStatus === "" ||
      item.status === selectedStatus;
    
    return matchesSearch && matchesDate && matchesCustomer && matchesStatus;
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
    const csvContent = "data:text/csv;charset=utf-8," + 
      "批次号,产品类型,客户,车牌号,净重,铅品位,锌品位,水分,铅金属量,锌金属量,单价,总金额,目的地,状态,操作员,质检员\n" +
      filteredData.map(row => 
        `${row.batchNumber},${row.productType},${row.customer},${row.vehicleNumber},${row.netWeight},${row.pbGrade},${row.znGrade},${row.moisture},${row.pbMetal},${row.znMetal},${row.unitPrice},${row.totalAmount},${row.destination},${row.status},${row.operator},${row.qualityInspector}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `出厂数据_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-500';
      case 'shipped': return 'text-blue-500';
      case 'loaded': return 'text-yellow-500';
      case 'pending': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return '已交付';
      case 'shipped': return '已发货';
      case 'loaded': return '已装车';
      case 'pending': return '待处理';
      default: return '未知';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-blue-500" />;
      case 'loaded': return <Package className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
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
            <h1 className="text-lg font-semibold">出厂数据详情</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总批次</p>
                    <p className="text-2xl font-bold">{stats.totalBatches}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总重量</p>
                    <p className="text-2xl font-bold">{stats.totalWeight}</p>
                    <p className="text-xs text-muted-foreground">吨</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">平均铅品位</p>
                    <p className="text-2xl font-bold">{stats.avgPbGrade}%</p>
                  </div>
                  <FlaskConical className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">平均锌品位</p>
                    <p className="text-2xl font-bold">{stats.avgZnGrade}%</p>
                  </div>
                  <FlaskConical className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总收入</p>
                    <p className="text-2xl font-bold">{(stats.totalRevenue / 10000).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">万元</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">平均水分</p>
                    <p className="text-2xl font-bold">{stats.avgMoisture}%</p>
                  </div>
                  <Users className="h-8 w-8 text-cyan-500" />
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">搜索</Label>
                <Input
                  id="search"
                  placeholder="批次号/客户/车牌号"
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
                <Label htmlFor="customer">客户</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部客户</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer} value={customer}>
                        {customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="loaded">已装车</SelectItem>
                    <SelectItem value="shipped">已发货</SelectItem>
                    <SelectItem value="delivered">已交付</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDate(undefined);
                    setSelectedCustomer("");
                    setSelectedStatus("");
                  }}
                  className="w-full"
                >
                  清除筛选
                </Button>
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
                出厂数据记录
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
                    <TableHead>产品类型</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>车牌号</TableHead>
                    <TableHead>净重(t)</TableHead>
                    <TableHead>铅品位(%)</TableHead>
                    <TableHead>锌品位(%)</TableHead>
                    <TableHead>铅金属(t)</TableHead>
                    <TableHead>锌金属(t)</TableHead>
                    <TableHead>总金额(元)</TableHead>
                    <TableHead>目的地</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作员</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 15).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.batchNumber}</TableCell>
                      <TableCell>{item.productType}</TableCell>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell>{item.vehicleNumber}</TableCell>
                      <TableCell>{item.netWeight}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.pbGrade >= 65 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : item.pbGrade >= 60 ? (
                            <TrendingUp className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span>{item.pbGrade}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.znGrade >= 60 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : item.znGrade >= 50 ? (
                            <TrendingUp className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span>{item.znGrade}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.pbMetal}</TableCell>
                      <TableCell>{item.znMetal}</TableCell>
                      <TableCell>{item.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span>{item.destination}</span>
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
            
            {filteredData.length > 15 && (
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
