import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "忘记密码 - FDX SMART WORK 2.0",
  description: "重置FDX智能工作系统密码",
};

export default function ForgotPasswordPage() {
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

        {/* 重置密码提示卡片 */}
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">重置密码</CardTitle>
              <CardDescription>
                如需重置密码，请联络管理员
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 联系信息 */}
              <div className="flex items-center justify-center space-x-3 p-4 bg-muted rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium">18183899380</span>
              </div>

              {/* 说明文字 */}
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>管理员将协助您完成密码重置</p>
                <p>工作时间：周一至周五 9:00-18:00</p>
              </div>

              {/* 返回登录按钮 */}
              <div className="flex justify-center">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login">
                    返回登录
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
