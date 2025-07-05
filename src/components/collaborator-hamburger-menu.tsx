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
  FileText,
  LogOut
} from "lucide-react";

export function CollaboratorHamburgerMenu() {
  const router = useRouter();
  const { user, isLoading, logout } = useUser();

  const handleRoleClick = () => {
    router.push('/profile');
  };

  const handleFileManagement = () => {
    router.push('/file-management');
  };

  const handleLogout = () => {
    console.log('🚪 [合作者汉堡菜单] 用户点击登出');
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
        
        {/* 合作者专用菜单项 */}
        <DropdownMenuItem onClick={handleRoleClick}>
          <User className="mr-2 h-4 w-4" />
          数字工牌
        </DropdownMenuItem>
        
        {/* 新增的文件管理功能 */}
        <DropdownMenuItem onClick={handleFileManagement}>
          <FileText className="mr-2 h-4 w-4" />
          文件管理
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          账号登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
