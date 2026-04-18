import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  output: 'standalone',
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/**/*'],
  },
};

export default nextConfig;
