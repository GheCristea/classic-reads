import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure gzip compression in production server
  compress: true,
  experimental: {
    // Reduce client bundle size by optimizing per-module imports
    optimizePackageImports: [
      "lucide-react",
    ],
  },
  // Useful cache headers for static assets (CSS/JS). HTML caching is managed by Next/ISR.
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/css/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
