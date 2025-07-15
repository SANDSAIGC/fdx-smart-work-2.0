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
        currentPath: window.location.pathname,
        sessionExpiry: session ? new Date(session.expiresAt).toISOString() : 'N/A',
        currentTime: new Date().toISOString()
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

      // 简化的认证检查：检查localStorage中是否有用户信息
      const localUserId = localStorage.getItem('fdx_current_user_id');
      const localUser = localStorage.getItem('fdx_user');
      const localSession = localStorage.getItem('fdx_session_data');

      console.log('🔍 [AuthGuard] 本地存储检查:', {
        hasLocalUserId: !!localUserId,
        hasLocalUser: !!localUser,
        hasLocalSession: !!localSession,
        localUserId: localUserId
      });

      // 如果本地存储中有用户信息，认为用户已认证
      if (localUserId && localUser && localSession) {
        try {
          const sessionData = JSON.parse(localSession);
          const currentTime = Date.now();

          // 检查会话是否过期
          if (sessionData.expiresAt && sessionData.expiresAt > currentTime) {
            console.log('✅ [AuthGuard] 本地会话有效，允许访问');
            console.log('👤 [AuthGuard] 本地用户ID:', localUserId);
            setHasRedirected(false); // 重置重定向标志
            return;
          } else {
            console.log('⏰ [AuthGuard] 本地会话已过期');
          }
        } catch (error) {
          console.error('❌ [AuthGuard] 解析本地会话数据失败:', error);
        }
      }

      // 检查会话是否过期
      if (session && session.expiresAt <= Date.now()) {
        console.log('⏰ [AuthGuard] 会话已过期，需要重新登录');
        console.log('🕐 [AuthGuard] 会话过期时间:', new Date(session.expiresAt).toISOString());
        console.log('🕐 [AuthGuard] 当前时间:', new Date().toISOString());
        // 会话过期，需要重新登录
      } else if (isAuthenticated && user && session) {
        console.log('✅ [AuthGuard] 用户已认证，直接渲染页面');
        console.log('👤 [AuthGuard] 用户信息:', {
          userId: user.id,
          username: user.username,
          sessionValid: !!session.token,
          sessionExpiry: new Date(session.expiresAt).toISOString()
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
      console.log('🔍 [AuthGuard] 未认证原因分析:', {
        hasUser: !!user,
        hasSession: !!session,
        isAuthenticated,
        sessionExpired: session ? session.expiresAt <= Date.now() : 'N/A',
        hasLocalUserId: !!localUserId,
        hasLocalUser: !!localUser,
        hasLocalSession: !!localSession
      });

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

  // 用户未认证，检查本地存储作为备用方案
  const localUserId = localStorage.getItem('fdx_current_user_id');
  const localUser = localStorage.getItem('fdx_user');
  const localSession = localStorage.getItem('fdx_session_data');

  if (localUserId && localUser && localSession) {
    try {
      const sessionData = JSON.parse(localSession);
      const currentTime = Date.now();

      // 检查会话是否过期
      if (sessionData.expiresAt && sessionData.expiresAt > currentTime) {
        console.log('✅ [AuthGuard] 本地会话有效，允许访问页面');
        console.log('👤 [AuthGuard] 本地用户ID:', localUserId);
        // 本地会话有效，直接渲染页面
        return <>{children}</>;
      } else {
        console.log('⏰ [AuthGuard] 本地会话已过期');
      }
    } catch (error) {
      console.error('❌ [AuthGuard] 解析本地会话数据失败:', error);
    }
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
