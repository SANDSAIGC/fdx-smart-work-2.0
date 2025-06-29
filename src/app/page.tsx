"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { getSmartRedirectRoute } from "@/lib/work-page-utils"

export default function Home() {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const hasRedirected = useRef(false); // 防止重复重定向

  useEffect(() => {
    const handleRedirect = async () => {
      // 如果正在加载或已经重定向过，则不执行
      if (isLoading || hasRedirected.current) {
        return;
      }

      // 如果用户已登录，使用智能重定向到工作页面
      if (isAuthenticated && user) {
        console.log('✅ [首页] 用户已登录，开始智能重定向查询...');
        console.log('🔍 [首页] 用户信息:', {
          姓名: user.name,
          工作页面: user.workPage,
          职称: user.position
        });

        hasRedirected.current = true; // 标记已重定向
        const redirectRoute = await getSmartRedirectRoute(user);
        console.log('🎯 [首页] 智能重定向到:', redirectRoute);
        router.replace(redirectRoute);
      } else if (!isAuthenticated) {
        // 如果用户未登录，重定向到登录页面
        console.log('🔄 [首页] 用户未登录，重定向到登录页面');
        hasRedirected.current = true; // 标记已重定向
        router.replace('/auth/login');
      }
    };

    handleRedirect();
  }, [isAuthenticated, user, isLoading, router]);

  // 显示加载状态，避免闪烁
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">正在加载...</p>
      </div>
    </div>
  );
}


