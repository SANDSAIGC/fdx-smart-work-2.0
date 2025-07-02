import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 添加网络相关配置
  serverExternalPackages: [],

  // 添加 headers 配置来处理可能的 CORS 问题
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
