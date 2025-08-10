import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reduce client bundle size by optimizing per-module imports
    optimizePackageImports: [
      "lucide-react",
    ],
  },
};

export default nextConfig;
