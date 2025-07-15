"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Upload,
  Camera,
  Palette,
  User,
  Check,
  Loader2
} from "lucide-react";

interface AvatarData {
  type: 'preset' | 'upload' | 'generated';
  value: string;
  color?: string;
}

// 头像缓存管理 - 简化版本
const imageCache = new Map<string, boolean>();
const loadingPromises = new Map<string, Promise<void>>();

const preloadImage = async (url: string): Promise<void> => {
  if (imageCache.has(url)) {
    return Promise.resolve();
  }

  if (loadingPromises.has(url)) {
    return loadingPromises.get(url)!;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, true);
      loadingPromises.delete(url);
      resolve();
    };
    img.onerror = () => {
      loadingPromises.delete(url);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });

  loadingPromises.set(url, promise);
  return promise;
};

const isImageLoaded = (url: string): boolean => {
  return imageCache.has(url);
};

const preloadBatch = async (urls: string[]): Promise<void> => {
  const promises = urls.map(url => preloadImage(url).catch(() => {}));
  await Promise.all(promises);
};

// 优化的头像组件
const OptimizedAvatar = React.memo(({
  src,
  alt,
  className,
  onClick,
  isSelected = false
}: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isImageLoaded(src)) {
      setIsLoaded(true);
    } else {
      preloadImage(src)
        .then(() => setIsLoaded(true))
        .catch(() => setHasError(true));
    }
  }, [src]);

  return (
    <div
      className={`relative cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${onClick ? 'hover:scale-105' : ''}`}
      onClick={onClick}
    >
      {!isLoaded && !hasError && (
        <Skeleton className="h-16 w-16 rounded-full" />
      )}
      <Avatar className={`h-16 w-16 ${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        <AvatarImage
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
        <AvatarFallback className="bg-muted">
          {hasError ? <User className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </AvatarFallback>
      </Avatar>
      {isSelected && (
        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      )}
    </div>
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

// 预设头像选项（使用DiceBear API前卫头像样式）
const PRESET_AVATARS = [
  { id: 'avatar1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Classic&backgroundColor=b6e3f4,c0aede,d1d4f9', name: '经典冒险' },
  { id: 'avatar2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Professional&backgroundColor=ffdfbf,ffd5dc,c0aede', name: '专业商务' },
  { id: 'avatar3', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Friendly&backgroundColor=d1d4f9,ffd5dc,ffdfbf', name: '友好微笑' },
  { id: 'avatar4', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Creative&backgroundColor=c0aede,b6e3f4,d1d4f9', name: '创意表情' },
  { id: 'avatar5', url: 'https://api.dicebear.com/7.x/miniavs/svg?seed=Minimal&backgroundColor=ffd5dc,ffdfbf,c0aede', name: '简约风格' },
  { id: 'avatar6', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Retro&backgroundColor=ffdfbf,d1d4f9,ffd5dc', name: '像素复古' },
  // 新增3个前卫头像选项
  { id: 'avatar7', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Cyberpunk&backgroundColor=b6e3f4,c0aede,d1d4f9', name: '赛博朋克' },
  { id: 'avatar8', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Futuristic&backgroundColor=ffdfbf,ffd5dc,c0aede', name: '未来科技' },
  { id: 'avatar9', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Modern&backgroundColor=d1d4f9,ffd5dc,ffdfbf', name: '现代艺术' },
];

// 随机生成的头像颜色方案
const AVATAR_COLORS = [
  { bg: 'bg-red-500', text: 'text-white', name: '红色' },
  { bg: 'bg-blue-500', text: 'text-white', name: '蓝色' },
  { bg: 'bg-green-500', text: 'text-white', name: '绿色' },
  { bg: 'bg-purple-500', text: 'text-white', name: '紫色' },
  { bg: 'bg-orange-500', text: 'text-white', name: '橙色' },
  { bg: 'bg-pink-500', text: 'text-white', name: '粉色' },
  { bg: 'bg-indigo-500', text: 'text-white', name: '靛蓝' },
  { bg: 'bg-teal-500', text: 'text-white', name: '青色' },
  { bg: 'bg-yellow-500', text: 'text-black', name: '黄色' },
  { bg: 'bg-gray-500', text: 'text-white', name: '灰色' },
];

export default function AvatarSelectorPage() {
  const router = useRouter();
  const { user, updateUser, isLoading } = useUser();
  const [selectedTab, setSelectedTab] = useState<'preset' | 'generated' | 'upload'>('preset');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarData | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);

  // 预加载所有头像
  useEffect(() => {
    const preloadAvatars = async () => {
      const avatarUrls = PRESET_AVATARS.map(avatar => avatar.url);
      try {
        await preloadBatch(avatarUrls);
      } catch (error) {
        console.warn('Some avatars failed to preload:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    preloadAvatars();
  }, []);

  // 使用useMemo优化头像列表渲染
  const presetAvatarList = useMemo(() => PRESET_AVATARS, []);
  const colorList = useMemo(() => AVATAR_COLORS, []);

  const handlePresetSelect = useCallback((avatar: typeof PRESET_AVATARS[0]) => {
    setSelectedAvatar({
      type: 'preset',
      value: avatar.url,
    });
  }, []);

  const handleColorSelect = useCallback((color: typeof AVATAR_COLORS[0]) => {
    setSelectedAvatar({
      type: 'generated',
      value: user?.name.charAt(0) || 'U',
      color: color.bg,
    });
  }, [user?.name]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('只支持 JPEG、PNG、GIF 和 WebP 格式的图片');
        return;
      }

      // 验证文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError('文件大小不能超过 5MB');
        return;
      }

      setUploadError('');
      setUploadedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadPreview(result);
        setSelectedAvatar({
          type: 'upload',
          value: result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 上传头像到 Supabase Storage
  const uploadAvatarToStorage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadProgress(100);
        return result.data.publicUrl;
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      setUploadError(error instanceof Error ? error.message : '上传失败');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedAvatar || !user) return;

    try {
      setIsUploading(true);
      setUploadError('');

      let avatarUrl = selectedAvatar.value;

      // 如果是上传的文件，先上传到 Supabase Storage
      if (selectedAvatar.type === 'upload' && uploadedFile) {
        const uploadedUrl = await uploadAvatarToStorage(uploadedFile);
        if (!uploadedUrl) {
          setUploadError('上传头像失败，请重试');
          return;
        }
        avatarUrl = uploadedUrl;
      }

      // 更新用户信息
      const updatedUser = {
        ...user,
        avatar: avatarUrl,
        avatar_url: avatarUrl,
      };

      await updateUser(updatedUser);

      // 更新本地缓存
      localStorage.setItem(`avatar_${user.id}`, avatarUrl);

      router.push('/profile');
    } catch (error) {
      console.error('保存头像失败:', error);
      setUploadError(error instanceof Error ? error.message : '保存头像失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    router.push('/profile');
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">用户信息未找到</p>
          <Button onClick={() => router.push('/')} className="mt-4">
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
            <h1 className="text-lg font-semibold">选择头像</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* 头像选择器主体 */}
        <div className="max-w-2xl mx-auto px-2 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg sm:text-xl">当前用户: {user.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
              {/* 选项卡 - 移动端优化 */}
              <div className="flex gap-2 w-full justify-center">
                <Button
                  variant={selectedTab === 'preset' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTab('preset')}
                  className="flex-1 min-w-0 text-xs sm:text-sm"
                >
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="truncate">预设头像</span>
                </Button>
                <Button
                  variant={selectedTab === 'generated' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTab('generated')}
                  className="flex-1 min-w-0 text-xs sm:text-sm"
                >
                  <Palette className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="truncate">字母头像</span>
                </Button>
                <Button
                  variant={selectedTab === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTab('upload')}
                  className="flex-1 min-w-0 text-xs sm:text-sm"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="truncate">上传照片</span>
                </Button>
              </div>

              <Separator />

              {/* 预设头像选项 */}
              {selectedTab === 'preset' && (
                <div className="space-y-4">
                  {isPreloading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">正在加载头像...</span>
                    </div>
                  )}
                  <div className={`grid grid-cols-3 gap-4 ${isPreloading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}>
                    {presetAvatarList.map((avatar) => (
                      <div
                        key={avatar.id}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted ${
                          selectedAvatar?.value === avatar.url
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent'
                        }`}
                        onClick={() => handlePresetSelect(avatar)}
                      >
                        <OptimizedAvatar
                          src={avatar.url}
                          alt={avatar.name}
                          isSelected={selectedAvatar?.value === avatar.url}
                        />
                        <Badge variant="outline" className="text-xs">
                          {avatar.name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 生成的字母头像选项 */}
              {selectedTab === 'generated' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    选择颜色方案生成字母头像
                  </p>
                  <div className="grid grid-cols-5 gap-3">
                    {AVATAR_COLORS.map((color, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted ${
                          selectedAvatar?.color === color.bg 
                            ? 'border-primary bg-primary/5' 
                            : 'border-transparent'
                        }`}
                        onClick={() => handleColorSelect(color)}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className={`${color.bg} ${color.text} text-lg font-semibold`}>
                            {user.name.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Badge variant="outline" className="text-xs">
                          {color.name}
                        </Badge>
                        {selectedAvatar?.color === color.bg && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 上传照片选项 */}
              {selectedTab === 'upload' && (
                <div className="space-y-4">
                  {/* 错误提示 */}
                  {uploadError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-sm text-destructive">{uploadError}</p>
                    </div>
                  )}

                  {/* 上传进度 */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>上传进度</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    {uploadPreview ? (
                      <div className="space-y-4">
                        <Avatar className="w-24 h-24 mx-auto">
                          <AvatarImage src={uploadPreview} alt="上传预览" />
                          <AvatarFallback>预览</AvatarFallback>
                        </Avatar>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setUploadPreview('');
                              setUploadedFile(null);
                              setSelectedAvatar(null);
                              setUploadError('');
                            }}
                            className="flex-1"
                            disabled={isUploading}
                          >
                            重新选择
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          点击选择或拖拽图片文件
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          支持 JPEG、PNG、GIF、WebP 格式，最大 5MB
                        </p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="avatar-upload"
                          disabled={isUploading}
                        />
                        <label htmlFor="avatar-upload">
                          <Button
                            variant="outline"
                            className="cursor-pointer"
                            disabled={isUploading}
                          >
                            {isUploading ? '处理中...' : '选择文件'}
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={isUploading}
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedAvatar || isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      上传中...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      确认选择
                    </>
                  )}
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
