import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/dashboard/:path*',
          destination: '/:path*',
          has: [
            {
              type: 'cookie',
              key: 'auth-token',
            },
          ],
        },
      ],
      afterFiles: [
        {
          source: '/dashboard/:path*',
          destination: '/login',
        },
      ],
    };
  },
};

export default nextConfig;
