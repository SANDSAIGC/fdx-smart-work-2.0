// 头像缓存管理服务
// 实现 Supabase Storage + localStorage 混合存储策略

interface CacheEntry {
  url: string;
  timestamp: number;
  userId: string;
  source: 'supabase' | 'local';
}

interface CacheMetadata {
  lastSync: number;
  version: string;
  entries: Record<string, CacheEntry>;
}

export class AvatarCacheService {
  private static readonly CACHE_KEY = 'fdx_avatar_cache';
  private static readonly CACHE_VERSION = '1.0.0';
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时
  private static readonly SYNC_INTERVAL = 60 * 60 * 1000; // 1小时

  // 获取缓存元数据
  private static getCacheMetadata(): CacheMetadata {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const metadata = JSON.parse(cached) as CacheMetadata;
        // 检查版本兼容性
        if (metadata.version === this.CACHE_VERSION) {
          return metadata;
        }
      }
    } catch (error) {
      console.warn('读取头像缓存失败:', error);
    }

    // 返回默认元数据
    return {
      lastSync: 0,
      version: this.CACHE_VERSION,
      entries: {}
    };
  }

  // 保存缓存元数据
  private static saveCacheMetadata(metadata: CacheMetadata): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('保存头像缓存失败:', error);
    }
  }

  // 获取用户头像（优先使用缓存）
  static async getUserAvatar(userId: string): Promise<string | null> {
    const metadata = this.getCacheMetadata();
    const cacheEntry = metadata.entries[userId];

    // 检查缓存是否有效
    if (cacheEntry && this.isCacheValid(cacheEntry)) {
      console.log(`使用缓存头像: ${userId}`);
      return cacheEntry.url;
    }

    // 缓存无效或不存在，从API获取
    try {
      const response = await fetch(`/api/users?id=${userId}`);
      const result = await response.json();

      if (result.success && result.data.avatar_url) {
        // 更新缓存
        this.setCachedAvatar(userId, result.data.avatar_url, 'supabase');
        return result.data.avatar_url;
      }
    } catch (error) {
      console.error('从API获取头像失败:', error);
    }

    // 如果API失败，尝试使用过期的缓存
    if (cacheEntry) {
      console.warn(`使用过期缓存头像: ${userId}`);
      return cacheEntry.url;
    }

    return null;
  }

  // 设置缓存头像
  static setCachedAvatar(userId: string, avatarUrl: string, source: 'supabase' | 'local' = 'supabase'): void {
    const metadata = this.getCacheMetadata();
    
    metadata.entries[userId] = {
      url: avatarUrl,
      timestamp: Date.now(),
      userId,
      source
    };

    this.saveCacheMetadata(metadata);
  }

  // 检查缓存是否有效
  private static isCacheValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age < this.CACHE_EXPIRY;
  }

  // 清理过期缓存
  static cleanExpiredCache(): number {
    const metadata = this.getCacheMetadata();
    const now = Date.now();
    let cleanedCount = 0;

    Object.keys(metadata.entries).forEach(userId => {
      const entry = metadata.entries[userId];
      if (!this.isCacheValid(entry)) {
        delete metadata.entries[userId];
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.saveCacheMetadata(metadata);
      console.log(`清理了 ${cleanedCount} 个过期头像缓存`);
    }

    return cleanedCount;
  }

  // 同步所有缓存的头像
  static async syncAllAvatars(): Promise<void> {
    const metadata = this.getCacheMetadata();
    const now = Date.now();

    // 检查是否需要同步
    if (now - metadata.lastSync < this.SYNC_INTERVAL) {
      return;
    }

    console.log('开始同步头像缓存...');
    let syncCount = 0;

    for (const userId of Object.keys(metadata.entries)) {
      try {
        const response = await fetch(`/api/users?id=${userId}`);
        const result = await response.json();

        if (result.success && result.data.avatar_url) {
          const currentEntry = metadata.entries[userId];
          
          // 如果URL发生变化，更新缓存
          if (currentEntry.url !== result.data.avatar_url) {
            this.setCachedAvatar(userId, result.data.avatar_url, 'supabase');
            syncCount++;
          }
        }
      } catch (error) {
        console.error(`同步用户 ${userId} 头像失败:`, error);
      }
    }

    // 更新同步时间
    metadata.lastSync = now;
    this.saveCacheMetadata(metadata);

    console.log(`头像缓存同步完成，更新了 ${syncCount} 个头像`);
  }

  // 预加载头像（提升用户体验）
  static preloadAvatar(avatarUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('头像预加载失败'));
      img.src = avatarUrl;
    });
  }

  // 批量预加载头像
  static async preloadAvatars(avatarUrls: string[]): Promise<void> {
    const promises = avatarUrls.map(url => 
      this.preloadAvatar(url).catch(error => 
        console.warn(`预加载头像失败: ${url}`, error)
      )
    );

    await Promise.allSettled(promises);
  }

  // 获取缓存统计信息
  static getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    lastSync: Date | null;
    cacheSize: string;
  } {
    const metadata = this.getCacheMetadata();
    const entries = Object.values(metadata.entries);
    
    const validEntries = entries.filter(entry => this.isCacheValid(entry));
    const expiredEntries = entries.filter(entry => !this.isCacheValid(entry));

    // 估算缓存大小
    const cacheString = JSON.stringify(metadata);
    const cacheSize = `${(cacheString.length / 1024).toFixed(2)} KB`;

    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: expiredEntries.length,
      lastSync: metadata.lastSync > 0 ? new Date(metadata.lastSync) : null,
      cacheSize
    };
  }

  // 清空所有缓存
  static clearAllCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    console.log('已清空所有头像缓存');
  }

  // 初始化缓存服务
  static initialize(): void {
    // 清理过期缓存
    this.cleanExpiredCache();

    // 设置定期同步
    setInterval(() => {
      this.syncAllAvatars().catch(error => 
        console.error('定期同步头像缓存失败:', error)
      );
    }, this.SYNC_INTERVAL);

    console.log('头像缓存服务已初始化');
  }
}

// 自动初始化（仅在浏览器环境中）
if (typeof window !== 'undefined') {
  // 延迟初始化，避免阻塞页面加载
  setTimeout(() => {
    AvatarCacheService.initialize();
  }, 1000);
}
