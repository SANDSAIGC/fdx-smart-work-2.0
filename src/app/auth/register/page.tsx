import { RegisterForm } from "@/components/register-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/ui/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "注册 - FDX SMART WORK 2.0",
  description: "注册FDX智能工作系统账号",
};

export default function RegisterPage() {
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

        {/* 注册表单 */}
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </div>

      {/* 底部签名 */}
      <Footer />
    </div>
  );
}
