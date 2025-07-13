"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface ResponsivePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  showDetailedInfo?: boolean;
  className?: string;
}

export function ResponsivePagination({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  showDetailedInfo = true,
  className = "",
}: ResponsivePaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 如果只有一页或没有数据，不显示分页
  if (totalPages <= 1) {
    return null;
  }

  // 生成页码数组的逻辑
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // 总页数少于等于7页，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总页数大于7页，智能显示
      if (currentPage <= 4) {
        // 当前页在前4页
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 当前页在后4页
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // 当前页在中间
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 ${className}`}>
      {/* 分页信息 - 移动端居中显示 */}
      {showDetailedInfo && (
        <div className="text-sm text-muted-foreground text-center sm:text-left order-2 sm:order-1">
          <span className="hidden sm:inline">
            共 {totalItems} 条记录，第 {currentPage} 页，共 {totalPages} 页
          </span>
          <span className="sm:hidden">
            {currentPage} / {totalPages}
          </span>
        </div>
      )}

      {/* 分页按钮组 - 移动端优先显示 */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* 首页按钮 - 桌面端显示 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex"
          aria-label="首页"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* 上一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
          aria-label="上一页"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">上一页</span>
        </Button>

        {/* 页码按钮组 - 智能显示 */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-muted-foreground hidden sm:inline">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isCurrentPage = pageNum === currentPage;

            return (
              <Button
                key={pageNum}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[36px] h-9 ${
                  isCurrentPage 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                } ${
                  // 移动端只显示当前页和相邻页
                  Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages
                    ? 'hidden sm:flex'
                    : 'flex'
                }`}
                aria-label={`第 ${pageNum} 页`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* 下一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
          aria-label="下一页"
        >
          <span className="hidden sm:inline">下一页</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* 末页按钮 - 桌面端显示 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex"
          aria-label="末页"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
