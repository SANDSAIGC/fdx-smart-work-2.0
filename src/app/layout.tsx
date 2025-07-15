import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import { GlobalLoadingBar } from "@/components/global-loading-bar";
import { LoadingBarProvider } from "@/components/loading-bar-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Supabase App",
  description: "现代化 Next.js + Supabase 应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <LoadingBarProvider>
              <GlobalLoadingBar />
              {children}
            </LoadingBarProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
