"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HamburgerMenu } from '@/components/hamburger-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowLeft } from 'lucide-react';

interface Header2Props {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

/**
 * Header-2 组件
 * 布局: 返回按钮 -- 居左标题 -- 主题切换 -- 汉堡菜单
 * 适用于: shift-sample页面、profile页面、各种详情页面等需要返回功能的页面
 */
export function Header2({ 
  title, 
  onBack, 
  showBackButton = true, 
  className = "" 
}: Header2Props) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={`sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container flex h-14 items-center justify-between px-4">
        {/* 左侧区域: 返回按钮 + 标题 */}
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        {/* 右侧区域: 主题切换 + 汉堡菜单 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HamburgerMenu />
        </div>
      </div>
    </div>
  );
}
