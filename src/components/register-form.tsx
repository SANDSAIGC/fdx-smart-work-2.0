"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useMemo } from "react";

interface RegisterRequest {
  账号: string;
  姓名: string;
  部门: string;
  电话: string;
  微信?: string;
  密码: string;
  职称?: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    账号: string;
    姓名: string;
    部门: string;
  };
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const router = useRouter();

  // 验证逻辑优化 - 使用useMemo缓存验证结果
  const validationResult = useMemo(() => {
    // 验证必填字段
    if (!account || !name || !department || !phone || !password || !confirmPassword) {
      return { isValid: false, error: "请填写所有必填字段" };
    }

    // 验证密码匹配
    if (password !== confirmPassword) {
      return { isValid: false, error: "两次输入的密码不一致" };
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: "请输入正确的手机号码" };
    }

    return { isValid: true, error: null };
  }, [account, name, department, phone, password, confirmPassword]);

  // 优化的提交处理函数 - 使用useCallback避免重复创建
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // 立即设置按钮按下状态，提供即时反馈
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 150);

    // 使用预计算的验证结果
    if (!validationResult.isValid) {
      setError(validationResult.error);
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('📝 [注册] 开始注册流程', { account, name, department, phone, wechat });

    try {
      const registerRequest: RegisterRequest = {
        账号: account,
        姓名: name,
        部门: department,
        电话: phone,
        微信: wechat,
        密码: password,
        职称: '化验师'
      };

      console.log('📤 [注册] 发送注册请求', registerRequest);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerRequest),
      });

      console.log('📥 [注册] 收到响应', { status: response.status, ok: response.ok });

      const result: RegisterResponse = await response.json();
      console.log('📋 [注册] 解析响应数据', result);

      if (!result.success) {
        console.error('❌ [注册] 注册失败', result.message);
        setError(result.message || "注册失败，请重试");
        return;
      }

      // 注册成功
      console.log('✅ [注册] 注册成功', result.message);
      
      // 重定向到登录页面
      router.push('/auth/login?message=注册成功，请登录');

    } catch (error: unknown) {
      console.error('❌ [注册] 请求错误:', error);
      setError("网络错误，请检查连接后重试");
    } finally {
      setIsLoading(false);
    }
  }, [validationResult, account, name, department, phone, wechat, password, router]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">用户注册</CardTitle>
          <CardDescription>创建新账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="flex flex-col gap-4">
              {/* 1. 账号（必填） */}
              <div className="grid gap-2">
                <Label htmlFor="account">账号 <span className="text-red-500">*</span></Label>
                <Input
                  id="account"
                  type="text"
                  placeholder="请输入账号"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>

              {/* 2. 姓名（必填） */}
              <div className="grid gap-2">
                <Label htmlFor="name">姓名 <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="请输入真实姓名"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* 3. 部门（必填） */}
              <div className="grid gap-2">
                <Label htmlFor="department">部门 <span className="text-red-500">*</span></Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="请输入所属部门"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              {/* 4. 电话（必填） */}
              <div className="grid gap-2">
                <Label htmlFor="phone">电话 <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号码"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* 5. 微信（选填） */}
              <div className="grid gap-2">
                <Label htmlFor="wechat">微信 <span className="text-muted-foreground text-sm">(选填)</span></Label>
                <Input
                  id="wechat"
                  type="text"
                  placeholder="请输入微信号"
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                />
              </div>

              {/* 6. 密码（必填） */}
              <div className="grid gap-2">
                <Label htmlFor="password">密码 <span className="text-red-500">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* 7. 确认密码（必填） */}
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">确认密码 <span className="text-red-500">*</span></Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="请再次输入密码"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className={`w-full transition-all duration-150 ${
                  isButtonPressed ? 'scale-95' : 'scale-100'
                } ${
                  !validationResult.isValid ? 'opacity-50' : 'opacity-100'
                }`}
                disabled={isLoading || !validationResult.isValid}
              >
                {isLoading ? "注册中..." : "注册"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              已有账号？{" "}
              <Link
                href="/auth/login"
                className="underline underline-offset-4 hover:text-primary transition-colors duration-150 active:scale-95 transform"
              >
                立即登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
