import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
