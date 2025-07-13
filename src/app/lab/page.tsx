"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/ui/footer";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Skeleton } from "@/components/ui/skeleton";
import { HamburgerMenu } from "@/components/hamburger-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Beaker,
  Clock,
  Filter,
  Truck,
  FlaskConical,
  Search,
  RefreshCw,
  Moon,
  Sun,
  Calendar,
  Package,
  Mountain,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  TruckIcon
} from "lucide-react";
import { useTheme } from "next-themes";

import { formatValue as formatValueUtil } from '@/lib/formatters';

// 简化的数据类型定义
interface SampleData {
  id: string;
  record_date?: string;
  shipment_date?: string;
  shift?: string;
  mineral_type?: string;
  element?: string;
  grade_value?: number | null;
  moisture_value?: number | null;
  filter_press_number?: string;
  operator?: string; // 操作员字段
  supplier?: string;
  purchasing_unit_name?: string;
  assayed_metal_element?: string;
  sample_number?: string; // 样品编号字段
  shipment_sample_grade_percentage?: number | null;
  shipment_sample_moisture_percentage?: number | null;
  created_at?: string;
  updated_at?: string;
}

type DataSource = 'shift_samples' | 'filter_samples' | 'incoming_samples' | 'outgoing_sample';

interface LabDateRange {
  from: Date;
  to: Date;
}



// 主题切换组件
function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          浅色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          深色
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          系统
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}





