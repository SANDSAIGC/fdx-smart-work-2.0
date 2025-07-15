'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AvatarCacheDebug } from '@/components/debug/avatar-cache-debug';
import { Footer } from '@/components/ui/footer';

export default function AvatarCacheDebugPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                返回
              </Button>
              <h1 className="text-xl font-semibold">头像缓存调试</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 页面说明 */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h2 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              开发调试工具
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              此页面用于监控和管理头像缓存系统的运行状态。在生产环境中，此页面应该被移除或限制访问权限。
            </p>
          </div>

          {/* 调试工具 */}
          <div className="flex justify-center">
            <AvatarCacheDebug />
          </div>

          {/* 技术说明 */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium">技术实现说明</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">混合存储策略</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 优先使用 localStorage 缓存</li>
                  <li>• 定期从 Supabase 同步数据</li>
                  <li>• 自动清理过期缓存条目</li>
                  <li>• 支持离线访问已缓存头像</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">性能优化</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 图片预加载机制</li>
                  <li>• 压缩上传减少存储空间</li>
                  <li>• 智能缓存失效策略</li>
                  <li>• 批量操作减少API调用</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 缓存配置信息 */}
          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">缓存配置</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-background rounded p-3">
                <div className="font-medium">缓存过期时间</div>
                <div className="text-muted-foreground">24 小时</div>
              </div>
              <div className="bg-background rounded p-3">
                <div className="font-medium">同步间隔</div>
                <div className="text-muted-foreground">1 小时</div>
              </div>
              <div className="bg-background rounded p-3">
                <div className="font-medium">存储位置</div>
                <div className="text-muted-foreground">localStorage</div>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-muted/30 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">快速操作</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/profile')}
              >
                查看用户资料
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/avatar-selector')}
              >
                头像选择器
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/api/users?id=user_001', '_blank')}
              >
                测试用户API
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const stats = JSON.stringify(localStorage.getItem('fdx_avatar_cache'), null, 2);
                  console.log('当前缓存数据:', stats);
                  alert('缓存数据已输出到控制台');
                }}
              >
                查看原始缓存
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
