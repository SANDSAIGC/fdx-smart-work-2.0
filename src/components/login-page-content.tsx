"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { useUser } from "@/contexts/user-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/ui/footer";
import { getSmartRedirectRoute } from "@/lib/work-page-utils";

export function LoginPageContent() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 登录重定向现在由登录表单直接处理，这里不再需要重定向逻辑
    // 这样可以避免重复重定向导致的闪现问题
    if (isAuthenticated && user) {
      console.log('✅ [登录页面] 用户已登录，重定向由登录表单处理');
    }
  }, [isAuthenticated, user]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果已登录，直接显示登录表单（避免显示"跳转中"）
  // 因为重定向由登录表单处理，这里不需要显示跳转状态

  // 未登录，显示登录表单
  console.log('📝 [登录页面] 显示登录表单');
  return (
    <div className="min-h-screen bg-background">
      {/* 页面顶部标题栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-base font-semibold">FDX SMART WORKSHOP 2.0</h1>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        {/* 公司标识区域 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">富鼎翔工业</h2>
          <p className="text-muted-foreground">智能车间2.0</p>
        </div>

        {/* 登录表单 */}
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
