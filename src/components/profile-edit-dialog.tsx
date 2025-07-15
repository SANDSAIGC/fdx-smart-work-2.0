"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useUser } from "@/contexts/user-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";

interface ProfileEditDialogProps {
  children: React.ReactNode;
}

export function ProfileEditDialog({ children }: ProfileEditDialogProps) {
  const { user, updateUser, refreshUser } = useUser();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    username: user?.username || "",
    name: user?.name || "",
    department: user?.department || "",
    phone: user?.phone || "",
    wechat: user?.wechat || "",
    position: user?.position || "",
  });

  // 重置表单数据
  const resetForm = useCallback(() => {
    setFormData({
      username: user?.username || "",
      name: user?.name || "",
      department: user?.department || "",
      phone: user?.phone || "",
      wechat: user?.wechat || "",
      position: user?.position || "",
    });
    setError(null);
    setSuccess(false);
  }, [user]);

  // 当Dialog打开时重置表单
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      resetForm();
    }
  };

  // 表单验证逻辑
  const validationResult = useMemo(() => {
    // 验证必填字段
    if (!formData.username || !formData.name || !formData.department || !formData.phone) {
      return { isValid: false, error: "请填写所有必填字段" };
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      return { isValid: false, error: "请输入正确的手机号码" };
    }

    return { isValid: true, error: null };
  }, [formData]);

  // 处理表单字段变化
  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
    setSuccess(false);
  };

  // 保存用户资料
  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validationResult.isValid) {
      setError(validationResult.error);
      return;
    }

    if (!user) {
      setError("用户信息不存在");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 构建更新数据
      const updateData = {
        ...user,
        username: formData.username,
        name: formData.name,
        department: formData.department,
        phone: formData.phone,
        wechat: formData.wechat,
        position: formData.position,
      };

      // 调用用户上下文的更新方法
      await updateUser(updateData);

      // 刷新用户信息以确保显示最新数据
      await refreshUser();

      setSuccess(true);

      // 延迟关闭Dialog，让用户看到成功提示
      setTimeout(() => {
        setOpen(false);
      }, 1500);

    } catch (error) {
      console.error('保存用户资料失败:', error);
      setError(error instanceof Error ? error.message : '保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [validationResult, formData, user, updateUser]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            编辑资料
          </DialogTitle>
          <DialogDescription>
            修改您的个人信息，点击保存后生效。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-4">
          {/* 员工ID（账号） */}
          <div className="grid gap-2">
            <Label htmlFor="username">员工ID <span className="text-red-500">*</span></Label>
            <Input
              id="username"
              type="text"
              placeholder="请输入员工ID"
              required
              value={formData.username}
              onChange={(e) => handleFieldChange('username', e.target.value)}
            />
          </div>

          {/* 姓名 */}
          <div className="grid gap-2">
            <Label htmlFor="name">姓名 <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              type="text"
              placeholder="请输入真实姓名"
              required
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </div>

          {/* 部门 */}
          <div className="grid gap-2">
            <Label htmlFor="department">部门 <span className="text-red-500">*</span></Label>
            <Input
              id="department"
              type="text"
              placeholder="请输入所属部门"
              required
              value={formData.department}
              onChange={(e) => handleFieldChange('department', e.target.value)}
            />
          </div>

          {/* 联系电话 */}
          <div className="grid gap-2">
            <Label htmlFor="phone">联系电话 <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              type="tel"
              placeholder="请输入手机号码"
              required
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
            />
          </div>

          {/* 微信号 */}
          <div className="grid gap-2">
            <Label htmlFor="wechat">微信号 <span className="text-muted-foreground text-sm">(选填)</span></Label>
            <Input
              id="wechat"
              type="text"
              placeholder="请输入微信号"
              value={formData.wechat}
              onChange={(e) => handleFieldChange('wechat', e.target.value)}
            />
          </div>

          {/* 职称 */}
          <div className="grid gap-2">
            <Label htmlFor="position">职称 <span className="text-muted-foreground text-sm">(选填)</span></Label>
            <Input
              id="position"
              type="text"
              placeholder="请输入职称"
              value={formData.position}
              onChange={(e) => handleFieldChange('position', e.target.value)}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-md">
              ✅ 资料保存成功！
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !validationResult.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
