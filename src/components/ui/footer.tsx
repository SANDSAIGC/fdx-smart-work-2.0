"use client";

import React from "react";

/**
 * 统一底部签名组件
 * 在所有页面底部显示版权信息和ICP备案号
 */
export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            FDX@2025 滇ICP备2025058380号
          </p>
          <p className="text-xs text-muted-foreground/80">
            FDX SMART WORK 2.0 - 智能化工作管理系统
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * 简化版Footer组件（用于空间受限的页面）
 */
export function FooterCompact() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            FDX@2025 滇ICP备2025058380号
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
