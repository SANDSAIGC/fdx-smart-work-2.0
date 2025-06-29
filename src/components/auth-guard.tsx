"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function AuthGuard({
  children,
  fallback = null,
  redirectTo = '/auth/login',
  requireAuth = true
}: AuthGuardProps) {
  const { user, session, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      console.log('🔐 [AuthGuard] 认证检查开始...');
      console.log('🔍 [AuthGuard] 当前状态:', {
        requireAuth,
        isLoading,
        isAuthenticated,
        hasUser: !!user,
        hasSession: !!session,
        hasRedirected,
        currentPath: window.location.pathname
      });

      // 如果不需要认证，直接通过
      if (!requireAuth) {
        console.log('📝 [AuthGuard] 页面不需要认证，直接渲染');
        return;
      }

      // 如果认证系统还在初始化，等待完成
      if (isLoading) {
        console.log('⏳ [AuthGuard] 等待认证系统初始化...');
        return;
      }

      // 如果用户已认证，直接通过
      if (isAuthenticated && user && session) {
        console.log('✅ [AuthGuard] 用户已认证，直接渲染页面');
        console.log('👤 [AuthGuard] 用户信息:', {
          userId: user.id,
          username: user.username,
          sessionValid: !!session.token
        });
        setHasRedirected(false); // 重置重定向标志
        return;
      }

      // 如果已经重定向过，避免重复重定向
      if (hasRedirected) {
        console.log('🔄 [AuthGuard] 已经重定向过，跳过重复重定向');
        return;
      }

      // 用户未认证，检查是否已经在登录页面
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/auth/')) {
        console.log('📝 [AuthGuard] 已在认证页面，跳过重定向');
        return;
      }

      // 保存当前页面路径作为重定向参数
      console.log('❌ [AuthGuard] 用户未认证，准备重定向');
      console.log('🔄 [AuthGuard] 保存原始访问路径:', currentPath);

      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      console.log('🚀 [AuthGuard] 重定向到:', redirectUrl);

      // 设置重定向标志，防止重复重定向
      setHasRedirected(true);

      // 执行重定向
      router.replace(redirectUrl);
    };

    verifyAuth();
  }, [user, session, isAuthenticated, isLoading, requireAuth, redirectTo, router, hasRedirected]);

  // 如果不需要认证，直接渲染子组件
  if (!requireAuth) {
    return <>{children}</>;
  }

  // 如果认证系统正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">验证身份中...</p>
        </div>
      </div>
    );
  }

  // 如果用户已认证，直接渲染子组件
  if (isAuthenticated && user && session) {
    console.log('🎯 [AuthGuard] 认证通过，渲染页面内容');
    return <>{children}</>;
  }

  // 用户未认证，显示fallback或空内容（重定向已在useEffect中处理）
  return fallback || null;
}

// 高阶组件版本
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

// 用于检查认证状态的Hook
export function useAuthGuard(requireAuth: boolean = true) {
  const { user, session, isAuthenticated, isLoading, checkAuthStatus } = useUser();

  const verifyAuth = async (): Promise<boolean> => {
    if (!requireAuth) return true;
    if (isLoading) return false;
    if (!user || !session) return false;

    return await checkAuthStatus();
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    session,
    verifyAuth
  };
}
