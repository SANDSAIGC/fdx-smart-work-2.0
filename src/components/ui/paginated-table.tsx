"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";

// 表格列定义接口
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: any) => React.ReactNode;
  className?: string;
}

// 分页表格组件属性接口
interface PaginatedTableProps {
  data: any[];
  columns: TableColumn[];
  itemsPerPage?: number;
  showActions?: boolean;
  showExport?: boolean;
  exportFileName?: string;
  onExport?: () => void;
  detailFields?: { key: string; label: string }[];
  title?: string;
  emptyMessage?: string;
  sortable?: boolean;
}

// 数据详情对话框组件
const DataDetailDialog = ({ 
  data, 
  fields, 
  title 
}: { 
  data: any; 
  fields: { key: string; label: string }[];
  title?: string;
}) => {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title || `数据详情 - ${data.日期 || data.id}`}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground">
              {field.label}
            </Label>
            <div className="text-sm p-2 bg-muted rounded">
              {(data as any)[field.key] !== null && (data as any)[field.key] !== undefined
                ? (data as any)[field.key]
                : '--'
              }
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  );
};

// 分页表格组件
export const PaginatedTable: React.FC<PaginatedTableProps> = ({
  data,
  columns,
  itemsPerPage = 10,
  showActions = true,
  showExport = true,
  exportFileName,
  onExport,
  detailFields = [],
  title,
  emptyMessage = "暂无数据",
  sortable = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortColumn, setSortColumn] = useState<string>('');

  // 排序函数
  const toggleSort = (columnKey: string) => {
    if (!sortable) return;
    
    if (sortColumn === columnKey) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(columnKey);
      setSortOrder('desc');
    }
  };

  // 处理排序后的数据
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // 处理日期排序
      if (sortColumn.includes('日期') || sortColumn.includes('date')) {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }

      // 处理数字排序
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }

      // 处理字符串排序
      const strA = String(aValue || '').toLowerCase();
      const strB = String(bValue || '').toLowerCase();
      return sortOrder === 'desc' ? strB.localeCompare(strA) : strA.localeCompare(strB);
    });
  }, [data, sortColumn, sortOrder, sortable]);

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // 总页数
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // 导出功能
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    if (sortedData.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 创建CSV内容
    const headers = columns.filter(col => col.key !== 'actions').map(col => col.label);
    const csvContent = [
      headers.join(','),
      ...sortedData.map(item => 
        columns
          .filter(col => col.key !== 'actions')
          .map(col => {
            const value = item[col.key];
            return value !== null && value !== undefined ? value : '--';
          })
          .join(',')
      )
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', exportFileName || `${title || '数据导出'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 表格标题和导出按钮 */}
      {(title || showExport) && (
        <div className="flex items-center justify-between">
          {title && <h4 className="text-sm font-medium">{title}</h4>}
          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs"
            >
              <Download className="h-4 w-4 mr-1" />
              导出EXCEL
            </Button>
          )}
        </div>
      )}

      {/* 表格 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {/* 操作列在最前面 */}
              {showActions && (
                <TableHead className="text-center">操作</TableHead>
              )}
              {columns.filter(col => col.key !== 'actions').map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-center ${column.sortable !== false && sortable ? 'cursor-pointer hover:bg-muted/50' : ''} ${column.className || ''}`}
                  onClick={() => column.sortable !== false && toggleSort(column.key)}
                >
                  {column.label}
                  {sortable && column.sortable !== false && sortColumn === column.key && (
                    <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow key={item.id || index}>
                  {/* 操作列 */}
                  {showActions && (
                    <TableCell className="text-center">
                      {detailFields.length > 0 ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DataDetailDialog 
                            data={item} 
                            fields={detailFields}
                            title={title ? `${title} - 详情` : undefined}
                          />
                        </Dialog>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                  {/* 数据列 */}
                  {columns.filter(col => col.key !== 'actions').map((column) => (
                    <TableCell key={column.key} className={`text-center ${column.className || ''}`}>
                      {column.render 
                        ? column.render(item[column.key], item)
                        : (item[column.key] !== null && item[column.key] !== undefined 
                            ? item[column.key] 
                            : '--'
                          )
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (showActions ? 1 : 0)} 
                  className="text-center text-muted-foreground py-4"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {sortedData.length} 条记录，第 {currentPage} 页，共 {totalPages} 页
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
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginatedTable;
