import type { NextConfig } from "next";

const isDocker = process.env.DOCKER_ENV === "true";

const GATEWAY_URL = isDocker 
  ? "http://api-gateway:8080"
  : "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  skipTrailingSlashRedirect: true,

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  async rewrites() {
    return [{
      source: "/api/gateway/:path*",
      destination: `${GATEWAY_URL}/:path*`,
    }];
  },

  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};

export default nextConfig;