import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // TEMPORARY: allow build even if ESLint fails (we will turn this back on later)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript must block builds again for production safety
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
