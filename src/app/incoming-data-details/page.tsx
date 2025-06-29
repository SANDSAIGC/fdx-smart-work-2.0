"use client";

import React, { useState, useEffect } from "react";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Truck, Scale, FlaskConical,
  TrendingUp, TrendingDown, BarChart3, FileText,
  Download, Search, RefreshCw, AlertTriangle,
  CheckCircle, Package, MapPin, Clock, CalendarIcon
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

// 进厂数据接口
interface IncomingData {
  id: string;
  timestamp: string;
  vehicleNumber: string;
  supplier: string;
  materialType: string;
  grossWeight: number; // 毛重 (吨)
  tareWeight: number; // 皮重 (吨)
  netWeight: number; // 净重 (吨)
  pbGrade: number; // 铅品位 (%)
  znGrade: number; // 锌品位 (%)
  moisture: number; // 水分 (%)
  pbMetal: number; // 铅金属量 (吨)
  znMetal: number; // 锌金属量 (吨)
  price: number; // 单价 (元/吨)
  totalAmount: number; // 总金额 (元)
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  inspector: string;
  remarks?: string;
}

// 统计数据接口
interface IncomingStats {
  totalBatches: number;
  totalWeight: number;
  avgPbGrade: number;
  avgZnGrade: number;
  totalValue: number;
  avgMoisture: number;
}

