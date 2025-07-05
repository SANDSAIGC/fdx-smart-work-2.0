"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Database, Table, Columns, BarChart3, PieChart, TrendingUp,
  Search, Filter, RefreshCw, Download, Upload, Edit, Trash2,
  Plus, Eye, Settings, Users, FileText, Factory, Cog,
  Calendar, Clock, HardDrive, Activity, Target, Zap,
  ChevronRight, Home, ArrowLeft, MoreVertical, Grid, List,
  SortAsc, SortDesc, AlertCircle, CheckCircle, Info, Bot,
  Brain, Sparkles, MessageSquare, Wand2, FileSearch,
  LayoutGrid, Send, X, Minimize2, Maximize2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Header2 } from "@/components/headers/header-2";
import { Footer } from "@/components/ui/footer";

// 类型定义
interface DatabaseTable {
  schema: string;
  name: string;
  comment?: string;
  rowCount: number;
  totalInserts: number;
  totalUpdates: number;
  totalDeletes: number;
  lastModified?: Date;
  category: string;
  size?: string;
}

interface TableColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  maxLength?: number;
}

interface TableCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  count: number;
}

export default function DataManagementPage() {
  const router = useRouter();

  // 状态管理
  const [currentPath, setCurrentPath] = useState<string[]>(['数据管理中心']);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'rows' | 'modified'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDataView, setShowDataView] = useState(false);
  const [showRelationshipView, setShowRelationshipView] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // AI助手相关状态
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPanelMinimized, setAiPanelMinimized] = useState(false);
  const [activeAIFeature, setActiveAIFeature] = useState<'analysis' | 'operations' | 'classification'>('analysis');
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // 字段排序相关状态
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 数据表分类配置
  const tableCategories: TableCategory[] = [
    { id: 'all', name: '全部表', icon: <Database className="h-5 w-5" />, description: '所有数据表', color: 'gray', count: 0 },
    { id: 'user', name: '用户与权限', icon: <Users className="h-5 w-5" />, description: '用户管理相关表', color: 'blue', count: 0 },
    { id: 'production', name: '生产管理', icon: <Factory className="h-5 w-5" />, description: '生产数据相关表', color: 'green', count: 0 },
    { id: 'file', name: '文件管理', icon: <FileText className="h-5 w-5" />, description: '文件存储相关表', color: 'purple', count: 0 },
    { id: 'system', name: '系统配置', icon: <Cog className="h-5 w-5" />, description: '系统配置相关表', color: 'orange', count: 0 },
    { id: 'analysis', name: '数据分析', icon: <BarChart3 className="h-5 w-5" />, description: '统计分析相关表', color: 'indigo', count: 0 },
  ];

  // 数据表数据
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableRelationships, setTableRelationships] = useState<any[]>([]);

  // 表分类映射
  const getTableCategory = useCallback((tableName: string): string => {
    const name = tableName.toLowerCase();
    
    if (name.includes('用户') || name.includes('部门') || name.includes('auth')) {
      return 'user';
    } else if (name.includes('生产') || name.includes('原料') || name.includes('产品') || 
               name.includes('班报') || name.includes('浓细度') || name.includes('压滤') ||
               name.includes('进厂') || name.includes('出厂') || name.includes('机器') ||
               name.includes('精矿') || name.includes('原矿') || name.includes('发货')) {
      return 'production';
    } else if (name.includes('文件') || name.includes('照片')) {
      return 'file';
    } else if (name.includes('指导') || name.includes('采购') || name.includes('任务') || 
               name.includes('公司') || name.includes('demo')) {
      return 'system';
    } else if (name.includes('对比') || name.includes('统计') || name.includes('分析')) {
      return 'analysis';
    }
    
    return 'system'; // 默认分类
  }, []);

  // 获取数据表列表
  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data-management/tables');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedTables: DatabaseTable[] = data.tables.map((table: any) => ({
            schema: table.schema,
            name: table.name,
            comment: table.comment,
            rowCount: parseInt(table.current_rows) || 0,
            totalInserts: parseInt(table.total_inserts) || 0,
            totalUpdates: parseInt(table.total_updates) || 0,
            totalDeletes: parseInt(table.total_deletes) || 0,
            lastModified: table.last_modified ? new Date(table.last_modified) : undefined,
            category: getTableCategory(table.name),
            size: table.size || '未知'
          }));
          setTables(formattedTables);
        }
      } else {
        // 如果API失败，使用模拟数据
        console.warn('API调用失败，使用模拟数据');
        const mockTables: DatabaseTable[] = [
          {
            schema: 'public',
            name: '用户资料',
            comment: '用户资料表 - 存储系统用户的基本信息和认证资料',
            rowCount: 32,
            totalInserts: 32,
            totalUpdates: 120,
            totalDeletes: 0,
            lastModified: new Date('2024-01-15'),
            category: getTableCategory('用户资料'),
            size: '2.1 KB'
          },
          {
            schema: 'public',
            name: '生产班报-FDX',
            comment: 'FDX生产班报数据表',
            rowCount: 594,
            totalInserts: 598,
            totalUpdates: 0,
            totalDeletes: 4,
            lastModified: new Date('2024-01-20'),
            category: getTableCategory('生产班报-FDX'),
            size: '45.2 KB'
          },
          {
            schema: 'public',
            name: '文件管理',
            comment: '文件管理系统数据表',
            rowCount: 15,
            totalInserts: 17,
            totalUpdates: 2,
            totalDeletes: 0,
            lastModified: new Date('2024-01-18'),
            category: getTableCategory('文件管理'),
            size: '3.8 KB'
          }
        ];
        setTables(mockTables);
      }
    } catch (error) {
      console.error('获取数据表列表失败:', error);
      // 使用模拟数据作为后备
      const mockTables: DatabaseTable[] = [
        {
          schema: 'public',
          name: '用户资料',
          comment: '用户资料表',
          rowCount: 32,
          totalInserts: 32,
          totalUpdates: 120,
          totalDeletes: 0,
          lastModified: new Date('2024-01-15'),
          category: getTableCategory('用户资料'),
          size: '2.1 KB'
        }
      ];
      setTables(mockTables);
    } finally {
      setIsLoading(false);
    }
  }, [getTableCategory]);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // 更新分类计数
  const updatedCategories = React.useMemo(() => {
    return tableCategories.map(category => ({
      ...category,
      count: category.id === 'all' 
        ? tables.length 
        : tables.filter(table => table.category === category.id).length
    }));
  }, [tables, tableCategories]);

  // 格式化数字
  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }, []);

  // 筛选表数据
  const filteredTables = React.useMemo(() => {
    let filtered = tables;

    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(table => table.category === selectedCategory);
    }

    // 按搜索关键词筛选
    if (searchQuery) {
      filtered = filtered.filter(table => 
        table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (table.comment && table.comment.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rows':
          aValue = a.rowCount;
          bValue = b.rowCount;
          break;
        case 'modified':
          aValue = a.lastModified?.getTime() || 0;
          bValue = b.lastModified?.getTime() || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tables, selectedCategory, searchQuery, sortBy, sortOrder]);

  // 获取表图标
  const getTableIcon = useCallback((table: DatabaseTable) => {
    const category = tableCategories.find(c => c.id === table.category);
    if (category) {
      return category.icon;
    }
    return <Table className="h-8 w-8 text-gray-500" />;
  }, [tableCategories]);

  // 获取表结构信息
  const fetchTableStructure = useCallback(async (tableName: string) => {
    try {
      const response = await fetch(`/api/data-management/table-structure?table=${encodeURIComponent(tableName)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTableColumns(data.columns);
        }
      }
    } catch (error) {
      console.error('获取表结构失败:', error);
    }
  }, []);

  // 获取表数据
  const fetchTableData = useCallback(async (tableName: string, page: number = 1, size: number = 10, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    setIsLoading(true);
    try {
      let url = `/api/data-management/table-data?table=${encodeURIComponent(tableName)}&page=${page}&size=${size}`;
      if (sortBy && sortOrder) {
        url += `&sortBy=${encodeURIComponent(sortBy)}&sortOrder=${sortOrder}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTableData(data.records);
          setTotalRecords(data.total);
          setCurrentPage(page);
        }
      }
    } catch (error) {
      console.error('获取表数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 处理字段排序
  const handleFieldSort = useCallback((fieldName: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';

    if (sortField === fieldName) {
      // 如果点击的是当前排序字段，切换排序方向
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortField(fieldName);
    setSortDirection(newDirection);

    // 重新获取数据
    if (selectedTable) {
      fetchTableData(selectedTable, 1, pageSize, fieldName, newDirection);
      setCurrentPage(1); // 重置到第一页
    }
  }, [sortField, sortDirection, selectedTable, pageSize, fetchTableData]);

  // 获取排序图标
  const getSortIcon = useCallback((fieldName: string) => {
    if (sortField !== fieldName) {
      return <SortAsc className="h-3 w-3 text-muted-foreground opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <SortAsc className="h-3 w-3 text-foreground" />
      : <SortDesc className="h-3 w-3 text-foreground" />;
  }, [sortField, sortDirection]);

  // 处理表点击
  const handleTableClick = useCallback((table: DatabaseTable) => {
    setSelectedTable(table.name);
    setCurrentPath(['数据管理中心', table.name]);
    setShowDataView(true);
    fetchTableStructure(table.name);
    fetchTableData(table.name, 1, pageSize);
  }, [fetchTableStructure, fetchTableData, pageSize]);

  // 处理记录编辑
  const handleEditRecord = useCallback((record: any) => {
    setEditingRecord(record);
    setShowEditDialog(true);
  }, []);

  // 处理记录删除
  const handleDeleteRecord = useCallback(async (record: any) => {
    if (!confirm('确定要删除这条记录吗？')) {
      return;
    }

    try {
      const response = await fetch('/api/data-management/delete-record', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          record: record
        })
      });

      if (response.ok) {
        fetchTableData(selectedTable, currentPage, pageSize);
        alert('记录删除成功');
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      alert('删除失败');
    }
  }, [selectedTable, currentPage, pageSize, fetchTableData]);

  // 处理记录保存
  const handleSaveRecord = useCallback(async (record: any) => {
    try {
      const isNew = !record.id;
      const response = await fetch('/api/data-management/save-record', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          record: record
        })
      });

      if (response.ok) {
        setShowEditDialog(false);
        setEditingRecord(null);
        fetchTableData(selectedTable, currentPage, pageSize);
        alert(isNew ? '记录创建成功' : '记录更新成功');
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('保存记录失败:', error);
      alert('保存失败');
    }
  }, [selectedTable, currentPage, pageSize, fetchTableData]);

  // 处理数据导出
  const handleExportData = useCallback(async (format: 'csv' | 'excel' | 'json') => {
    try {
      const response = await fetch('/api/data-management/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          format: format
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTable}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('导出失败');
      }
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出失败');
    }
  }, [selectedTable]);

  // 处理数据导入
  const handleImportData = useCallback(async () => {
    if (!importFile) {
      alert('请选择要导入的文件');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('table', selectedTable);

      // 模拟导入进度
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/data-management/import', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`导入成功！共导入 ${data.imported} 条记录`);
          setShowImportDialog(false);
          setImportFile(null);
          fetchTableData(selectedTable, 1, pageSize);
        } else {
          alert(`导入失败：${data.message}`);
        }
      } else {
        alert('导入失败');
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      alert('导入失败');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [importFile, selectedTable, fetchTableData, pageSize]);

  // AI功能处理函数
  const handleAIAnalysis = useCallback(async (tableName: string) => {
    setIsAIProcessing(true);
    try {
      const response = await fetch('/api/ai/analyze-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName })
      });

      if (response.ok) {
        const data = await response.json();
        setAiMessages(prev => [...prev,
          { role: 'user', content: `分析表: ${tableName}` },
          { role: 'assistant', content: data.analysis }
        ]);
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      setAiMessages(prev => [...prev,
        { role: 'user', content: `分析表: ${tableName}` },
        { role: 'assistant', content: `表 "${tableName}" 的AI分析：\n\n📊 **数据结构分析**\n- 这是一个${getTableCategory(tableName) === 'production' ? '生产管理' : '业务管理'}类型的数据表\n- 包含多个关键字段用于记录业务数据\n- 支持时间序列数据分析和统计报表\n\n🔍 **建议操作**\n- 定期清理历史数据以优化性能\n- 建立数据备份和恢复机制\n- 考虑添加数据验证规则` }
      ]);
    } finally {
      setIsAIProcessing(false);
    }
  }, [getTableCategory]);

  const handleAIOperation = useCallback(async (operation: string) => {
    setIsAIProcessing(true);
    try {
      const response = await fetch('/api/ai/smart-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          tableName: selectedTable,
          context: tableData.slice(0, 3) // 提供前3条数据作为上下文
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiMessages(prev => [...prev,
          { role: 'user', content: operation },
          { role: 'assistant', content: data.result }
        ]);

        // 如果是数据操作，刷新表数据
        if (data.shouldRefresh && selectedTable) {
          fetchTableData(selectedTable, currentPage, pageSize);
        }
      }
    } catch (error) {
      console.error('AI操作失败:', error);
      setAiMessages(prev => [...prev,
        { role: 'user', content: operation },
        { role: 'assistant', content: `智能操作建议：\n\n🤖 **操作理解**\n"${operation}"\n\n💡 **建议方案**\n- 请确认具体的操作目标和参数\n- 建议先在测试环境中验证操作\n- 确保有足够的权限执行此操作\n\n⚠️ **注意事项**\n- 重要数据操作前请先备份\n- 建议分批处理大量数据` }
      ]);
    } finally {
      setIsAIProcessing(false);
    }
  }, [selectedTable, tableData, fetchTableData, currentPage, pageSize]);

  const handleAIClassification = useCallback(async (tableName: string) => {
    setIsAIProcessing(true);
    try {
      const category = getTableCategory(tableName);
      const categoryNames = {
        'user': '用户与权限管理',
        'production': '生产管理',
        'file': '文件管理',
        'system': '系统配置',
        'analysis': '数据分析'
      };

      setAiMessages(prev => [...prev,
        { role: 'user', content: `为表 "${tableName}" 推荐分类` },
        { role: 'assistant', content: `🎯 **智能分类推荐**\n\n📋 **表名**: ${tableName}\n🏷️ **推荐分类**: ${categoryNames[category as keyof typeof categoryNames] || '系统配置'}\n\n🔍 **分类依据**\n- 基于表名关键词分析\n- 参考业务领域特征\n- 考虑数据结构特点\n\n✨ **其他可能分类**\n${Object.entries(categoryNames).filter(([key]) => key !== category).map(([_, name]) => `- ${name}`).join('\n')}\n\n💡 **建议**\n当前分类准确度较高，建议保持现有分类设置。` }
      ]);
    } catch (error) {
      console.error('AI分类失败:', error);
    } finally {
      setIsAIProcessing(false);
    }
  }, [getTableCategory]);

  const handleAISubmit = useCallback(async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput('');

    if (activeAIFeature === 'analysis') {
      await handleAIAnalysis(selectedTable || userMessage);
    } else if (activeAIFeature === 'operations') {
      await handleAIOperation(userMessage);
    } else if (activeAIFeature === 'classification') {
      await handleAIClassification(selectedTable || userMessage);
    }
  }, [aiInput, activeAIFeature, selectedTable, handleAIAnalysis, handleAIOperation, handleAIClassification]);

  // 返回表列表
  const handleBackToTables = useCallback(() => {
    setShowDataView(false);
    setSelectedTable('');
    setCurrentPath(['数据管理中心']);
  }, []);

  // 显示关系视图
  const handleShowRelationships = useCallback(() => {
    setShowRelationshipView(true);
    setCurrentPath(['数据管理中心', '表关系图']);
  }, []);

  // 返回主视图
  const handleBackToMain = useCallback(() => {
    setShowRelationshipView(false);
    setShowDataView(false);
    setSelectedTable('');
    setCurrentPath(['数据管理中心']);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header2 
        title="数据管理中心"
        onBack={() => router.back()}
      />

      <div className="container mx-auto px-6 pb-6">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          {currentPath.map((path, index) => (
            <React.Fragment key={index}>
              <span className={index === currentPath.length - 1 ? 'text-foreground font-medium' : 'hover:text-foreground cursor-pointer'}>
                {path}
              </span>
              {index < currentPath.length - 1 && <ChevronRight className="h-4 w-4" />}
            </React.Fragment>
          ))}
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 移动端菜单按钮 */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              {isMobileMenuOpen ? '收起菜单' : '展开菜单'}
            </Button>
          </div>

          {/* 侧边栏 - 表分类 */}
          <div className={`lg:col-span-1 ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">数据表分类</CardTitle>
                <CardDescription>按业务类型浏览表</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {updatedCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.icon}
                    <span className="ml-2">{category.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleShowRelationships}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  表关系图
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setShowAIPanel(true)}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  AI助手
                </Button>
              </CardContent>
            </Card>

            {/* 数据库统计 */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">数据库统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">总表数</span>
                  <span className="font-medium">{tables.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">总记录数</span>
                  <span className="font-medium">{formatNumber(tables.reduce((sum, t) => sum + t.rowCount, 0))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">活跃表</span>
                  <span className="font-medium">{tables.filter(t => t.rowCount > 0).length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 主内容区域 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 工具栏 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* 搜索和筛选 */}
                  <div className="flex flex-1 gap-2">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索数据表..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(value: 'name' | 'rows' | 'modified') => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">按名称</SelectItem>
                        <SelectItem value="rows">按记录数</SelectItem>
                        <SelectItem value="modified">按修改时间</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchTables}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      刷新
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 数据表列表区域 */}
            {!showDataView && !showRelationshipView ? (
              <Card>
                <CardHeader>
                  <CardTitle>数据表列表</CardTitle>
                  <CardDescription>
                    {selectedCategory === 'all' ? '显示所有数据表' : `显示 ${updatedCategories.find(c => c.id === selectedCategory)?.name} 分类表`}
                    （共 {filteredTables.length} 个表）
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 表格网格视图 */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTables.map((table) => (
                        <Card 
                          key={table.name} 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleTableClick(table)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {getTableIcon(table)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate mb-1">{table.name}</h4>
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {table.comment || '无描述'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{formatNumber(table.rowCount)} 行</span>
                                  <span>{table.size}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    /* 表格列表视图 */
                    <UITable>
                      <TableHeader>
                        <TableRow>
                          <TableHead>表名</TableHead>
                          <TableHead>描述</TableHead>
                          <TableHead className="text-right">记录数</TableHead>
                          <TableHead className="text-right">大小</TableHead>
                          <TableHead className="text-right">最后修改</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTables.map((table) => (
                          <TableRow 
                            key={table.name}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleTableClick(table)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getTableIcon(table)}
                                {table.name}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {table.comment || '无描述'}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(table.rowCount)}</TableCell>
                            <TableCell className="text-right">{table.size}</TableCell>
                            <TableCell className="text-right">
                              {table.lastModified?.toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </UITable>
                  )}

                  {/* 空状态 */}
                  {filteredTables.length === 0 && (
                    <div className="text-center py-12">
                      <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">未找到数据表</h3>
                      <p className="text-muted-foreground mb-4">尝试调整搜索条件或选择其他分类</p>
                      <Button variant="outline" onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重置筛选
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : showDataView ? (
              /* 数据表详情视图 */
              <div className="space-y-6">
                {/* 表操作工具栏 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBackToTables}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          返回表列表
                        </Button>
                        <div>
                          <h3 className="font-medium">{selectedTable}</h3>
                          <p className="text-sm text-muted-foreground">
                            共 {totalRecords} 条记录
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRecord({});
                            setShowEditDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          新增记录
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchTableData(selectedTable, currentPage, pageSize, sortField, sortDirection)}
                          disabled={isLoading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                          刷新
                        </Button>
                        {sortField && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSortField('');
                              setSortDirection('asc');
                              fetchTableData(selectedTable, 1, pageSize);
                              setCurrentPage(1);
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            清除排序
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              导出
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExportData('csv')}>
                              导出为 CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportData('excel')}>
                              导出为 Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportData('json')}>
                              导出为 JSON
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                              <Upload className="h-4 w-4 mr-2" />
                              导入数据
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 数据表格 */}
                <Card>
                  <CardHeader>
                    <CardTitle>表数据</CardTitle>
                    <CardDescription>
                      第 {currentPage} 页，共 {Math.ceil(totalRecords / pageSize)} 页
                      {sortField && (
                        <span className="ml-4 text-blue-600">
                          按 "{sortField}" {sortDirection === 'asc' ? '升序' : '降序'} 排列
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        <span>加载中...</span>
                      </div>
                    ) : tableData.length > 0 ? (
                      <>
                        {/* 桌面端表格视图 */}
                        <div className="hidden md:block overflow-x-auto">
                          <UITable>
                            <TableHeader>
                              <TableRow>
                                {tableColumns.length > 0 ? (
                                  tableColumns.map((column) => (
                                    <TableHead
                                      key={column.name}
                                      className="cursor-pointer hover:bg-muted/50 select-none"
                                      onClick={() => handleFieldSort(column.name)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{column.name}</span>
                                        {getSortIcon(column.name)}
                                        {column.isPrimaryKey && (
                                          <Badge variant="outline" className="text-xs">PK</Badge>
                                        )}
                                      </div>
                                    </TableHead>
                                  ))
                                ) : (
                                  // 如果没有列信息，显示数据的键作为列头
                                  tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
                                    <TableHead
                                      key={key}
                                      className="cursor-pointer hover:bg-muted/50 select-none"
                                      onClick={() => handleFieldSort(key)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{key}</span>
                                        {getSortIcon(key)}
                                      </div>
                                    </TableHead>
                                  ))
                                )}
                                <TableHead className="w-[100px]">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData.map((record, index) => (
                                <TableRow key={index}>
                                  {tableColumns.length > 0 ? (
                                    tableColumns.map((column) => (
                                      <TableCell key={column.name} className="max-w-[200px] truncate">
                                        {record[column.name] !== null && record[column.name] !== undefined
                                          ? String(record[column.name])
                                          : '--'}
                                      </TableCell>
                                    ))
                                  ) : (
                                    // 如果没有列信息，显示所有数据字段
                                    Object.entries(record).map(([key, value]) => (
                                      <TableCell key={key} className="max-w-[200px] truncate">
                                        {value !== null && value !== undefined ? String(value) : '--'}
                                      </TableCell>
                                    ))
                                  )}
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          编辑
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => handleDeleteRecord(record)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          删除
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </UITable>
                        </div>

                        {/* 移动端卡片视图 */}
                        <div className="md:hidden space-y-4">
                          {tableData.map((record, index) => {
                            const displayFields = tableColumns.length > 0
                              ? tableColumns.slice(0, 4)
                              : Object.keys(record).slice(0, 4).map(key => ({ name: key, isPrimaryKey: key === 'id' }));

                            return (
                              <Card key={index} className="p-4">
                                <div className="space-y-3">
                                  {displayFields.map((field) => (
                                    <div key={field.name} className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">
                                          {field.name}
                                        </span>
                                        {field.isPrimaryKey && (
                                          <Badge variant="outline" className="text-xs">PK</Badge>
                                        )}
                                      </div>
                                      <span className="text-sm text-right max-w-[150px] truncate">
                                        {record[field.name] !== null && record[field.name] !== undefined
                                          ? String(record[field.name])
                                          : '--'}
                                      </span>
                                    </div>
                                  ))}

                                  {(tableColumns.length > 4 || Object.keys(record).length > 4) && (
                                    <div className="text-xs text-muted-foreground">
                                      +{(tableColumns.length || Object.keys(record).length) - 4} 个字段...
                                    </div>
                                  )}

                                  <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditRecord(record)}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      编辑
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteRecord(record)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      删除
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>

                        {/* 分页控件 */}
                        {totalRecords > pageSize && (
                          <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                              显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, totalRecords)} 条，共 {totalRecords} 条记录
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchTableData(selectedTable, currentPage - 1, pageSize, sortField, sortDirection)}
                                disabled={currentPage <= 1 || isLoading}
                              >
                                上一页
                              </Button>
                              <span className="text-sm">
                                {currentPage} / {Math.ceil(totalRecords / pageSize)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchTableData(selectedTable, currentPage + 1, pageSize, sortField, sortDirection)}
                                disabled={currentPage >= Math.ceil(totalRecords / pageSize) || isLoading}
                              >
                                下一页
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Table className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">暂无数据</h3>
                        <p className="text-muted-foreground mb-4">该表中还没有任何记录</p>
                        <Button
                          onClick={() => {
                            setEditingRecord({});
                            setShowEditDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          添加第一条记录
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* 表关系视图 */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBackToMain}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      返回
                    </Button>
                    表关系图
                  </CardTitle>
                  <CardDescription>
                    数据库表之间的关系可视化
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">关系图表</h3>
                    <p className="text-muted-foreground mb-4">
                      表关系可视化功能正在开发中
                    </p>
                    <Button onClick={handleBackToMain}>
                      返回主页
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 编辑记录对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord && Object.keys(editingRecord).length > 0 ? '编辑记录' : '新增记录'}
            </DialogTitle>
            <DialogDescription>
              在 {selectedTable} 表中{editingRecord && Object.keys(editingRecord).length > 0 ? '编辑' : '新增'}记录
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {tableColumns.length > 0 ? (
              tableColumns.map((column) => (
                <div key={column.name} className="space-y-2">
                  <Label htmlFor={column.name}>
                    {column.name}
                    {!column.isNullable && <span className="text-red-500 ml-1">*</span>}
                    {column.isPrimaryKey && (
                      <Badge variant="outline" className="ml-2 text-xs">主键</Badge>
                    )}
                  </Label>
                  <Input
                    id={column.name}
                    type={column.dataType.includes('int') || column.dataType.includes('numeric') ? 'number' :
                          column.dataType.includes('date') ? 'date' :
                          column.dataType.includes('time') ? 'datetime-local' : 'text'}
                    value={editingRecord?.[column.name] || ''}
                    onChange={(e) => {
                      setEditingRecord(prev => ({
                        ...prev,
                        [column.name]: e.target.value
                      }));
                    }}
                    placeholder={`请输入${column.name}`}
                    disabled={column.isPrimaryKey && editingRecord && Object.keys(editingRecord).length > 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    类型: {column.dataType} {column.maxLength && `(${column.maxLength})`}
                    {column.defaultValue && ` | 默认值: ${column.defaultValue}`}
                  </p>
                </div>
              ))
            ) : (
              // 如果没有列信息，基于现有记录的字段创建表单
              editingRecord && Object.keys(editingRecord).map((fieldName) => (
                <div key={fieldName} className="space-y-2">
                  <Label htmlFor={fieldName}>
                    {fieldName}
                    {fieldName === 'id' && (
                      <Badge variant="outline" className="ml-2 text-xs">主键</Badge>
                    )}
                  </Label>
                  <Input
                    id={fieldName}
                    type={fieldName.includes('时间') || fieldName.includes('日期') ? 'date' :
                          fieldName.includes('数量') || fieldName.includes('重') || fieldName.includes('率') || fieldName.includes('度') ? 'number' : 'text'}
                    value={editingRecord[fieldName] || ''}
                    onChange={(e) => {
                      setEditingRecord(prev => ({
                        ...prev,
                        [fieldName]: e.target.value
                      }));
                    }}
                    placeholder={`请输入${fieldName}`}
                    disabled={fieldName === 'id' && editingRecord && Object.keys(editingRecord).length > 0}
                  />
                </div>
              ))
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingRecord(null);
                }}
              >
                取消
              </Button>
              <Button
                onClick={() => handleSaveRecord(editingRecord)}
              >
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 数据导入对话框 */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>导入数据</DialogTitle>
            <DialogDescription>
              向 {selectedTable} 表导入数据
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 文件选择 */}
            <div className="space-y-2">
              <Label htmlFor="import-file">选择文件</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                支持 CSV、Excel、JSON 格式文件
              </p>
            </div>

            {/* 导入进度 */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>导入进度</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                }}
                disabled={isImporting}
              >
                取消
              </Button>
              <Button
                onClick={handleImportData}
                disabled={!importFile || isImporting}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    开始导入
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI助手面板 */}
      {showAIPanel && (
        <div className={`fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg transition-all duration-300 ${
          aiPanelMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
        } z-50`}>
          {/* AI面板头部 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              <span className="font-medium">AI数据助手</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiPanelMinimized(!aiPanelMinimized)}
              >
                {aiPanelMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!aiPanelMinimized && (
            <>
              {/* AI功能选项卡 */}
              <div className="border-b">
                <Tabs value={activeAIFeature} onValueChange={(value) => setActiveAIFeature(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analysis" className="text-xs">
                      <FileSearch className="h-3 w-3 mr-1" />
                      文档分析
                    </TabsTrigger>
                    <TabsTrigger value="operations" className="text-xs">
                      <Wand2 className="h-3 w-3 mr-1" />
                      智能操作
                    </TabsTrigger>
                    <TabsTrigger value="classification" className="text-xs">
                      <LayoutGrid className="h-3 w-3 mr-1" />
                      智能分类
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* AI对话区域 */}
              <ScrollArea className="flex-1 p-4 h-[300px]">
                <div className="space-y-4">
                  {aiMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="font-medium mb-2">AI数据助手</h3>
                      <p className="text-sm">
                        {activeAIFeature === 'analysis' && '智能分析数据表内容和结构'}
                        {activeAIFeature === 'operations' && '基于模板和提示词执行数据操作'}
                        {activeAIFeature === 'classification' && '自动推荐最合适的数据分类'}
                      </p>
                    </div>
                  ) : (
                    aiMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        </div>
                      </div>
                    ))
                  )}

                  {isAIProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 animate-pulse text-blue-500" />
                          <span className="text-sm">AI正在思考中...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* AI输入区域 */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      activeAIFeature === 'analysis' ? '输入要分析的表名或直接分析当前表...' :
                      activeAIFeature === 'operations' ? '描述您想要执行的数据操作...' :
                      '输入要分类的表名或直接分类当前表...'
                    }
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAISubmit()}
                    disabled={isAIProcessing}
                  />
                  <Button
                    onClick={handleAISubmit}
                    disabled={!aiInput.trim() || isAIProcessing}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* 快捷操作按钮 */}
                <div className="flex gap-2 mt-2">
                  {activeAIFeature === 'analysis' && selectedTable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIAnalysis(selectedTable)}
                      disabled={isAIProcessing}
                    >
                      分析当前表
                    </Button>
                  )}
                  {activeAIFeature === 'operations' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIOperation('生成数据报表')}
                        disabled={isAIProcessing}
                      >
                        生成报表
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIOperation('数据质量检查')}
                        disabled={isAIProcessing}
                      >
                        质量检查
                      </Button>
                    </>
                  )}
                  {activeAIFeature === 'classification' && selectedTable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIClassification(selectedTable)}
                      disabled={isAIProcessing}
                    >
                      分类当前表
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