function LabPageContent() {
  const router = useRouter();

  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tableData, setTableData] = useState<SampleData[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource>('shift_samples');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 排序状态管理
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // 详情对话框状态
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<SampleData | null>(null);
  const [rawRowData, setRawRowData] = useState<any>(null);

  // 编辑状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);



  // 日期选择状态 - 默认为全部周期的日期范围
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    // 全部周期开始日期：2025年4月26日
    return new Date('2025-04-26');
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());







  // 快速日期选择功能
  const setQuickDateRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start);
    setEndDate(end);
  }, []);


































  // 数据源标签映射
  const dataSourceLabel = {
    'shift_samples': '班样',
    'filter_samples': '压滤样',
    'incoming_samples': '进厂样',
    'outgoing_sample': '出厂样'
  };

  // 专项作业区配置
  const workAreas = [
    {
      icon: Clock,
      label: "班样",
      description: "班次样品化验",
      dataSource: 'shift_samples' as DataSource,
      isNavigationButton: true,
      route: '/shift-sample'
    },
    {
      icon: Filter,
      label: "压滤样",
      description: "压滤机样品化验",
      dataSource: 'filter_samples' as DataSource,
      isNavigationButton: true,
      route: '/filter-sample'
    },
    {
      icon: Beaker,
      label: "进厂样",
      description: "进厂原矿化验",
      dataSource: 'incoming_samples' as DataSource,
      isNavigationButton: true,
      route: '/incoming-sample'
    },
    {
      icon: Truck,
      label: "出厂样",
      description: "出厂精矿化验",
      dataSource: 'outgoing_sample' as DataSource,
      isNavigationButton: true,
      route: '/outgoing-sample'
    },
    {
      icon: Package,
      label: "出厂样内部取样",
      description: "内部取样化验",
      dataSource: 'outgoing_sample' as DataSource,
      isNavigationButton: true,
      route: '/outgoing-sample-internal'
    },
    {
      icon: Mountain,
      label: "精矿堆摸底样",
      description: "精矿堆摸底取样",
      dataSource: 'shift_samples' as DataSource,
      isNavigationButton: true,
      route: '/concentrate-pile-sampling'
    }
  ];

  // 获取生产周期数据
  const fetchProductionCycles = useCallback(async () => {
    try {
      const response = await fetch('/api/boss/production-cycles');
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 [生产周期] 获取成功:', data);
        return data;
      } else {
        console.error('🔄 [生产周期] 获取失败:', response.status);
        return [];
      }
    } catch (error) {
      console.error('🔄 [生产周期] 获取异常:', error);
      return [];
    }
  }, []);



  // 数据获取函数
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 构建API URL参数
      const params = new URLSearchParams({
        sampleType: selectedDataSource,
        limit: '50'
      });

      // 添加日期范围参数
      if (startDate) {
        params.append('startDate', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/lab-data?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // 转换API数据格式以匹配组件期望的格式
        const transformedData: SampleData[] = result.data.map((item: any) => ({
          id: item.id,
          record_date: item.日期 || item.出厂日期,
          shipment_date: item.出厂日期,
          element: item.元素 || item.化验元素,
          grade_value: parseFloat(item.品位 || item.出厂样品位) || 0,
          moisture_value: parseFloat(item.水分 || item.出厂样水分) || 0,
          shift: item.班次,
          mineral_type: item.矿物类型,
          supplier: item.供应商,
          purchasing_unit_name: item.采购单位,
          filter_press_number: item.压滤机编号,
          operator: item.化验人员, // 添加化验人员字段映射
          sample_number: item.样品编号, // 添加样品编号字段映射
          assayed_metal_element: item.元素,
          shipment_sample_grade_percentage: parseFloat(item.出厂样品位) || null,
          shipment_sample_moisture_percentage: parseFloat(item.出厂样水分) || null,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

        setTableData(transformedData);
        console.log(`成功获取 ${transformedData.length} 条 ${dataSourceLabel[selectedDataSource]} 数据`);
      } else {
        console.error('API 错误:', result.error);
        setTableData([]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDataSource, startDate, endDate]);

  // 数据源切换
  const handleDataSourceChange = useCallback(async (source: DataSource) => {
    setSelectedDataSource(source);
  }, []);

  // 处理专项作业区点击
  const handleWorkAreaClick = useCallback((area: typeof workAreas[0]) => {
    if (area.isNavigationButton && area.route) {
      router.push(area.route);
    } else {
      handleDataSourceChange(area.dataSource);
    }
  }, [router, handleDataSourceChange]);



  // 格式化数值显示 - 支持智能单位识别
  const formatValue = useCallback((value: any, unit?: string, precision?: number) => {
    if (value === null || value === undefined || value === '') return '--';

    // 如果指定了精度，直接使用
    if (precision !== undefined) {
      if (typeof value === 'number') return value.toFixed(precision);
      return value.toString();
    }

    // 使用统一的格式化工具，支持智能单位识别
    return formatValueUtil(value, unit);
  }, []);

  // 排序函数
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      // 如果点击的是同一个字段，切换排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击的是新字段，设置为降序
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  // 导出EXCEL功能
  const exportToExcel = useCallback(() => {
    if (tableData.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 根据数据源类型定义表头
    let headers: string[] = [];
    let dataRows: string[][] = [];

    switch (selectedDataSource) {
      case 'shift_samples':
        headers = ['日期', '班次', '矿物类型', '元素', '品位(%)', '水分(%)'];
        dataRows = tableData.map(item => [
          item.record_date || '--',
          item.shift || '--',
          item.mineral_type || '--',
          item.element || '--',
          formatValue(item.grade_value, undefined, 2),
          formatValue(item.moisture_value, undefined, 2)
        ]);
        break;
      case 'filter_samples':
        headers = ['日期', '元素', '品位(%)', '水分(%)', '化验人员'];
        dataRows = tableData.map(item => [
          item.record_date || '--',
          item.element || '--',
          formatValue(item.grade_value, undefined, 2),
          formatValue(item.moisture_value, undefined, 2),
          item.operator || '--'
        ]);
        break;
      case 'incoming_samples':
        headers = ['日期', '元素', '品位(%)', '水分(%)', '供应商', '原矿类型'];
        dataRows = tableData.map(item => [
          item.record_date || '--',
          item.element || '--',
          formatValue(item.grade_value, undefined, 2),
          formatValue(item.moisture_value, undefined, 2),
          item.supplier || '--',
          item.mineral_type || '--'
        ]);
        break;
      case 'outgoing_sample':
        headers = ['日期', '样品编号', '元素', '品位(%)', '水分(%)', '采购单位'];
        dataRows = tableData.map(item => [
          item.shipment_date || '--',
          item.sample_number || '--',
          item.element || '--',
          formatValue(item.grade_value, undefined, 2),
          formatValue(item.moisture_value, undefined, 2),
          item.purchasing_unit_name || '--'
        ]);
        break;
    }

    // 创建CSV内容
    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.join(','))
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `化验数据_${dataSourceLabel[selectedDataSource]}_${startDate?.toISOString().split('T')[0]}_${endDate?.toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [tableData, selectedDataSource, dataSourceLabel, formatValue, startDate, endDate]);

  // 排序数据
  const sortedTableData = React.useMemo(() => {
    if (!sortField) return tableData;

    return [...tableData].sort((a, b) => {
      let aValue = a[sortField as keyof SampleData];
      let bValue = b[sortField as keyof SampleData];

      // 处理null和undefined值
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // 数值类型排序
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 日期类型排序
      if (sortField.includes('date') || sortField.includes('Date')) {
        const dateA = new Date(aValue as string);
        const dateB = new Date(bValue as string);
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }

      // 字符串类型排序
      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [tableData, sortField, sortDirection]);

  // 分页数据处理
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedTableData.slice(startIndex, endIndex);
  }, [sortedTableData, currentPage, itemsPerPage]);

  // 处理详情按钮点击 - 获取完整数据并打开详情对话框
  const handleDetailClick = useCallback(async (item: SampleData) => {
    try {
      // 获取该记录的完整原始数据
      // 对于合成ID（如 "8-zn"），需要提取实际的数据库ID
      const actualId = item.id.includes('-') ? item.id.split('-')[0] : item.id;

      console.log('🔍 开始获取详细数据:', { selectedDataSource, actualId, originalId: item.id });

      const response = await fetch(`/api/lab-data/detail?sampleType=${selectedDataSource}&id=${actualId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log('✅ 详细数据获取成功:', result.data);

        // 使用获取到的完整原始数据
        const rawData = result.data;

        // 为了保持兼容性，我们需要将原始数据转换为显示格式
        let displayData = { ...item };

        // 如果是班样数据，需要根据当前选择的元素类型设置正确的显示数据
        if (selectedDataSource === 'shift_samples') {
          const elementType = item.id.includes('-') ? item.id.split('-')[1] : 'zn';

          if (elementType === 'zn') {
            displayData.grade_value = rawData['氧化锌原矿-Zn全品位（%）'] || rawData['氧化锌精矿-Zn品位（%）'] || 0;
            displayData.moisture_value = rawData['氧化锌原矿-水份（%）'] || 0;
            displayData.mineral_type = rawData['氧化锌原矿-Zn全品位（%）'] ? '氧化锌原矿' : '氧化锌精矿';
          } else if (elementType === 'pb') {
            displayData.grade_value = rawData['氧化锌原矿-Pb全品位（%）'] || rawData['氧化锌精矿-Pb品位（%）'] || 0;
            displayData.moisture_value = rawData['氧化锌原矿-水份（%）'] || 0;
            displayData.mineral_type = rawData['氧化锌原矿-Pb全品位（%）'] ? '氧化锌原矿' : '氧化锌精矿';
          }
        } else if (selectedDataSource === 'filter_samples') {
          const elementType = item.id.includes('-') ? item.id.split('-')[1] : 'zn';

          if (elementType === 'zn') {
            displayData.grade_value = rawData['锌品位'] || 0;
            displayData.moisture_value = rawData['水份'] || 0;
          } else if (elementType === 'pb') {
            displayData.grade_value = rawData['铅品位'] || 0;
            displayData.moisture_value = rawData['水份'] || 0;
          }
        }

        setSelectedRowData(displayData);
        setRawRowData(rawData);
        setEditedData({ ...rawData }); // 初始化编辑数据
        setIsEditing(false); // 重置编辑状态
        setIsDetailDialogOpen(true);
      } else {
        console.error('❌ 获取详细数据失败:', result.error);
        alert(`获取详细数据失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('❌ 获取详细数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '网络连接失败';
      alert(`获取详细数据失败: ${errorMessage}`);
    }
  }, [selectedDataSource]);

  // 保存编辑数据
  const handleSaveEdit = useCallback(async () => {
    if (!editedData || !selectedRowData) return;

    setIsSaving(true);
    try {
      // 获取实际的数据库ID
      const actualId = selectedRowData.id.includes('-') ? selectedRowData.id.split('-')[0] : selectedRowData.id;

      const response = await fetch('/api/lab-data/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sampleType: selectedDataSource,
          id: actualId,
          data: editedData
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 更新本地数据
        setRawRowData({ ...editedData });
        setIsEditing(false);

        // 刷新表格数据
        await fetchData();

        console.log('✅ 数据保存成功');
      } else {
        console.error('❌ 保存失败:', result.error);
        alert('保存失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 保存数据时发生错误:', error);
      alert('保存失败，请检查网络连接');
    } finally {
      setIsSaving(false);
    }
  }, [editedData, selectedRowData, selectedDataSource, fetchData]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditedData({ ...rawRowData }); // 重置为原始数据
    setIsEditing(false);
  }, [rawRowData]);

  // 开始编辑
  const handleStartEdit = useCallback(() => {
    console.log('🔧 开始编辑模式');
    console.log('当前编辑状态:', isEditing);
    console.log('原始数据:', rawRowData);
    console.log('编辑数据:', editedData);
    setIsEditing(true);
    console.log('设置编辑状态为 true');
  }, [isEditing, rawRowData, editedData]);

  // 处理字段值变更
  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [fieldKey]: value
    }));
  }, []);

  // 渲染详情对话框内容
  const renderDetailContent = useCallback(() => {
    console.log('🎨 渲染详情内容, 当前编辑状态:', isEditing);
    if (!rawRowData || !selectedRowData) return null;

    const dataSourceTitles = {
      'shift_samples': '班样数据详情',
      'filter_samples': '压滤样数据详情',
      'incoming_samples': '进厂样数据详情',
      'outgoing_sample': '出厂样数据详情'
    };

    const dataSourceTables = {
      'shift_samples': '生产班报-FDX',
      'filter_samples': '压滤样化验记录',
      'incoming_samples': '进厂原矿-FDX',
      'outgoing_sample': '出厂精矿-FDX'
    };

    // 根据数据源类型定义字段显示顺序（与数据库字段顺序一致）
    const getFieldsForDataSource = () => {
      switch (selectedDataSource) {
        case 'shift_samples':
          return [
            { key: 'id', label: '记录ID', type: 'text' },
            { key: '日期', label: '日期', type: 'date' },
            { key: '班次', label: '班次', type: 'text' },
            { key: '氧化锌原矿-湿重（t）', label: '氧化锌原矿-湿重（t）', type: 'number' },
            { key: '氧化锌原矿-水份（%）', label: '氧化锌原矿-水份（%）', type: 'number' },
            { key: '氧化锌原矿-干重（t）', label: '氧化锌原矿-干重（t）', type: 'number' },
            { key: '氧化锌原矿-Pb全品位（%）', label: '氧化锌原矿-Pb全品位（%）', type: 'number' },
            { key: '氧化锌原矿-Zn全品位（%）', label: '氧化锌原矿-Zn全品位（%）', type: 'number' },
            { key: '氧化锌精矿-数量（t）', label: '氧化锌精矿-数量（t）', type: 'number' },
            { key: '氧化锌精矿-Pb品位（%）', label: '氧化锌精矿-Pb品位（%）', type: 'number' },
            { key: '氧化锌精矿-Zn品位（%）', label: '氧化锌精矿-Zn品位（%）', type: 'number' },
            { key: '尾矿-数量（t）', label: '尾矿-数量（t）', type: 'number' },
            { key: '尾矿-Pb全品位（%）', label: '尾矿-Pb全品位（%）', type: 'number' },
            { key: '尾矿-Zn全品位（%）', label: '尾矿-Zn全品位（%）', type: 'number' },
            { key: '氧化矿Zn理论回收率（%）', label: '氧化矿Zn理论回收率（%）', type: 'number' },
            { key: 'created_at', label: '创建时间', type: 'datetime' },
            { key: 'updated_at', label: '更新时间', type: 'datetime' }
          ];
        case 'filter_samples':
          return [
            { key: 'id', label: '记录ID', type: 'text' },
            { key: '化验人员', label: '化验人员', type: 'text' },
            { key: '开始时间', label: '开始时间', type: 'datetime' },
            { key: '结束时间', label: '结束时间', type: 'datetime' },
            { key: '水份', label: '水份(%)', type: 'number' },
            { key: '铅品位', label: '铅品位(%)', type: 'number' },
            { key: '锌品位', label: '锌品位(%)', type: 'number' },
            { key: '备注', label: '备注', type: 'text' },
            { key: 'created_at', label: '创建时间', type: 'datetime' },
            { key: 'updated_at', label: '更新时间', type: 'datetime' }
          ];
        case 'incoming_samples':
          return [
            { key: 'id', label: '记录ID', type: 'text' },
            { key: '化验人员', label: '化验人员', type: 'text' },
            { key: '原矿类型', label: '原矿类型', type: 'text' },
            { key: '计量日期', label: '计量日期', type: 'date' },
            { key: '湿重(t)', label: '湿重(t)', type: 'number' },
            { key: '水份(%)', label: '水份(%)', type: 'number' },
            { key: '干重(t)', label: '干重(t)', type: 'number' },
            { key: 'Pb', label: 'Pb品位(%)', type: 'number' },
            { key: 'Zn', label: 'Zn品位(%)', type: 'number' },
            { key: 'Zn氧化率', label: 'Zn氧化率(%)', type: 'number' },
            { key: '发货单位名称', label: '发货单位名称', type: 'text' },
            { key: '收货单位名称', label: '收货单位名称', type: 'text' },
            { key: 'created_at', label: '创建时间', type: 'datetime' },
            { key: 'updated_at', label: '更新时间', type: 'datetime' }
          ];
        case 'outgoing_sample':
          return [
            { key: 'id', label: '记录ID', type: 'text' },
            { key: '化验人员', label: '化验人员', type: 'text' },
            { key: '样品编号', label: '样品编号', type: 'text' },
            { key: '计量日期', label: '计量日期', type: 'date' },
            { key: '车牌号', label: '车牌号', type: 'text' },
            { key: '湿重(t)', label: '湿重(t)', type: 'number' },
            { key: '水份(%)', label: '水份(%)', type: 'number' },
            { key: '干重(t)', label: '干重(t)', type: 'number' },
            { key: 'Pb', label: 'Pb品位(%)', type: 'number' },
            { key: 'Zn', label: 'Zn品位(%)', type: 'number' },
            { key: '发货单位名称', label: '发货单位名称', type: 'text' },
            { key: '收货单位名称', label: '收货单位名称', type: 'text' },
            { key: '流向', label: '流向', type: 'text' },
            { key: 'created_at', label: '创建时间', type: 'datetime' },
            { key: 'updated_at', label: '更新时间', type: 'datetime' }
          ];
        default:
          return [];
      }
    };

    const fields = getFieldsForDataSource();

    // 格式化日期显示
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return '--';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '--';
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        return '--';
      }
    };

    console.log('🎨 渲染详情内容, 当前编辑状态:', isEditing);

    return (
      <div className="space-y-4">
        <div className="text-center pb-2">
          <h3 className="text-lg font-semibold text-primary">{dataSourceTitles[selectedDataSource]}</h3>
          <Badge variant="secondary" className="mt-1">
            {dataSourceTables[selectedDataSource]}
          </Badge>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">基础信息</CardTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      console.log('🖱️ 编辑按钮被点击');
                      handleStartEdit();
                    }}
                  >
                    编辑
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3">
              {fields.filter(field => field.key !== 'created_at' && field.key !== 'updated_at' && field.key !== 'id').map((field) => {
                const currentValue = isEditing ? editedData[field.key] : rawRowData[field.key];

                let displayValue: string;

                switch (field.type) {
                  case 'datetime':
                    displayValue = formatDate(currentValue);
                    break;
                  case 'date':
                    displayValue = currentValue || '--';
                    break;
                  case 'number':
                    displayValue = formatValue(currentValue, undefined, 2);
                    break;
                  default:
                    displayValue = currentValue || '--';
                }

                return (
                  <div key={field.key} className="flex justify-between items-start py-2 border-b border-border/30 last:border-b-0">
                    <span className="font-medium text-sm text-foreground/80 min-w-0 flex-shrink-0 mr-3">
                      {field.label}
                    </span>
                    <div className="text-sm text-right break-all min-w-0 flex-1">
                      {isEditing && field.type !== 'datetime' && field.key !== 'id' ? (
                        <Input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          value={currentValue === null || currentValue === undefined ? '' : String(currentValue)}
                          onChange={(e) => {
                            let newValue: any = e.target.value;
                            if (field.type === 'number') {
                              if (newValue === '' || newValue === null || newValue === undefined) {
                                newValue = null;
                              } else {
                                const parsed = parseFloat(newValue);
                                newValue = isNaN(parsed) ? null : parsed;
                              }
                            }
                            handleFieldChange(field.key, newValue);
                          }}
                          className="h-8 text-sm text-right"
                          step={field.type === 'number' ? '0.01' : undefined}
                          placeholder={field.type === 'number' ? '请输入数值' : '请输入内容'}
                        />
                      ) : (
                        <span>{displayValue}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground">系统信息</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3">
              {fields.filter(field => field.key === 'created_at' || field.key === 'updated_at').map((field) => {
                const value = rawRowData[field.key];
                const displayValue = formatDate(value);

                return (
                  <div key={field.key} className="flex justify-between items-start py-2 border-b border-border/30 last:border-b-0">
                    <span className="font-medium text-sm text-muted-foreground min-w-0 flex-shrink-0 mr-3">
                      {field.label}
                    </span>
                    <span className="text-xs text-muted-foreground text-right break-all">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }, [rawRowData, selectedRowData, selectedDataSource, formatValue, isEditing, editedData, handleStartEdit, handleCancelEdit, handleSaveEdit, handleFieldChange, isSaving]);

  // 页面初始化和数据刷新
  useEffect(() => {
    const initializePage = async () => {
      setIsInitialLoading(true);
      try {
        // 并行获取数据和生产周期列表
        await Promise.all([
          fetchData(),
          fetchProductionCycles()
        ]);
      } catch (error) {
        console.error('页面初始化失败:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializePage();
  }, [fetchData, fetchProductionCycles]);

  // 监听数据源变化，自动刷新数据
  useEffect(() => {
    if (!isInitialLoading) {
      fetchData();
    }
  }, [selectedDataSource, fetchData, isInitialLoading]);

  if (isInitialLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-8">
          <Skeleton className="h-8 w-48 mx-auto" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 页面头部 */}
      <div className="relative">
        {/* 汉堡菜单 - 左上角 */}
        <div className="absolute top-0 left-0">
          <HamburgerMenu />
        </div>

        {/* 主题切换按钮 - 右上角 */}
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>

        {/* 页面标题 - 居中 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <FlaskConical className="h-6 w-6 sm:h-8 sm:w-8" />
            化验室
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            样品化验数据管理与查询系统
          </p>
        </div>
      </div>

      {/* 专项作业区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            专项作业区
          </CardTitle>
          <CardDescription>
            点击选择专项作业区
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {workAreas.map((area, index) => {
              const IconComponent = area.icon;
              // 新增的作业区（索引4和5）使用更小的字号
              const isNewArea = index >= 4;

              return (
                <Button
                  key={`${area.dataSource}-${area.route}`}
                  variant="outline"
                  className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover:bg-primary/5 hover:border-primary"
                  onClick={() => handleWorkAreaClick(area)}
                >
                  <IconComponent className={`${isNewArea ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-6 w-6 sm:h-8 sm:w-8'} text-primary`} />
                  <div className="text-center">
                    <h3 className={`font-semibold ${isNewArea ? 'text-xs' : 'text-xs sm:text-sm'}`}>{area.label}</h3>
                    <p className={`text-muted-foreground hidden sm:block ${isNewArea ? 'text-xs' : 'text-xs'}`}>{area.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 化验数据查询区域 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <CardTitle>化验数据查询</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="text-xs"
              >
                <Download className="h-4 w-4 mr-1" />
                导出EXCEL
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchData}
                disabled={isLoading}
                className="h-8 w-8"
                title="刷新表格数据"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>查看和管理 {dataSourceLabel[selectedDataSource]} 的历史化验记录</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 数据源切换按钮 */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-4">
            {(['shift_samples', 'filter_samples', 'incoming_samples', 'outgoing_sample'] as const).map((source) => (
              <Button
                key={source}
                variant={selectedDataSource === source ? "default" : "outline"}
                size="sm"
                onClick={() => handleDataSourceChange(source)}
                className="text-xs sm:text-sm"
              >
                {dataSourceLabel[source]}
              </Button>
            ))}
          </div>

          {/* 日期选择功能 */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              日期范围选择
            </h3>
            <div className="space-y-4">
              {/* 日期输入 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
                  <Input
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
                  <Input
                    type="date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* 快速选择按钮 */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(7)}
                  className="text-xs"
                >
                  最近一周
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(30)}
                  className="text-xs"
                >
                  最近一月
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(180)}
                  className="text-xs"
                >
                  最近半年
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(365)}
                  className="text-xs"
                >
                  最近一年
                </Button>
              </div>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="relative overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tableData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无 {dataSourceLabel[selectedDataSource]} 数据</p>
                <p className="text-sm mt-2">所选日期范围内没有找到相关记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>操作</TableHead>
                        {/* 班样字段顺序：日期，班次，矿物类型，元素，品位(%)，水分(%) */}
                        {selectedDataSource === 'shift_samples' && (
                          <>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('record_date')}
                            >
                              日期 {sortField === 'record_date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                            </TableHead>
                            <TableHead>班次</TableHead>
                            <TableHead>矿物类型</TableHead>
                            <TableHead>元素</TableHead>
                            <TableHead>品位(%)</TableHead>
                            <TableHead>水分(%)</TableHead>
                          </>
                        )}

                        {/* 压滤样字段 */}
                        {selectedDataSource === 'filter_samples' && (
                          <>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('record_date')}
                            >
                              日期 {sortField === 'record_date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                            </TableHead>
                            <TableHead>元素</TableHead>
                            <TableHead>品位(%)</TableHead>
                            <TableHead>水分(%)</TableHead>
                            <TableHead>化验人员</TableHead>
                          </>
                        )}

                        {/* 进厂样字段 */}
                        {selectedDataSource === 'incoming_samples' && (
                          <>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('record_date')}
                            >
                              日期 {sortField === 'record_date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                            </TableHead>
                            <TableHead>元素</TableHead>
                            <TableHead>品位(%)</TableHead>
                            <TableHead>水分(%)</TableHead>
                            <TableHead>供应商</TableHead>
                            <TableHead>原矿类型</TableHead>
                          </>
                        )}

                        {/* 出厂样字段：日期，样品编号，元素，品位(%)，水分(%)，采购单位 */}
                        {selectedDataSource === 'outgoing_sample' && (
                          <>
                            <TableHead
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('shipment_date')}
                            >
                              日期 {sortField === 'shipment_date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                            </TableHead>
                            <TableHead>样品编号</TableHead>
                            <TableHead>元素</TableHead>
                            <TableHead>品位(%)</TableHead>
                            <TableHead>水分(%)</TableHead>
                            <TableHead>采购单位</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item, index) => (
                        <TableRow key={`${selectedDataSource}-${item.id}-${index}`}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDetailClick(item)}
                              title="查看详情"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          {/* 班样数据显示：日期，班次，矿物类型，元素，品位(%)，水分(%) */}
                          {selectedDataSource === 'shift_samples' && (
                            <>
                              <TableCell>{item.record_date || '--'}</TableCell>
                              <TableCell>{item.shift || '--'}</TableCell>
                              <TableCell>{item.mineral_type || '--'}</TableCell>
                              <TableCell>{item.element || '--'}</TableCell>
                              <TableCell>{formatValue(item.grade_value, undefined, 2)}</TableCell>
                              <TableCell>{formatValue(item.moisture_value, undefined, 2)}</TableCell>
                            </>
                          )}

                          {/* 压滤样数据显示 */}
                          {selectedDataSource === 'filter_samples' && (
                            <>
                              <TableCell>{item.record_date || '--'}</TableCell>
                              <TableCell>{item.element || '--'}</TableCell>
                              <TableCell>{formatValue(item.grade_value, undefined, 2)}</TableCell>
                              <TableCell>{formatValue(item.moisture_value, undefined, 2)}</TableCell>
                              <TableCell>{item.operator || '--'}</TableCell>
                            </>
                          )}

                          {/* 进厂样数据显示 */}
                          {selectedDataSource === 'incoming_samples' && (
                            <>
                              <TableCell>{item.record_date || '--'}</TableCell>
                              <TableCell>{item.element || '--'}</TableCell>
                              <TableCell>{formatValue(item.grade_value, undefined, 2)}</TableCell>
                              <TableCell>{formatValue(item.moisture_value, undefined, 2)}</TableCell>
                              <TableCell>{item.supplier || '--'}</TableCell>
                              <TableCell>{item.mineral_type || '--'}</TableCell>
                            </>
                          )}

                          {/* 出厂样数据显示：日期，样品编号，元素，品位(%)，水分(%)，采购单位 */}
                          {selectedDataSource === 'outgoing_sample' && (
                            <>
                              <TableCell>{item.shipment_date || '--'}</TableCell>
                              <TableCell>{item.sample_number || '--'}</TableCell>
                              <TableCell>{item.element || '--'}</TableCell>
                              <TableCell>{formatValue(item.grade_value, undefined, 2)}</TableCell>
                              <TableCell>{formatValue(item.moisture_value, undefined, 2)}</TableCell>
                              <TableCell>{item.purchasing_unit_name || '--'}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 分页控制 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    共 {sortedTableData.length} 条记录，第 {currentPage} 页，共 {Math.ceil(sortedTableData.length / itemsPerPage)} 页
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(sortedTableData.length / itemsPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(sortedTableData.length / itemsPerPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) {
          // 关闭对话框时重置所有状态
          setSelectedRowData(null);
          setRawRowData(null);
          setEditedData(null);
          setIsEditing(false);
          setIsSaving(false);
        }
      }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-center gap-2 min-h-[40px]">
              <FlaskConical className="h-4 w-4" />
              <DialogTitle className="text-base">化验数据详情</DialogTitle>
            </div>
            <DialogDescription className="text-center text-sm">
              查看完整的化验记录信息
            </DialogDescription>
          </DialogHeader>
          {renderDetailContent()}
        </DialogContent>
      </Dialog>

      {/* 统一底部签名 */}
      <Footer />
    </div>
  );
}

export default function LabPage() {
  return (
    <AuthGuard>
      <LabPageContent />
    </AuthGuard>
  );
}
