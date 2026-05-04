import type { NextConfig } from "next";
import { appProperties } from "./config/app-properties";

const remotePatterns = appProperties.media.remoteImageHost
  ? [
      {
        protocol: "https" as const,
        hostname: appProperties.media.remoteImageHost,
        pathname: "/**",
      },
    ]
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.29.193"],
  devIndicators: false,
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 7,
    qualities: [75],
    remotePatterns,
  },
};

export default nextConfig;
