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
    // 如果用户已经认证，立即重定向
    if (isAuthenticated && user) {
      console.log('✅ [登录页面] 用户已登录，立即重定向');

      // 处理重定向逻辑
      const redirectToWorkspace = async () => {
        try {
          const redirectParam = searchParams.get('redirect');

          if (redirectParam) {
            console.log('🎯 [登录页面] 发现重定向参数，返回原始访问页面:', redirectParam);
            router.replace(redirectParam);
            return;
          }

          // 如果没有重定向参数，使用智能重定向到工作页面
          console.log('🔄 [登录页面] 开始智能重定向查询...');
          const redirectRoute = await getSmartRedirectRoute(user);
          console.log('🎯 [登录页面] 智能重定向到:', redirectRoute);
          router.replace(redirectRoute);

        } catch (error) {
          console.error('❌ [登录页面] 重定向异常:', error);
          router.replace('/lab');
        }
      };

      // 使用 setTimeout 确保状态更新完成后再重定向
      setTimeout(redirectToWorkspace, 0);
    }
  }, [isAuthenticated, user, router, searchParams]);

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

  // 如果已登录，不显示任何内容（立即重定向）
  if (isAuthenticated && user) {
    console.log('🎯 [登录页面] 用户已登录，重定向处理中...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">跳转中...</p>
        </div>
      </div>
    );
  }

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
