import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 添加网络相关配置
  serverExternalPackages: [],

  // 配置API路由的请求体大小限制
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb', // 设置为15MB以支持10MB的图片上传
    },
  },

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
