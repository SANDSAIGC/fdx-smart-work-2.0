"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { useUser } from "@/contexts/user-context";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    账号: string;
    姓名: string;
    部门: string;
    重定向路由: string;
    职称: string;
  };
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const router = useRouter();
  const { login } = useUser();

  // 验证逻辑优化
  const isFormValid = useMemo(() => {
    return account.trim() !== "" && password.trim() !== "";
  }, [account, password]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // 立即设置按钮按下状态，提供即时反馈
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 150);

    if (!isFormValid) {
      setError("请填写账号和密码");
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('🚀 [登录] 开始登录流程', { account, password: '***' });

    try {
      // 使用新的API路由进行身份验证
      const loginRequest: LoginRequest = {
        email: account, // 使用account作为登录凭据
        password,
      };

      console.log('📤 [登录] 发送登录请求', loginRequest);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginRequest),
      });

      console.log('📥 [登录] 收到响应', { status: response.status, ok: response.ok });

      const result: LoginResponse = await response.json();
      console.log('📋 [登录] 解析响应数据', result);

      if (!result.success) {
        console.error('❌ [登录] 登录失败', result.message);
        setError(result.message || "登录失败，请重试");
        return;
      }

      // 登录成功，显示成功消息
      console.log('✅ [登录] 登录成功', result.message);

      // 保存用户信息到Context
      if (result.user) {
        console.log('💾 [登录] 保存用户信息', result.user);

        // 使用新的异步login函数，支持"记住我"功能
        await login(result.user, rememberMe);
        console.log('✅ [登录] 用户登录状态已保存，记住我:', rememberMe);

        // 直接重定向到用户的工作页面，避免闪现问题
        const redirectRoute = result.user.重定向路由 || '/lab';
        console.log('🎯 [登录] 直接重定向到工作页面:', redirectRoute);
        router.replace(redirectRoute);
      }

    } catch (error: unknown) {
      console.error('❌ [登录] 请求错误:', error);
      setError("网络错误，请检查连接后重试");
    } finally {
      setIsLoading(false);
    }
  }, [account, password, isFormValid, rememberMe, login, router]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">欢迎回来</CardTitle>
          <p className="text-muted-foreground">请输入账号和密码</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="account">账号</Label>
                <Input
                  id="account"
                  type="text"
                  placeholder="请输入工号或账号"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密码</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    忘记密码?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* 记住账号复选框 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  记住账号
                </Label>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className={`w-full transition-all duration-150 ${
                  isButtonPressed ? 'scale-95' : 'scale-100'
                } ${
                  !isFormValid ? 'opacity-50' : 'opacity-100'
                }`}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              还没有账号？{" "}
              <Link
                href="/auth/register"
                className="underline underline-offset-4 hover:text-primary transition-colors duration-150 active:scale-95 transform"
              >
                立即注册
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
