"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AvatarCacheService } from '@/lib/avatar-cache';

// 用户信息接口
export interface UserInfo {
  id: string;
  username: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  wechat: string;
  points: number;
  workPage?: string; // 工作页面名称，用于重定向逻辑
  avatar?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

// 会话信息接口
export interface SessionInfo {
  token: string;
  loginTime: number;
  expiresAt: number;
  lastActivity: number;
}

// 用户上下文接口
interface UserContextType {
  user: UserInfo | null;
  session: SessionInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserInfo | null) => void;
  updateUser: (user: UserInfo) => void;
  refreshUser: () => Promise<void>;
  login: (userData: any, rememberMe?: boolean) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

// 创建用户上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 默认用户数据（使用数据库中实际存在的用户）
const defaultUser: UserInfo = {
  id: "4dd00d94-1c91-4dc9-990d-1abcfd52dcee",
  username: "15912192909",
  name: "陈鴅",
  position: "总指挥",
  department: "指挥中心",
  phone: "15912192909",
  wechat: "chenying_fdx",
  points: 1250,
  avatar: undefined
};

// 用户API服务
const userAPI = {
  async getUserById(userId: string): Promise<UserInfo | null> {
    try {
      const response = await fetch(`/api/users?id=${userId}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        console.error('获取用户信息失败:', result.error);
        return null;
      }
    } catch (error) {
      console.error('用户API调用失败:', error);
      return null;
    }
  },

  async updateUser(userId: string, updates: Partial<UserInfo>): Promise<UserInfo | null> {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, ...updates }),
      });

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        console.error('更新用户信息失败:', result.error);

        // 如果是认证错误，抛出特定错误
        if (result.code === 'AUTH_FAILED' || response.status === 401) {
          throw new Error(result.message || 'Authentication failed');
        }

        // 其他错误也抛出，让上层处理
        throw new Error(result.error || '更新用户信息失败');
      }
    } catch (error) {
      console.error('更新用户API调用失败:', error);

      // 重新抛出错误，让上层处理
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('更新用户API调用失败');
      }
    }
  }
};

// 用户上下文提供者组件
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 计算认证状态
  const isAuthenticated = user !== null && session !== null && session.expiresAt > Date.now();

  // 从API获取用户信息（使用混合存储策略）
  const loadUserFromAPI = async (userId: string) => {
    try {
      setError(null);

      // 1. 尝试从缓存获取头像
      const cachedAvatar = await AvatarCacheService.getUserAvatar(userId);

      // 2. 从API获取用户基本信息
      const userData = await userAPI.getUserById(userId);

      if (userData) {
        // 3. 优先使用缓存的头像，降级到API返回的头像
        const finalAvatar = cachedAvatar || userData.avatar_url || userData.avatar;

        // 4. 确保avatar字段兼容性
        const userWithAvatar = {
          ...userData,
          avatar: finalAvatar,
          avatar_url: finalAvatar
        };

        setUser(userWithAvatar);

        // 5. 更新本地存储
        localStorage.setItem('fdx_user', JSON.stringify(userWithAvatar));
        localStorage.setItem('fdx_current_user_id', userId);

        // 6. 如果有新的头像URL，更新缓存
        if (userData.avatar_url && userData.avatar_url !== cachedAvatar) {
          AvatarCacheService.setCachedAvatar(userId, userData.avatar_url, 'supabase');
        }
      } else {
        throw new Error('用户信息不存在');
      }
    } catch (error) {
      console.error('从API加载用户信息失败:', error);
      setError(error instanceof Error ? error.message : '加载用户信息失败');
      // 降级到默认用户
      setUser(defaultUser);
      localStorage.setItem('fdx_user', JSON.stringify(defaultUser));
    }
  };

  // 刷新用户信息
  const refreshUser = async () => {
    const currentUserId = localStorage.getItem('fdx_current_user_id') || defaultUser.id;
    await loadUserFromAPI(currentUserId);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. 尝试从本地存储获取认证信息
        const savedUserData = localStorage.getItem('fdx_user_data');
        const savedSessionData = localStorage.getItem('fdx_session_data');

        if (savedUserData && savedSessionData) {
          const userData = JSON.parse(savedUserData);
          const sessionData = JSON.parse(savedSessionData);

          // 检查会话是否过期
          if (sessionData.expiresAt > Date.now()) {
            setUser(userData);
            setSession(sessionData);
            console.log('✅ [UserContext] 从本地存储恢复登录状态');
          } else {
            console.log('⏰ [UserContext] 会话已过期，清除本地存储');
            logout();
          }
        } else {
          // 2. 降级：尝试从旧版本存储获取用户信息
          const savedUserId = localStorage.getItem('fdx_current_user_id');
          const savedUser = localStorage.getItem('fdx_user');

          if (savedUserId) {
            await loadUserFromAPI(savedUserId);
          } else if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            localStorage.setItem('fdx_current_user_id', parsedUser.id);
          } else {
            // 3. 没有有效的登录信息，保持未登录状态
            console.log('ℹ️ [UserContext] 没有找到有效的登录信息，保持未登录状态');
            setUser(null);
            setSession(null);
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
        setError('加载用户信息失败');
        // 不再设置默认用户，保持未登录状态
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // 更新用户信息时同步到API和本地存储（使用混合存储策略）
  const updateUser = async (newUser: UserInfo) => {
    try {
      setError(null);

      // 1. 更新到API
      const updatedUser = await userAPI.updateUser(newUser.id, newUser);

      if (updatedUser) {
        // 2. 确保avatar字段兼容性
        const userWithAvatar = {
          ...updatedUser,
          avatar: updatedUser.avatar_url || updatedUser.avatar
        };

        // 3. 更新本地状态
        setUser(userWithAvatar);

        // 4. 更新本地缓存
        localStorage.setItem('fdx_user', JSON.stringify(userWithAvatar));
        localStorage.setItem('fdx_current_user_id', userWithAvatar.id);

        // 5. 更新头像缓存
        if (userWithAvatar.avatar) {
          AvatarCacheService.setCachedAvatar(userWithAvatar.id, userWithAvatar.avatar, 'supabase');
        }
      } else {
        throw new Error('更新用户信息失败');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);

      // 检查是否是认证错误
      const errorMessage = error instanceof Error ? error.message : '更新用户信息失败';
      const isAuthError = errorMessage.includes('Authentication failed') || errorMessage.includes('401');

      if (isAuthError) {
        setError('认证失败，数据已保存到本地缓存');
        console.log('🔄 [UserContext] 认证失败，启用降级模式');
      } else {
        setError(errorMessage);
      }

      // 降级：仅更新本地状态和缓存
      setUser(newUser);
      localStorage.setItem('fdx_user', JSON.stringify(newUser));

      // 即使API失败，也要更新本地头像缓存
      if (newUser.avatar) {
        AvatarCacheService.setCachedAvatar(newUser.id, newUser.avatar, 'local');
      }
    }
  };

  // 登录方法
  const login = async (userData: any, rememberMe: boolean = false) => {
    console.log('🔐 [UserContext] 开始登录流程:', userData);

    // 创建会话信息
    const sessionInfo: SessionInfo = {
      token: `fdx_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      loginTime: Date.now(),
      expiresAt: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000), // 记住我30天，否则1天
      lastActivity: Date.now()
    };

    // 先设置会话信息
    setSession(sessionInfo);
    localStorage.setItem('fdx_session_data', JSON.stringify(sessionInfo));
    localStorage.setItem('fdx_remember_me', rememberMe.toString());

    // 保存用户ID用于后续API调用
    localStorage.setItem('fdx_current_user_id', userData.id);

    console.log('🔄 [UserContext] 登录成功，正在加载完整用户信息...');

    // 从API加载完整的用户信息（包括联系电话、微信号、头像等）
    try {
      await loadUserFromAPI(userData.id);
      console.log('✅ [UserContext] 完整用户信息加载成功');
    } catch (error) {
      console.error('❌ [UserContext] 加载完整用户信息失败，使用基本信息:', error);

      // 降级：使用登录API返回的基本信息
      const userInfo: UserInfo = {
        id: userData.id,
        username: userData.账号,
        name: userData.姓名,
        position: userData.职称 || '化验师',
        department: userData.部门,
        phone: userData.联系电话 || '',
        wechat: userData.微信号 || '',
        points: 0,
        workPage: userData.工作页面 // 保留工作页面信息用于重定向
      };

      // 更新状态
      setUser(userInfo);
      localStorage.setItem('fdx_user_data', JSON.stringify(userInfo));
    }
  };

  // 登出方法
  const logout = () => {
    console.log('🚪 [UserContext] 开始登出流程');

    // 清除状态
    setUser(null);
    setSession(null);
    setError(null);

    // 清除本地存储
    localStorage.removeItem('fdx_user_data');
    localStorage.removeItem('fdx_session_data');
    localStorage.removeItem('fdx_remember_me');
    localStorage.removeItem('fdx_user');
    localStorage.removeItem('fdx_current_user_id');

    console.log('✅ [UserContext] 登出完成');
  };

  // 检查认证状态
  const checkAuthStatus = async (): Promise<boolean> => {
    if (!user || !session) return false;

    // 检查会话是否过期
    if (session.expiresAt <= Date.now()) {
      console.log('⏰ [UserContext] 会话已过期，自动登出');
      logout();
      return false;
    }

    // 更新最后活动时间
    const updatedSession = {
      ...session,
      lastActivity: Date.now()
    };
    setSession(updatedSession);
    localStorage.setItem('fdx_session_data', JSON.stringify(updatedSession));

    return true;
  };

  // 设置用户（用于登录等场景）
  const setUserData = (newUser: UserInfo | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('fdx_user', JSON.stringify(newUser));
      localStorage.setItem('fdx_current_user_id', newUser.id);
    } else {
      localStorage.removeItem('fdx_user');
      localStorage.removeItem('fdx_current_user_id');
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      session,
      isAuthenticated,
      isLoading,
      error,
      setUser: setUserData,
      updateUser,
      refreshUser,
      login,
      logout,
      checkAuthStatus
    }}>
      {children}
    </UserContext.Provider>
  );
}

// 使用用户上下文的Hook
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