export default function IncomingDataDetailsPage() {
  const router = useRouter();
  const [incomingData, setIncomingData] = useState<IncomingData[]>([]);
  const [stats, setStats] = useState<IncomingStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 模拟数据加载
  useEffect(() => {
    const generateMockData = (): IncomingData[] => {
      const data: IncomingData[] = [];
      const suppliers = ['云南矿业公司', '贵州金属集团', '四川有色金属', '湖南矿物公司', '广西冶金厂'];
      const materialTypes = ['铅锌原矿', '铅精矿', '锌精矿', '混合精矿'];
      const inspectors = ['张检验', '李质控', '王化验', '赵分析'];
      
      for (let i = 0; i < 50; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const grossWeight = 25 + Math.random() * 15; // 25-40吨
        const tareWeight = 8 + Math.random() * 2; // 8-10吨
        const netWeight = grossWeight - tareWeight;
        const pbGrade = 15 + Math.random() * 25; // 15-40%
        const znGrade = 20 + Math.random() * 30; // 20-50%
        const moisture = 2 + Math.random() * 6; // 2-8%
        const pbMetal = netWeight * pbGrade / 100;
        const znMetal = netWeight * znGrade / 100;
        const price = 3000 + Math.random() * 2000; // 3000-5000元/吨
        
        data.push({
          id: `IN${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(i % 10).padStart(3, '0')}`,
          timestamp: date.toISOString(),
          vehicleNumber: `云A${String(Math.floor(Math.random() * 90000) + 10000)}`,
          supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
          materialType: materialTypes[Math.floor(Math.random() * materialTypes.length)],
          grossWeight: Math.round(grossWeight * 100) / 100,
          tareWeight: Math.round(tareWeight * 100) / 100,
          netWeight: Math.round(netWeight * 100) / 100,
          pbGrade: Math.round(pbGrade * 100) / 100,
          znGrade: Math.round(znGrade * 100) / 100,
          moisture: Math.round(moisture * 100) / 100,
          pbMetal: Math.round(pbMetal * 100) / 100,
          znMetal: Math.round(znMetal * 100) / 100,
          price: Math.round(price),
          totalAmount: Math.round(netWeight * price),
          status: Math.random() > 0.1 ? 'approved' : Math.random() > 0.5 ? 'pending' : 'processing',
          inspector: inspectors[Math.floor(Math.random() * inspectors.length)],
          remarks: Math.random() > 0.7 ? '质量符合要求' : undefined
        });
      }
      
      return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const mockData = generateMockData();
    setIncomingData(mockData);

    // 计算统计数据
    const approvedData = mockData.filter(d => d.status === 'approved');
    const totalWeight = approvedData.reduce((sum, d) => sum + d.netWeight, 0);
    const totalValue = approvedData.reduce((sum, d) => sum + d.totalAmount, 0);
    const avgPbGrade = approvedData.reduce((sum, d) => sum + d.pbGrade, 0) / approvedData.length;
    const avgZnGrade = approvedData.reduce((sum, d) => sum + d.znGrade, 0) / approvedData.length;
    const avgMoisture = approvedData.reduce((sum, d) => sum + d.moisture, 0) / approvedData.length;
    
    setStats({
      totalBatches: mockData.length,
      totalWeight: Math.round(totalWeight * 100) / 100,
      avgPbGrade: Math.round(avgPbGrade * 100) / 100,
      avgZnGrade: Math.round(avgZnGrade * 100) / 100,
      totalValue: Math.round(totalValue),
      avgMoisture: Math.round(avgMoisture * 100) / 100
    });
  }, []);

  // 获取供应商列表 - 过滤掉空字符串
  const suppliers = Array.from(new Set(incomingData.map(item => item.supplier).filter(supplier => supplier && supplier.trim() !== '')));

  // 过滤数据
  const filteredData = incomingData.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !selectedDate ||
      item.timestamp.startsWith(format(selectedDate, 'yyyy-MM-dd'));
    
    const matchesSupplier = selectedSupplier === "all" || selectedSupplier === "" ||
      item.supplier === selectedSupplier;
    
    return matchesSearch && matchesDate && matchesSupplier;
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
      "批次号,车牌号,供应商,物料类型,毛重,皮重,净重,铅品位,锌品位,水分,铅金属量,锌金属量,单价,总金额,状态,检验员\n" +
      filteredData.map(row => 
        `${row.id},${row.vehicleNumber},${row.supplier},${row.materialType},${row.grossWeight},${row.tareWeight},${row.netWeight},${row.pbGrade},${row.znGrade},${row.moisture},${row.pbMetal},${row.znMetal},${row.price},${row.totalAmount},${row.status},${row.inspector}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `进厂数据_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'rejected': return 'text-red-500';
      case 'processing': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '已批准';
      case 'pending': return '待审核';
      case 'rejected': return '已拒绝';
      case 'processing': return '处理中';
      default: return '未知';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500" />;
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
            <h1 className="text-lg font-semibold">进厂数据详情</h1>
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
                  <Truck className="h-8 w-8 text-blue-500" />
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
                  <Scale className="h-8 w-8 text-green-500" />
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
                    <p className="text-sm text-muted-foreground">总价值</p>
                    <p className="text-2xl font-bold">{(stats.totalValue / 10000).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">万元</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-red-500" />
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
                  <Package className="h-8 w-8 text-cyan-500" />
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">搜索</Label>
                <Input
                  id="search"
                  placeholder="批次号/车牌号/供应商"
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
                <Label htmlFor="supplier">供应商</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部供应商</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
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
                    setSelectedSupplier("");
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
                进厂数据记录
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
                    <TableHead>车牌号</TableHead>
                    <TableHead>供应商</TableHead>
                    <TableHead>物料类型</TableHead>
                    <TableHead>净重(t)</TableHead>
                    <TableHead>铅品位(%)</TableHead>
                    <TableHead>锌品位(%)</TableHead>
                    <TableHead>水分(%)</TableHead>
                    <TableHead>铅金属(t)</TableHead>
                    <TableHead>锌金属(t)</TableHead>
                    <TableHead>总金额(元)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>检验员</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 15).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.vehicleNumber}</TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>{item.materialType}</TableCell>
                      <TableCell>{item.netWeight}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.pbGrade >= 30 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : item.pbGrade >= 20 ? (
                            <TrendingUp className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span>{item.pbGrade}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.znGrade >= 40 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : item.znGrade >= 30 ? (
                            <TrendingUp className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span>{item.znGrade}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.moisture}</TableCell>
                      <TableCell>{item.pbMetal}</TableCell>
                      <TableCell>{item.znMetal}</TableCell>
                      <TableCell>{item.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          <span className={getStatusColor(item.status)}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.inspector}</TableCell>
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
