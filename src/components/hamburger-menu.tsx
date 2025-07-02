"use client"

import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Menu,
  User,
  Bell,
  AlertTriangle,
  UserCheck,
  Trophy,
  LogOut
} from "lucide-react";

export function HamburgerMenu() {
  const router = useRouter();
  const { user, isLoading, logout } = useUser();

  const handleRoleClick = () => {
    router.push('/profile');
  };

  const handleLogout = () => {
    console.log('🚪 [汉堡菜单] 用户点击登出');
    logout();
    router.push('/auth/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {/* 用户名和角色显示 */}
        {!isLoading && user && (
          <>
            <DropdownMenuLabel className="font-bold text-lg">
              {user.name}
            </DropdownMenuLabel>
            <DropdownMenuLabel className="text-sm text-muted-foreground font-normal">
              {user.position}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* 菜单项 */}
        <DropdownMenuItem onClick={handleRoleClick}>
          <User className="mr-2 h-4 w-4" />
          数字工牌
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => console.log('任务通知')}>
          <Bell className="mr-2 h-4 w-4" />
          任务通知
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => console.log('情况上报')}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          情况上报
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => console.log('考勤打卡')}>
          <UserCheck className="mr-2 h-4 w-4" />
          考勤打卡
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => console.log('积分系统')}>
          <Trophy className="mr-2 h-4 w-4" />
          积分系统
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          账号登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
