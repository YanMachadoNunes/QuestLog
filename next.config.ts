import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
