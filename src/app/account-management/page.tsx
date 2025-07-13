"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, User, Users, CheckCircle, Clock,
  AlertTriangle, Search, Filter, Edit, Trash2, Eye,
  RefreshCw, Shield, UserCheck, UserX, Settings,
  Mail, Phone, Calendar, Badge as BadgeIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Footer } from "@/components/ui/footer";
import { format } from "date-fns";

// 用户账号接口
interface UserAccount {
  id: string;
  账号: string;
  姓名: string;
  部门: string;
  职称: string;
  状态: '待审核' | '正常' | '停用';
  创建时间: string;
  最后登录: string;
  邮箱?: string;
  电话?: string;
}

// 账号统计接口
interface AccountStats {
  totalAccounts: number;
  pendingAccounts: number;
  activeAccounts: number;
  disabledAccounts: number;
  newAccountsThisMonth: number;
}

// 定义排序类型
type SortField = '账号' | '姓名' | '部门' | '创建时间';
type SortDirection = 'asc' | 'desc';

export default function AccountManagementPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [stats, setStats] = useState<AccountStats>({
    totalAccounts: 0,
    pendingAccounts: 0,
    activeAccounts: 0,
    disabledAccounts: 0,
    newAccountsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('创建时间');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);

  // 获取账号数据
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
        
        // 计算统计数据
        const totalAccounts = data.length;
        const pendingAccounts = data.filter((acc: UserAccount) => acc.状态 === '待审核').length;
        const activeAccounts = data.filter((acc: UserAccount) => acc.状态 === '正常').length;
        const disabledAccounts = data.filter((acc: UserAccount) => acc.状态 === '停用').length;
        
        // 计算本月新增账号
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const newAccountsThisMonth = data.filter((acc: UserAccount) => {
          const createDate = new Date(acc.创建时间);
          return createDate.getMonth() === thisMonth && createDate.getFullYear() === thisYear;
        }).length;

        setStats({
          totalAccounts,
          pendingAccounts,
          activeAccounts,
          disabledAccounts,
          newAccountsThisMonth
        });
      }
    } catch (error) {
      console.error('获取账号数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 审核账号
  const approveAccount = async (accountId: string) => {
    try {
      const response = await fetch('/api/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: accountId }),
      });

      if (response.ok) {
        await fetchAccounts(); // 刷新数据
      }
    } catch (error) {
      console.error('审核账号失败:', error);
    }
  };

  // 停用/启用账号
  const toggleAccountStatus = async (accountId: string, newStatus: '正常' | '停用') => {
    try {
      const response = await fetch('/api/users/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: accountId, status: newStatus }),
      });

      if (response.ok) {
        await fetchAccounts(); // 刷新数据
      }
    } catch (error) {
      console.error('更新账号状态失败:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 过滤和排序账号
  const filteredAndSortedAccounts = accounts
    .filter(account => {
      const matchesSearch = 
        account.账号.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.姓名.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.部门.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || account.状态 === statusFilter;
      const matchesDepartment = departmentFilter === "all" || account.部门 === departmentFilter;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // 获取状态徽章样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '待审核':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">待审核</Badge>;
      case '正常':
        return <Badge variant="outline" className="text-green-600 border-green-600">正常</Badge>;
      case '停用':
        return <Badge variant="outline" className="text-red-600 border-red-600">停用</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 获取部门列表
  const departments = Array.from(new Set(accounts.map(acc => acc.部门)));

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">账号管理</h1>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">总账号数</p>
                  <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">待审核</p>
                  <p className="text-2xl font-bold">{stats.pendingAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">正常账号</p>
                  <p className="text-2xl font-bold">{stats.activeAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserX className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">停用账号</p>
                  <p className="text-2xl font-bold">{stats.disabledAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Plus className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">本月新增</p>
                  <p className="text-2xl font-bold">{stats.newAccountsThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索账号、姓名或部门..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="待审核">待审核</SelectItem>
                  <SelectItem value="正常">正常</SelectItem>
                  <SelectItem value="停用">停用</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="部门筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={fetchAccounts}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 账号列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>账号列表</span>
              <span className="text-sm font-normal text-muted-foreground">
                共 {filteredAndSortedAccounts.length} 个账号
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>操作</TableHead>
                    <TableHead>账号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>职称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>最后登录</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          加载中...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAndSortedAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        暂无账号数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {account.状态 === '待审核' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveAccount(account.id)}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                审核
                              </Button>
                            )}
                            {account.状态 === '正常' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAccountStatus(account.id, '停用')}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <UserX className="h-3 w-3 mr-1" />
                                停用
                              </Button>
                            )}
                            {account.状态 === '停用' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAccountStatus(account.id, '正常')}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                启用
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowAccountDialog(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{account.账号}</TableCell>
                        <TableCell>{account.姓名}</TableCell>
                        <TableCell>{account.部门}</TableCell>
                        <TableCell>{account.职称}</TableCell>
                        <TableCell>{getStatusBadge(account.状态)}</TableCell>
                        <TableCell>
                          {account.创建时间 ? format(new Date(account.创建时间), 'yyyy-MM-dd HH:mm') : '-'}
                        </TableCell>
                        <TableCell>
                          {account.最后登录 ? format(new Date(account.最后登录), 'yyyy-MM-dd HH:mm') : '从未登录'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 账号详情对话框 */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>账号详情</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">账号</Label>
                  <p className="text-sm">{selectedAccount.账号}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">姓名</Label>
                  <p className="text-sm">{selectedAccount.姓名}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">部门</Label>
                  <p className="text-sm">{selectedAccount.部门}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">职称</Label>
                  <p className="text-sm">{selectedAccount.职称}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">状态</Label>
                  <div className="mt-1">{getStatusBadge(selectedAccount.状态)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">创建时间</Label>
                  <p className="text-sm">
                    {selectedAccount.创建时间 ? format(new Date(selectedAccount.创建时间), 'yyyy-MM-dd HH:mm') : '-'}
                  </p>
                </div>
              </div>
              {selectedAccount.邮箱 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">邮箱</Label>
                  <p className="text-sm">{selectedAccount.邮箱}</p>
                </div>
              )}
              {selectedAccount.电话 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">电话</Label>
                  <p className="text-sm">{selectedAccount.电话}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">最后登录</Label>
                <p className="text-sm">
                  {selectedAccount.最后登录 ? format(new Date(selectedAccount.最后登录), 'yyyy-MM-dd HH:mm') : '从未登录'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer组件 */}
      <Footer />
    </div>
  );
}
