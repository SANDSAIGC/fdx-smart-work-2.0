"use client";

import React from 'react';
import { CollaboratorHamburgerMenu } from '@/components/collaborator-hamburger-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { LucideIcon } from 'lucide-react';

interface CollaboratorHeader1Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * CollaboratorHeader1 组件
 * 专门为合作者页面定制的Header组件
 * 布局: 合作者汉堡菜单(左) -- 居中标题 -- 主题切换(右)
 * 适用于: 合作者页面
 */
export function CollaboratorHeader1({ title, subtitle, icon: Icon, className = "" }: CollaboratorHeader1Props) {
  return (
    <div className={`container mx-auto p-6 ${className}`}>
      {/* 页面头部 */}
      <div className="relative">
        {/* 合作者专用汉堡菜单 - 左上角 */}
        <div className="absolute top-0 left-0">
          <CollaboratorHamburgerMenu />
        </div>

        {/* 主题切换按钮 - 右上角 */}
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>

        {/* 页面标题 - 居中 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            {Icon && <Icon className="h-6 w-6 sm:h-8 sm:w-8" />}
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
