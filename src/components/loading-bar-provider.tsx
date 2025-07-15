"use client";

import { useLoadingBar } from "@/hooks/use-loading-bar";

interface LoadingBarProviderProps {
  children: React.ReactNode;
}

export function LoadingBarProvider({ children }: LoadingBarProviderProps) {
  useLoadingBar();
  
  return <>{children}</>;
}
