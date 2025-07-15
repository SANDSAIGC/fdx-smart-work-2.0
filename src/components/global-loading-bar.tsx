"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export function GlobalLoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let resetTimer: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);
      
      // 模拟进度条增长
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90; // 停在90%，等待实际加载完成
          }
          return prev + Math.random() * 15;
        });
      }, 100);
    };

    const stopLoading = () => {
      clearInterval(progressTimer);
      setProgress(100);
      
      // 100%后延迟隐藏
      resetTimer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    };

    // 监听路由变化
    const handleRouteChangeStart = () => {
      startLoading();
    };

    const handleRouteChangeComplete = () => {
      stopLoading();
    };

    // 监听浏览器导航事件
    const handleBeforeUnload = () => {
      startLoading();
    };

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoading) {
        stopLoading();
      }
    };

    // 添加事件监听器
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 监听Next.js路由事件（通过自定义事件）
    window.addEventListener('routeChangeStart', handleRouteChangeStart);
    window.addEventListener('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(resetTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('routeChangeStart', handleRouteChangeStart);
      window.removeEventListener('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-background/20 backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-300 ease-out shadow-lg shadow-primary/20"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg,
              hsl(var(--primary)) 0%,
              hsl(var(--primary)) 50%,
              hsl(var(--primary)/0.9) 100%
            )`,
            boxShadow: `0 0 10px hsl(var(--primary)/0.4), 0 0 20px hsl(var(--primary)/0.2)`
          }}
        />
      </div>
    </div>
  );
}
