import type { NextConfig } from "next";
import path from "node:path";

const configuredBackendApiUrl =
  process.env.BACKEND_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  "http://localhost:4000/api/v1";

const backendApiUrl = new URL(configuredBackendApiUrl);
if (!["http:", "https:"].includes(backendApiUrl.protocol)) {
  throw new Error("Backend API URL must use HTTP or HTTPS");
}

const backendApiBaseUrl = backendApiUrl.toString().replace(/\/$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendApiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
