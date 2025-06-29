"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useLoadingBar() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const triggerLoadingStart = () => {
      window.dispatchEvent(new CustomEvent('routeChangeStart'));
    };

    const triggerLoadingComplete = () => {
      window.dispatchEvent(new CustomEvent('routeChangeComplete'));
    };

    // 重写router.push方法来触发加载事件
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;
    const originalForward = router.forward;

    router.push = (...args) => {
      triggerLoadingStart();
      return originalPush.apply(router, args);
    };

    router.replace = (...args) => {
      triggerLoadingStart();
      return originalReplace.apply(router, args);
    };

    router.back = () => {
      triggerLoadingStart();
      return originalBack.apply(router);
    };

    router.forward = () => {
      triggerLoadingStart();
      return originalForward.apply(router);
    };

    // 监听路径变化来触发完成事件
    const handlePathChange = () => {
      triggerLoadingComplete();
    };

    // 使用MutationObserver监听DOM变化
    const observer = new MutationObserver(() => {
      triggerLoadingComplete();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    // 页面加载完成时触发
    if (document.readyState === 'complete') {
      triggerLoadingComplete();
    } else {
      window.addEventListener('load', triggerLoadingComplete);
    }

    return () => {
      // 恢复原始方法
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
      router.forward = originalForward;
      
      observer.disconnect();
      window.removeEventListener('load', triggerLoadingComplete);
    };
  }, [router, pathname]);
}

// 手动触发加载状态的工具函数
export const triggerLoading = {
  start: () => window.dispatchEvent(new CustomEvent('routeChangeStart')),
  complete: () => window.dispatchEvent(new CustomEvent('routeChangeComplete'))
};
