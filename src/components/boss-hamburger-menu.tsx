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
  Database,
  FileText,
  Package,
  Trophy,
  LogOut
} from "lucide-react";

export function BossHamburgerMenu() {
  const router = useRouter();
  const { user, isLoading, logout } = useUser();

  const handleRoleClick = () => {
    router.push('/profile');
  };

  const handleDataManagement = () => {
    router.push('/data-management');
  };

  const handleFileManagement = () => {
    router.push('/file-management');
  };

  const handleMaterialManagement = () => {
    router.push('/material-management');
  };

  const handlePointsManagement = () => {
    router.push('/points-management');
  };

  const handleLogout = () => {
    console.log('🚪 [Boss汉堡菜单] 用户点击登出');
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
        
        {/* Boss专用菜单项 */}
        <DropdownMenuItem onClick={handleRoleClick}>
          <User className="mr-2 h-4 w-4" />
          数字工牌
        </DropdownMenuItem>
        
        {/* 新增的管理功能 */}
        <DropdownMenuItem onClick={handleDataManagement}>
          <Database className="mr-2 h-4 w-4" />
          数据管理
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFileManagement}>
          <FileText className="mr-2 h-4 w-4" />
          文件管理
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMaterialManagement}>
          <Package className="mr-2 h-4 w-4" />
          物资管理
        </DropdownMenuItem>
        
        {/* 修改后的积分管理 */}
        <DropdownMenuItem onClick={handlePointsManagement}>
          <Trophy className="mr-2 h-4 w-4" />
          积分管理
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
