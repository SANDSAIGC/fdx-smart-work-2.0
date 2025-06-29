'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarCacheService } from '@/lib/avatar-cache';
import { 
  RefreshCw, 
  Trash2, 
  Database, 
  Clock, 
  HardDrive,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  lastSync: Date | null;
  cacheSize: string;
}

export function AvatarCacheDebug() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  // 加载缓存统计信息
  const loadStats = () => {
    try {
      const cacheStats = AvatarCacheService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('加载缓存统计失败:', error);
    }
  };

  // 同步缓存
  const handleSync = async () => {
    setIsLoading(true);
    setLastAction('同步中...');
    try {
      await AvatarCacheService.syncAllAvatars();
      setLastAction('同步完成');
      loadStats();
    } catch (error) {
      setLastAction('同步失败');
      console.error('同步缓存失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 清理过期缓存
  const handleCleanup = () => {
    setLastAction('清理中...');
    try {
      const cleanedCount = AvatarCacheService.cleanExpiredCache();
      setLastAction(`清理了 ${cleanedCount} 个过期缓存`);
      loadStats();
    } catch (error) {
      setLastAction('清理失败');
      console.error('清理缓存失败:', error);
    }
  };

  // 清空所有缓存
  const handleClearAll = () => {
    if (confirm('确定要清空所有头像缓存吗？')) {
      setLastAction('清空中...');
      try {
        AvatarCacheService.clearAllCache();
        setLastAction('已清空所有缓存');
        loadStats();
      } catch (error) {
        setLastAction('清空失败');
        console.error('清空缓存失败:', error);
      }
    }
  };

  // 初始化加载
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // 每5秒刷新一次
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            头像缓存调试工具
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">加载缓存信息中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          头像缓存调试工具
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 缓存统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.totalEntries}</div>
            <div className="text-xs text-muted-foreground">总缓存数</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.validEntries}</div>
            <div className="text-xs text-muted-foreground">有效缓存</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.expiredEntries}</div>
            <div className="text-xs text-muted-foreground">过期缓存</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.cacheSize}</div>
            <div className="text-xs text-muted-foreground">缓存大小</div>
          </div>
        </div>

        {/* 最后同步时间 */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            最后同步: {stats.lastSync ? stats.lastSync.toLocaleString() : '从未同步'}
          </span>
          {stats.lastSync && (
            <Badge variant={
              Date.now() - stats.lastSync.getTime() < 60 * 60 * 1000 ? 'default' : 'secondary'
            }>
              {Date.now() - stats.lastSync.getTime() < 60 * 60 * 1000 ? '最近' : '较久'}
            </Badge>
          )}
        </div>

        {/* 缓存健康状态 */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          {stats.expiredEntries === 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">缓存状态良好</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600">
                发现 {stats.expiredEntries} 个过期缓存，建议清理
              </span>
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            onClick={loadStats}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            刷新
          </Button>
          <Button
            onClick={handleSync}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <Database className="h-3 w-3" />
            {isLoading ? '同步中' : '同步'}
          </Button>
          <Button
            onClick={handleCleanup}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <HardDrive className="h-3 w-3" />
            清理
          </Button>
          <Button
            onClick={handleClearAll}
            variant="destructive"
            size="sm"
            className="flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            清空
          </Button>
        </div>

        {/* 最后操作状态 */}
        {lastAction && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">{lastAction}</span>
          </div>
        )}

        {/* 使用说明 */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>刷新:</strong> 重新加载缓存统计信息</p>
          <p><strong>同步:</strong> 从服务器同步最新的头像数据</p>
          <p><strong>清理:</strong> 删除过期的缓存条目</p>
          <p><strong>清空:</strong> 删除所有缓存数据（谨慎使用）</p>
        </div>
      </CardContent>
    </Card>
  );
}
