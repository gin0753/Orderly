import type { NextConfig } from "next";

const configuredApiOrigin = process.env.ORDERLY_API_ORIGIN?.trim();
if (process.env.NODE_ENV === "production" && !configuredApiOrigin) {
  throw new Error("ORDERLY_API_ORIGIN is required for a production web build.");
}
const apiOrigin = configuredApiOrigin ?? "http://localhost:4000";
const parsedApiOrigin = new URL(apiOrigin);
if (
  parsedApiOrigin.origin !== apiOrigin ||
  !["http:", "https:"].includes(parsedApiOrigin.protocol) ||
  (process.env.NODE_ENV === "production" &&
    process.env.ORDERLY_BROWSER_PRODUCTION !== "1" &&
    parsedApiOrigin.protocol !== "https:")
) {
  throw new Error("ORDERLY_API_ORIGIN must be an exact HTTPS origin in production.");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
};

export default nextConfig;
