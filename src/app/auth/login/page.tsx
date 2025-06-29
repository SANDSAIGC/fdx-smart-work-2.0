import { LoginPageContent } from "@/components/login-page-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 - FDX SMART WORK 2.0",
  description: "登录到FDX智能工作系统",
};

export default function LoginPage() {
  return <LoginPageContent />;
}
