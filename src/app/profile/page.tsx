"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileEditDialog } from "@/components/profile-edit-dialog";
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  MessageCircle,
  Trophy,
  Edit,
  Mail,
  MapPin
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, error } = useUser();

  const handleAvatarClick = () => {
    router.push('/avatar-selector');
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <p className="text-destructive font-medium mb-2">加载失败</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">用户信息不存在</p>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="mt-4"
          >
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">数字工牌</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">

        {/* 身份卡主体 */}
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            {/* 卡片头部背景 */}
            <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/10 relative">
              <div className="absolute inset-0 bg-grid-white/10 bg-grid-16"></div>
            </div>

            <CardContent className="relative pb-8 pt-0">
              {/* 头像区域 - 精确对齐渐变分界线 */}
              <div className="flex justify-center -mt-12 mb-6">
                <Avatar
                  className="h-24 w-24 border-4 border-background shadow-lg cursor-pointer hover:scale-105 transition-transform"
                  onClick={handleAvatarClick}
                  title="点击更换头像"
                >
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* 基本信息 */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
                <Badge variant="secondary" className="mb-4">
                  {user.position}
                </Badge>
                <p className="text-muted-foreground">员工ID: {user.username}</p>
              </div>

              {/* 详细信息网格 */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* 部门信息 */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">部门</p>
                    <p className="font-medium">{user.department}</p>
                  </div>
                </div>

                {/* 联系电话 */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">联系电话</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>

                {/* 微信号 */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">微信号</p>
                    <p className="font-medium">{user.wechat}</p>
                  </div>
                </div>

                {/* 积分 */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">当前积分</p>
                    <p className="font-medium text-primary">{user.points} 分</p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-center mt-8">
                <ProfileEditDialog>
                  <Button
                    variant="outline"
                    className="w-full max-w-xs"
                  >
                    <User className="h-4 w-4 mr-2" />
                    编辑资料
                  </Button>
                </ProfileEditDialog>
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
